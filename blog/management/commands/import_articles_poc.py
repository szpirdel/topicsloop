"""
Django management command to import articles for proof-of-concept
Imports 15 articles from arXiv and DOAJ with AI-powered category assignment

Usage:
    python manage.py import_articles_poc
    python manage.py import_articles_poc --dry-run  # Preview without saving
"""

import arxiv
import requests
import logging
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from blog.models import Category, Post
from gnn_models.embeddings import get_embedding_manager
import numpy as np

logger = logging.getLogger(__name__)
User = get_user_model()


class ArticleImporter:
    """Handles article import with AI-powered categorization"""

    def __init__(self, dry_run=False):
        self.dry_run = dry_run
        self.embedding_manager = get_embedding_manager()
        self.category_embeddings = {}
        self._prepare_category_embeddings()

    def _prepare_category_embeddings(self):
        """Generate embeddings for all categories (name + description)"""
        logger.info("Generating category embeddings...")

        categories = Category.objects.all()
        for category in categories:
            # Combine category info for embedding
            combined_text = f"{category.name}"
            if category.description:
                combined_text += f" {category.description}"

            # Add hierarchical context
            if category.parent:
                parent_path = category.parent.get_full_path()
                combined_text = f"{parent_path} > {combined_text}"

            # Generate embedding
            embedding = self.embedding_manager.encode_texts([combined_text])[0]

            self.category_embeddings[category.id] = {
                'category': category,
                'embedding': embedding,
                'name': category.name,
                'full_path': category.get_full_path()
            }

        logger.info(f"Generated embeddings for {len(self.category_embeddings)} categories")

    def _find_best_categories(self, title, abstract, top_k=3, min_similarity=0.25):
        """
        Find best matching categories for article using AI embeddings

        Returns:
            List of (category, similarity_score) tuples
        """
        # Combine title and abstract
        combined_text = f"{title} {abstract}"

        # Generate embedding for article
        article_embedding = self.embedding_manager.encode_texts([combined_text])[0]

        # Calculate similarities with all categories
        similarities = []
        for cat_id, cat_data in self.category_embeddings.items():
            similarity = self.embedding_manager.calculate_similarity(
                article_embedding,
                cat_data['embedding']
            )

            if similarity >= min_similarity:
                similarities.append({
                    'category': cat_data['category'],
                    'similarity': float(similarity),
                    'name': cat_data['name'],
                    'path': cat_data['full_path']
                })

        # Sort by similarity (highest first)
        similarities.sort(key=lambda x: x['similarity'], reverse=True)

        return similarities[:top_k]

    def import_from_arxiv(self, queries, max_results_per_query=5):
        """Import articles from arXiv"""
        imported = []

        for query_info in queries:
            query = query_info['query']
            logger.info(f"Searching arXiv: {query}")

            try:
                # Search arXiv
                search = arxiv.Search(
                    query=query,
                    max_results=max_results_per_query,
                    sort_by=arxiv.SortCriterion.Relevance
                )

                for result in search.results():
                    article_data = {
                        'title': result.title,
                        'content': result.summary,
                        'source': 'arXiv',
                        'source_url': result.entry_id,
                        'source_id': result.entry_id.split('/')[-1],
                        'authors': [author.name for author in result.authors],
                        'published': result.published,
                        'expected_domain': query_info['expected_domain']
                    }

                    imported.append(article_data)
                    logger.info(f"  Found: {result.title[:50]}...")

            except Exception as e:
                logger.error(f"Error importing from arXiv ({query}): {e}")

        return imported

    def import_from_doaj(self, queries, max_results_per_query=3):
        """Import articles from DOAJ"""
        imported = []
        base_url = "https://doaj.org/api/search/articles"

        for query_info in queries:
            query = query_info['query']
            logger.info(f"Searching DOAJ: {query}")

            try:
                # Query DOAJ API (correct endpoint)
                params = {
                    'q': query,
                    'page': 1,
                    'pageSize': max_results_per_query
                }

                response = requests.get(base_url, params=params, timeout=30)

                if response.status_code == 200:
                    data = response.json()
                    results = data.get('results', [])

                    for result in results:
                        bibjson = result.get('bibjson', {})

                        # Extract article data
                        title = bibjson.get('title', 'No title')
                        abstract = bibjson.get('abstract', '')

                        # Get full text link if available
                        links = bibjson.get('link', [])
                        source_url = links[0].get('url', '') if links else ''

                        article_data = {
                            'title': title,
                            'content': abstract if abstract else f"Article from DOAJ: {title}",
                            'source': 'DOAJ',
                            'source_url': source_url,
                            'source_id': result.get('id', ''),
                            'authors': [author.get('name', 'Unknown') for author in bibjson.get('author', [])],
                            'published': bibjson.get('year', 'Unknown'),
                            'expected_domain': query_info['expected_domain']
                        }

                        imported.append(article_data)
                        logger.info(f"  Found: {title[:50]}...")
                else:
                    logger.warning(f"DOAJ API returned status {response.status_code}")

            except Exception as e:
                logger.error(f"Error importing from DOAJ ({query}): {e}")

        return imported

    def import_from_plos(self, queries, max_results_per_query=5):
        """Import articles from PLOS ONE with full text"""
        imported = []
        base_url = "http://api.plos.org/search"

        for query_info in queries:
            query = query_info['query']
            logger.info(f"Searching PLOS ONE: {query}")

            try:
                # Query PLOS Solr API
                params = {
                    'q': query,
                    'fl': 'id,title,abstract,author,publication_date,article_type',  # fields to return
                    'rows': max_results_per_query,
                    'wt': 'json',  # return JSON
                    'fq': 'doc_type:full AND article_type:"Research Article"'  # filter: full articles only
                }

                response = requests.get(base_url, params=params, timeout=30)

                if response.status_code == 200:
                    data = response.json()
                    docs = data.get('response', {}).get('docs', [])

                    for doc in docs:
                        title = doc.get('title', ['No title'])[0] if isinstance(doc.get('title'), list) else doc.get('title', 'No title')
                        abstract = doc.get('abstract', [''])[0] if isinstance(doc.get('abstract'), list) else doc.get('abstract', '')

                        # Get DOI and construct URLs
                        doi = doc.get('id', '')
                        source_url = f"https://journals.plos.org/plosone/article?id={doi}"
                        xml_url = f"https://journals.plos.org/plosone/article/file?id={doi}&type=manuscript"

                        # Try to fetch full text XML
                        full_text = self._fetch_plos_full_text(xml_url, doi)

                        # Use full text if available, otherwise use abstract
                        content = full_text if full_text else abstract

                        # Extract authors
                        authors_raw = doc.get('author', [])
                        if isinstance(authors_raw, list):
                            authors = authors_raw[:3]  # Limit to first 3 authors
                        else:
                            authors = [authors_raw] if authors_raw else ['Unknown']

                        article_data = {
                            'title': title,
                            'content': content,
                            'source': 'PLOS ONE',
                            'source_url': source_url,
                            'source_id': doi,
                            'authors': authors,
                            'published': doc.get('publication_date', 'Unknown'),
                            'expected_domain': query_info['expected_domain']
                        }

                        imported.append(article_data)
                        logger.info(f"  Found: {title[:50]}... ({len(content)} chars)")
                else:
                    logger.warning(f"PLOS API returned status {response.status_code}")

            except Exception as e:
                logger.error(f"Error importing from PLOS ({query}): {e}")

        return imported

    def _fetch_plos_full_text(self, xml_url, doi):
        """
        Fetch and parse full text from PLOS XML
        Returns extracted text content or None if failed
        """
        try:
            response = requests.get(xml_url, timeout=30)

            if response.status_code == 200:
                # Parse XML to extract text
                # For MVP, we'll use a simple approach - extract text from specific sections
                from xml.etree import ElementTree as ET

                root = ET.fromstring(response.content)

                # Extract text from body sections
                text_parts = []

                # Try to find body/sec elements (JATS XML structure)
                for sec in root.findall('.//{http://jats.nlm.nih.gov/publishing/1.0}sec'):
                    # Get section title
                    title_elem = sec.find('.//{http://jats.nlm.nih.gov/publishing/1.0}title')
                    if title_elem is not None and title_elem.text:
                        text_parts.append(f"\n## {title_elem.text}\n")

                    # Get paragraphs
                    for para in sec.findall('.//{http://jats.nlm.nih.gov/publishing/1.0}p'):
                        if para.text:
                            text_parts.append(para.text.strip())

                # If no structured sections found, try simpler extraction
                if not text_parts:
                    for para in root.findall('.//{http://jats.nlm.nih.gov/publishing/1.0}p'):
                        if para.text:
                            text_parts.append(para.text.strip())

                full_text = '\n\n'.join(text_parts)

                # Limit to reasonable length (first ~3000 words for MVP)
                words = full_text.split()[:3000]
                full_text = ' '.join(words)

                if full_text and len(full_text) > 500:  # Only return if we got substantial text
                    logger.info(f"  ✅ Extracted full text for {doi}: {len(full_text)} chars")
                    return full_text

            logger.warning(f"  ⚠️ Could not fetch full text for {doi}, will use abstract")
            return None

        except Exception as e:
            logger.warning(f"  ⚠️ Failed to parse XML for {doi}: {e}")
            return None

    def process_and_save_articles(self, articles, system_user):
        """Process articles with AI categorization and save to database"""
        results = {
            'imported': 0,
            'skipped': 0,
            'failed': 0,
            'details': []
        }

        for article in articles:
            try:
                # Check if already exists
                if Post.objects.filter(title=article['title']).exists():
                    logger.info(f"Skipping duplicate: {article['title'][:50]}...")
                    results['skipped'] += 1
                    continue

                # Find best categories using AI
                categories = self._find_best_categories(
                    article['title'],
                    article['content']
                )

                if not categories:
                    logger.warning(f"No suitable categories found for: {article['title'][:50]}...")
                    results['failed'] += 1
                    continue

                # Prepare category assignment
                primary_category = categories[0]['category']
                additional_categories = [c['category'] for c in categories[1:3]] if len(categories) > 1 else []

                detail = {
                    'title': article['title'][:100],
                    'source': article['source'],
                    'expected_domain': article.get('expected_domain', 'Unknown'),
                    'ai_primary': categories[0]['path'],
                    'ai_similarity': f"{categories[0]['similarity']:.3f}",
                    'ai_additional': [f"{c['path']} ({c['similarity']:.3f})" for c in categories[1:3]] if len(categories) > 1 else []
                }

                if not self.dry_run:
                    # Create post
                    post = Post.objects.create(
                        title=article['title'],
                        content=article['content'],
                        author=system_user,
                        primary_category=primary_category
                    )

                    # Add additional categories
                    if additional_categories:
                        post.additional_categories.set(additional_categories)

                    detail['post_id'] = post.id
                    logger.info(f"✅ Imported: {article['title'][:50]}... → {primary_category.get_full_path()}")
                else:
                    logger.info(f"[DRY RUN] Would import: {article['title'][:50]}... → {primary_category.get_full_path()}")

                results['imported'] += 1
                results['details'].append(detail)

            except Exception as e:
                logger.error(f"Failed to import article '{article['title'][:50]}': {e}")
                results['failed'] += 1

        return results


