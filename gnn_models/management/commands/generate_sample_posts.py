"""
Django management command to generate sample posts using semantic embeddings
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from blog.models import Post, Category, Tag
from accounts.models import CustomUser
import logging
import random
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Generate sample posts with realistic content using semantic embeddings for diversity'

    def add_arguments(self, parser):
        parser.add_argument(
            '--count',
            type=int,
            default=100,
            help='Total number of posts to generate (default: 100)'
        )
        parser.add_argument(
            '--check-diversity',
            action='store_true',
            help='Use sentence transformers to ensure semantic diversity'
        )

    def handle(self, *args, **options):
        try:
            from gnn_models.integration import gnn_manager

            total_posts = options['count']
            check_diversity = options['check_diversity']

            # Initialize embedding manager if checking diversity
            if check_diversity:
                if not gnn_manager.models_loaded:
                    gnn_manager.initialize_models()

                if not gnn_manager.embedding_manager or not gnn_manager.embedding_manager.available:
                    self.stdout.write(self.style.WARNING('Sentence transformers not available - skipping diversity check'))
                    check_diversity = False

            self.stdout.write(f'Generating {total_posts} sample posts...')
            if check_diversity:
                self.stdout.write('✅ Semantic diversity checking enabled')

            # Get categories and users
            categories = list(Category.objects.all())
            users = list(CustomUser.objects.all())

            if not categories:
                self.stdout.write(self.style.ERROR('No categories found. Please create categories first.'))
                return

            if not users:
                self.stdout.write(self.style.ERROR('No users found. Please create users first.'))
                return

            # Define post distribution per category
            category_distribution = {
                'Technology': 20,
                'Science': 20,
                'Arts': 15,
                'Sport': 20,
                'Business': 15,
                'Motoryzacja': 10
            }

            # Generate posts by category
            generated_count = 0
            generated_titles = []  # Track for diversity

            for category in categories:
                target_count = category_distribution.get(category.name, 0)
                if target_count == 0:
                    continue

                self.stdout.write(f'\\nGenerating {target_count} posts for category: {category.name}')

                category_posts = self.generate_posts_for_category(
                    category, target_count, users, check_diversity, generated_titles
                )

                generated_count += len(category_posts)
                generated_titles.extend([post.title for post in category_posts])

            self.stdout.write(
                self.style.SUCCESS(f'\\n✅ Successfully generated {generated_count} posts!')
            )

            # Generate embeddings for new posts if available
            if check_diversity:
                self.stdout.write('\\nGenerating embeddings for new posts...')
                self.generate_embeddings_for_posts()

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error: {e}'))
            logger.error(f"Sample post generation failed: {e}")

    def generate_posts_for_category(self, category, count, users, check_diversity, existing_titles):
        """Generate posts for a specific category"""

        # Get seed topics and templates for each category
        seed_data = self.get_category_seed_data(category.name)
        seeds = seed_data['seeds']
        templates = seed_data['templates']
        tags_pool = seed_data['tags']

        generated_posts = []

        for i in range(count):
            try:
                # Select random template and seed
                template = random.choice(templates)
                seed_topic = random.choice(seeds)

                # Generate title and content
                title = self.generate_title(template, seed_topic, category.name)
                content = self.generate_content(seed_topic, category.name)

                # Check diversity if enabled
                if check_diversity and existing_titles:
                    if not self.check_title_diversity(title, existing_titles):
                        # Try again with different seed
                        seed_topic = random.choice(seeds)
                        title = self.generate_title(template, seed_topic, category.name)

                # Create post
                post = Post.objects.create(
                    title=title,
                    content=content,
                    author=random.choice(users),
                    primary_category=category,
                    created_at=self.random_datetime()
                )

                # Add additional categories for cross-connections (30% chance)
                if random.random() < 0.3:
                    additional_cats = self.get_related_categories(category, users)
                    for add_cat in additional_cats:
                        post.additional_categories.add(add_cat)

                # Add random tags
                if tags_pool:
                    num_tags = random.randint(1, min(3, len(tags_pool)))
                    selected_tags = random.sample(tags_pool, num_tags)

                    for tag_name in selected_tags:
                        tag, _ = Tag.objects.get_or_create(name=tag_name)
                        post.tags.add(tag)

                generated_posts.append(post)
                self.stdout.write(f'  ✓ Created: "{title[:50]}..."')

            except Exception as e:
                self.stdout.write(f'  ✗ Error creating post {i+1}: {e}')

        return generated_posts

    def get_category_seed_data(self, category_name):
        """Get seed topics, templates, and tags for each category"""

        data = {
            'Technology': {
                'seeds': [
                    'artificial intelligence', 'web development', 'mobile apps', 'cloud computing',
                    'machine learning', 'cybersecurity', 'blockchain', 'IoT devices',
                    'programming languages', 'software architecture', 'API development',
                    'database optimization', 'DevOps practices', 'microservices'
                ],
                'templates': [
                    'Jak używać {seed} w praktycznych projektach',
                    'Przegląd najlepszych rozwiązań {seed} w 2025',
                    'Tutorial: {seed} dla początkujących programistów',
                    'Porównanie różnych podejść do {seed}',
                    'Implementacja {seed} w środowisku produkcyjnym',
                    'Trendy w {seed} - co warto wiedzieć',
                    'Optymalizacja wydajności {seed}',
                    'Bezpieczeństwo w {seed} - najważniejsze zasady'
                ],
                'tags': ['programming', 'software', 'tech', 'code', 'development', 'api', 'framework']
            },
            'Science': {
                'seeds': [
                    'climate change research', 'space exploration', 'quantum physics', 'medical breakthroughs',
                    'renewable energy', 'genetic engineering', 'neuroscience', 'artificial biology',
                    'materials science', 'environmental protection', 'pharmaceutical research',
                    'astronomy discoveries', 'data analysis methods', 'scientific methodology'
                ],
                'templates': [
                    'Najnowsze odkrycia w dziedzinie {seed}',
                    'Wpływ {seed} na przyszłość ludzkości',
                    'Analiza najważniejszych badań {seed}',
                    'Przełomowe technologie w {seed}',
                    'Etyczne aspekty {seed}',
                    'Praktyczne zastosowania {seed}',
                    'Historia rozwoju {seed}',
                    'Wyzwania i perspektywy {seed}'
                ],
                'tags': ['research', 'science', 'discovery', 'study', 'experiment', 'analysis', 'breakthrough']
            },
            'Arts': {
                'seeds': [
                    'digital art', 'contemporary painting', 'sculpture techniques', 'photography trends',
                    'theater productions', 'film making', 'music composition', 'literary criticism',
                    'art exhibitions', 'creative writing', 'design thinking', 'cultural events',
                    'art history', 'multimedia installations'
                ],
                'templates': [
                    'Eksploracja {seed} we współczesnej sztuce',
                    'Techniques and inspiration in {seed}',
                    'Historia i ewolucja {seed}',
                    'Artyści pionierzy {seed}',
                    'Krytyczna analiza {seed}',
                    'Wpływ technologii na {seed}',
                    'Warszaty i kursy {seed}',
                    'Trendy i kierunki rozwoju {seed}'
                ],
                'tags': ['art', 'creative', 'design', 'culture', 'artistic', 'exhibition', 'gallery']
            },
            'Sport': {
                'seeds': [
                    'football training', 'basketball strategies', 'running techniques', 'swimming methods',
                    'cycling performance', 'tennis skills', 'fitness workouts', 'nutrition for athletes',
                    'injury prevention', 'sports psychology', 'team building', 'competition preparation',
                    'sports equipment', 'olympic sports'
                ],
                'templates': [
                    'Jak poprawić wyniki w {seed}',
                    'Profesjonalne techniki {seed}',
                    'Trening {seed} dla amatorów',
                    'Psychologia {seed} - mental coaching',
                    'Ekwipunek i sprzęt do {seed}',
                    'Dieta i odżywianie w {seed}',
                    'Unikanie kontuzji w {seed}',
                    'Historia i legendy {seed}'
                ],
                'tags': ['sport', 'training', 'fitness', 'athlete', 'competition', 'performance', 'health']
            },
            'Business': {
                'seeds': [
                    'startup funding', 'marketing strategies', 'leadership skills', 'project management',
                    'digital transformation', 'customer experience', 'financial planning', 'team management',
                    'business analytics', 'innovation processes', 'market research', 'sales techniques',
                    'entrepreneurship', 'corporate culture'
                ],
                'templates': [
                    'Strategie {seed} dla małych firm',
                    'Jak wykorzystać {seed} do zwiększenia zysków',
                    'Najlepsze praktyki {seed} w 2025',
                    'Case study: sukces dzięki {seed}',
                    'Błędy w {seed} i jak ich unikać',
                    'Przyszłość {seed} w dobie cyfryzacji',
                    'ROI w {seed} - jak mierzyć efektywność',
                    'Trendy w {seed} na najbliższe lata'
                ],
                'tags': ['business', 'management', 'strategy', 'marketing', 'finance', 'leadership', 'growth']
            },
            'Motoryzacja': {
                'seeds': [
                    'electric vehicles', 'engine tuning', 'car modifications', 'automotive technology',
                    'racing techniques', 'car maintenance', 'luxury cars', 'motorcycle reviews',
                    'automotive industry', 'fuel efficiency', 'car safety', 'autonomous driving',
                    'classic cars', 'automotive design'
                ],
                'templates': [
                    'Przegląd najnowszych trendów w {seed}',
                    'Praktyczny poradnik {seed}',
                    'Porównanie różnych rozwiązań {seed}',
                    'DIY: {seed} we własnym garażu',
                    'Koszty i korzyści {seed}',
                    'Technologie przyszłości w {seed}',
                    'Historia i ewolucja {seed}',
                    'Eksperci o {seed} - opinie i rady'
                ],
                'tags': ['cars', 'automotive', 'driving', 'vehicle', 'engine', 'tuning', 'racing']
            }
        }

        return data.get(category_name, {
            'seeds': ['general topic'],
            'templates': ['Post about {seed}'],
            'tags': ['general']
        })

    def generate_title(self, template, seed_topic, category_name):
        """Generate a realistic title"""
        # Replace {seed} placeholder with actual topic
        title = template.replace('{seed}', seed_topic)

        # Add some variation
        variations = [
            f"{title}",
            f"{title} - kompletny przewodnik",
            f"{title} w Polsce",
            f"{title}: praktyczne wskazówki",
            f"{title} - co warto wiedzieć?"
        ]

        return random.choice(variations)

    def generate_content(self, seed_topic, category_name):
        """Generate realistic content for the post"""

        # Base content templates
        intros = [
            f"W dzisiejszym artykule omówimy {seed_topic} i jego znaczenie w kontekście {category_name.lower()}.",
            f"Temat {seed_topic} staje się coraz bardziej popularny, dlatego warto go zgłębić.",
            f"Czy zastanawialiście się kiedyś nad {seed_topic}? Oto kompletny przegląd tematu.",
            f"W ostatnim czasie {seed_topic} zyskuje na znaczeniu. Sprawdźmy dlaczego.",
        ]

        middle_parts = [
            f"Kluczowe aspekty {seed_topic} obejmują wiele istotnych elementów, które warto rozważyć.",
            f"Praktyczne zastosowanie {seed_topic} może przynieść wymierne korzyści.",
            f"Eksperci zgodnie twierdzą, że {seed_topic} to jedna z najważniejszych dziedzin do rozwoju.",
            f"Warto zwrócić uwagę na najnowsze trendy związane z {seed_topic}.",
        ]

        conclusions = [
            f"Podsumowując, {seed_topic} oferuje wiele możliwości rozwoju i zastosowań.",
            f"Zachęcam do dalszego zgłębiania tematu {seed_topic} i praktycznego zastosowania zdobytej wiedzy.",
            f"Temat {seed_topic} z pewnością będzie się dynamicznie rozwijał w najbliższych latach.",
            f"Mam nadzieję, że ten przegląd {seed_topic} okazał się pomocny.",
        ]

        # Generate content
        content = f"{random.choice(intros)}\\n\\n"
        content += f"{random.choice(middle_parts)}\\n\\n"
        content += "Najważniejsze punkty do zapamiętania:\\n"
        content += f"• {seed_topic} wymaga systematycznego podejścia\\n"
        content += f"• Praktyczne zastosowanie jest kluczowe dla sukcesu\\n"
        content += f"• Warto śledzić najnowsze trendy i rozwój technologii\\n\\n"
        content += f"{random.choice(conclusions)}"

        return content

    def check_title_diversity(self, new_title, existing_titles):
        """Check if new title is semantically diverse enough"""
        try:
            from gnn_models.integration import gnn_manager

            if not gnn_manager.embedding_manager:
                return True  # Skip check if not available

            # Generate embedding for new title
            new_embedding = gnn_manager.embedding_manager.encode_texts([new_title])[0]

            # Check similarity with existing titles (sample to avoid too much computation)
            sample_titles = random.sample(existing_titles, min(10, len(existing_titles)))
            existing_embeddings = gnn_manager.embedding_manager.encode_texts(sample_titles)

            # Check if any similarity is too high
            for existing_embedding in existing_embeddings:
                similarity = gnn_manager.embedding_manager.calculate_similarity(
                    new_embedding, existing_embedding
                )
                if similarity > 0.8:  # Too similar
                    return False

            return True

        except Exception as e:
            logger.warning(f"Diversity check failed: {e}")
            return True  # Allow on error

    def random_datetime(self):
        """Generate random datetime within last 30 days"""
        now = datetime.now()
        days_back = random.randint(1, 30)
        hours_back = random.randint(0, 23)
        minutes_back = random.randint(0, 59)

        return now - timedelta(days=days_back, hours=hours_back, minutes=minutes_back)

    def generate_embeddings_for_posts(self):
        """Generate embeddings for recently created posts"""
        try:
            from gnn_models.integration import gnn_manager

            # Get recent posts without embeddings
            recent_posts = Post.objects.order_by('-created_at')[:50]  # Last 50 posts

            success_count = 0
            for post in recent_posts:
                try:
                    embedding = gnn_manager.generate_post_embedding(post.id)
                    if embedding is not None:
                        gnn_manager.update_post_embedding_cache(post.id)
                        success_count += 1
                except Exception as e:
                    logger.warning(f"Failed to generate embedding for post {post.id}: {e}")

            self.stdout.write(f"Generated embeddings for {success_count} posts")

        except Exception as e:
            self.stdout.write(self.style.WARNING(f"Embedding generation failed: {e}"))

    def get_related_categories(self, primary_category, users):
        """Get categories that could be related to primary category"""

        # Define category relationships
        relationships = {
            'Technology': ['Science', 'Business'],
            'Science': ['Technology', 'Business'],
            'Arts': ['Business', 'Technology'],
            'Sport': ['Business', 'Technology'],
            'Business': ['Technology', 'Science', 'Arts', 'Sport', 'Motoryzacja'],
            'Motoryzacja': ['Technology', 'Business', 'Sport']
        }

        related_names = relationships.get(primary_category.name, [])

        # Get 1-2 random related categories
        if related_names:
            num_additional = random.randint(1, min(2, len(related_names)))
            selected_names = random.sample(related_names, num_additional)

            related_categories = []
            for name in selected_names:
                try:
                    cat = Category.objects.get(name=name)
                    related_categories.append(cat)
                except Category.DoesNotExist:
                    pass

            return related_categories

        return []