class Command(BaseCommand):
    help = 'Import ~18 articles for proof-of-concept (arXiv abstracts + PLOS ONE full texts) with AI categorization'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Preview import without saving to database',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']

        if dry_run:
            self.stdout.write(self.style.WARNING('🔍 DRY RUN MODE - No changes will be saved'))

        # Get or create system user for imports
        system_user, _ = User.objects.get_or_create(
            username='article_importer',
            defaults={
                'email': 'importer@topicsloop.local',
                'is_active': True
            }
        )

        # Initialize importer
        importer = ArticleImporter(dry_run=dry_run)

        # Define queries for different domains
        arxiv_queries = [
            {'query': 'cat:cs.AI', 'expected_domain': 'Computer Science > AI'},
            {'query': 'cat:cs.LG', 'expected_domain': 'Computer Science > Machine Learning'},
            {'query': 'cat:q-bio.NC', 'expected_domain': 'Life Sciences > Neuroscience'},
            {'query': 'cat:physics.med-ph', 'expected_domain': 'Physical Sciences > Medical Physics'},
        ]

        # PLOS ONE queries (biology, medicine, environmental science, sports)
        plos_queries = [
            {'query': 'neuroscience AND memory', 'expected_domain': 'Life Sciences > Neuroscience'},
            {'query': 'genetics AND evolution', 'expected_domain': 'Life Sciences > Biology'},
            {'query': 'climate change AND biodiversity', 'expected_domain': 'Environmental Sciences'},
            {'query': 'sports AND performance', 'expected_domain': 'Sports & Athletics'},
            {'query': 'psychology AND cognition', 'expected_domain': 'Social Sciences > Psychology'},
        ]

        self.stdout.write('📥 Starting article import (PoC: arXiv + PLOS ONE)...\n')

        # Import from arXiv (8 articles - abstracts)
        self.stdout.write(self.style.SUCCESS('🔬 Importing from arXiv (short abstracts)...'))
        arxiv_articles = importer.import_from_arxiv(arxiv_queries, max_results_per_query=2)
        self.stdout.write(f'  Found {len(arxiv_articles)} articles from arXiv\n')

        # Import from PLOS ONE (10 articles - full texts)
        self.stdout.write(self.style.SUCCESS('📚 Importing from PLOS ONE (full texts)...'))
        plos_articles = importer.import_from_plos(plos_queries, max_results_per_query=2)
        self.stdout.write(f'  Found {len(plos_articles)} articles from PLOS ONE\n')

        # Combine all articles
        all_articles = arxiv_articles + plos_articles
        self.stdout.write(f'\n📊 Total articles to process: {len(all_articles)}\n')

        # Process and save with AI categorization
        self.stdout.write(self.style.SUCCESS('🤖 Processing with AI categorization...\n'))
        results = importer.process_and_save_articles(all_articles, system_user)

        # Display results
        self.stdout.write('\n' + '='*70)
        self.stdout.write(self.style.SUCCESS(f'\n✅ Import complete!\n'))
        self.stdout.write(f'  Imported: {results["imported"]}')
        self.stdout.write(f'  Skipped (duplicates): {results["skipped"]}')
        self.stdout.write(f'  Failed: {results["failed"]}')

        # Show categorization details
        self.stdout.write('\n📋 AI Categorization Results:\n')
        for detail in results['details'][:10]:  # Show first 10
            self.stdout.write(f'\n  Title: {detail["title"]}')
            self.stdout.write(f'  Source: {detail["source"]} | Expected: {detail["expected_domain"]}')
            self.stdout.write(f'  AI Primary: {detail["ai_primary"]} (similarity: {detail["ai_similarity"]})')
            if detail.get('ai_additional'):
                self.stdout.write(f'  AI Additional: {", ".join(detail["ai_additional"])}')

        if len(results['details']) > 10:
            self.stdout.write(f'\n  ... and {len(results["details"]) - 10} more articles')

        self.stdout.write('\n' + '='*70)

        if dry_run:
            self.stdout.write(self.style.WARNING('\n⚠️  This was a DRY RUN - no data was saved'))
            self.stdout.write('Run without --dry-run to actually import articles\n')
        else:
            self.stdout.write(self.style.SUCCESS('\n🎉 Articles successfully imported to database!\n'))
