"""
Django management command to generate embeddings for posts, categories, and users
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from blog.models import Post, Category
from accounts.models import CustomUser
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Generate semantic embeddings for posts, categories, and users using sentence transformers'

    def add_arguments(self, parser):
        parser.add_argument(
            '--type',
            type=str,
            choices=['posts', 'categories', 'users', 'all'],
            default='all',
            help='Type of entities to generate embeddings for'
        )
        parser.add_argument(
            '--batch-size',
            type=int,
            default=10,
            help='Batch size for processing (default: 10)'
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force regenerate existing embeddings'
        )
        parser.add_argument(
            '--limit',
            type=int,
            help='Limit number of entities to process'
        )

    def handle(self, *args, **options):
        try:
            from gnn_models.integration import gnn_manager

            # Initialize GNN manager
            if not gnn_manager.models_loaded:
                gnn_manager.initialize_models()

            if not gnn_manager.embedding_manager or not gnn_manager.embedding_manager.available:
                self.stdout.write(
                    self.style.ERROR('Sentence transformers not available. Please install with: pip install sentence-transformers')
                )
                return

            self.stdout.write(
                self.style.SUCCESS(f'Using embedding model: {gnn_manager.embedding_manager.model_name}')
            )
            self.stdout.write(
                self.style.SUCCESS(f'Embedding dimension: {gnn_manager.embedding_manager.embedding_dim}')
            )

            entity_type = options['type']
            batch_size = options['batch_size']
            force = options['force']
            limit = options['limit']

            if entity_type in ['posts', 'all']:
                self.generate_post_embeddings(gnn_manager, batch_size, force, limit)

            if entity_type in ['categories', 'all']:
                self.generate_category_embeddings(gnn_manager, batch_size, force, limit)

            if entity_type in ['users', 'all']:
                self.generate_user_embeddings(gnn_manager, batch_size, force, limit)

            self.stdout.write(self.style.SUCCESS('Embedding generation completed successfully!'))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error: {e}'))
            logger.error(f"Embedding generation command failed: {e}")

    def generate_post_embeddings(self, gnn_manager, batch_size, force, limit):
        """Generate embeddings for posts"""
        self.stdout.write('Generating post embeddings...')

        # Get posts to process
        posts_queryset = Post.objects.select_related('primary_category', 'author').prefetch_related('tags')

        if not force:
            # Skip posts that already have embeddings
            try:
                from ai_models.models import PostEmbedding
                existing_post_ids = PostEmbedding.objects.filter(
                    model_name=gnn_manager.embedding_manager.model_name
                ).values_list('post_id', flat=True)
                posts_queryset = posts_queryset.exclude(id__in=existing_post_ids)
            except Exception:
                pass  # PostEmbedding model might not exist

        if limit:
            posts_queryset = posts_queryset[:limit]

        posts = list(posts_queryset)
        total_posts = len(posts)

        if total_posts == 0:
            self.stdout.write('No posts to process.')
            return

        self.stdout.write(f'Processing {total_posts} posts...')

        success_count = 0
        error_count = 0

        # Process in batches
        for i in range(0, total_posts, batch_size):
            batch_posts = posts[i:i + batch_size]

            self.stdout.write(f'Processing batch {i//batch_size + 1}/{(total_posts-1)//batch_size + 1}...')

            for post in batch_posts:
                try:
                    # Generate embedding
                    embedding = gnn_manager.generate_post_embedding(post.id)

                    if embedding is not None:
                        # Cache the embedding
                        cache_success = gnn_manager.update_post_embedding_cache(post.id)
                        if cache_success:
                            success_count += 1
                            self.stdout.write(f'✓ Post {post.id}: "{post.title[:50]}..."')
                        else:
                            error_count += 1
                            self.stdout.write(f'✗ Failed to cache embedding for post {post.id}')
                    else:
                        error_count += 1
                        self.stdout.write(f'✗ Failed to generate embedding for post {post.id}')

                except Exception as e:
                    error_count += 1
                    self.stdout.write(f'✗ Error processing post {post.id}: {e}')

        self.stdout.write(
            self.style.SUCCESS(f'Post embeddings completed: {success_count} successful, {error_count} errors')
        )

    def generate_category_embeddings(self, gnn_manager, batch_size, force, limit):
        """Generate embeddings for categories"""
        self.stdout.write('Generating category embeddings...')

        categories_queryset = Category.objects.all()

        if limit:
            categories_queryset = categories_queryset[:limit]

        categories = list(categories_queryset)
        total_categories = len(categories)

        if total_categories == 0:
            self.stdout.write('No categories to process.')
            return

        self.stdout.write(f'Processing {total_categories} categories...')

        success_count = 0
        error_count = 0

        for category in categories:
            try:
                # Generate embedding
                embedding = gnn_manager.generate_category_embedding(category.id)

                if embedding is not None:
                    success_count += 1
                    self.stdout.write(f'✓ Category {category.id}: "{category.name}"')
                else:
                    error_count += 1
                    self.stdout.write(f'✗ Failed to generate embedding for category {category.id}')

            except Exception as e:
                error_count += 1
                self.stdout.write(f'✗ Error processing category {category.id}: {e}')

        self.stdout.write(
            self.style.SUCCESS(f'Category embeddings completed: {success_count} successful, {error_count} errors')
        )

    def generate_user_embeddings(self, gnn_manager, batch_size, force, limit):
        """Generate embeddings for users"""
        self.stdout.write('Generating user embeddings...')

        users_queryset = CustomUser.objects.all()

        if limit:
            users_queryset = users_queryset[:limit]

        users = list(users_queryset)
        total_users = len(users)

        if total_users == 0:
            self.stdout.write('No users to process.')
            return

        self.stdout.write(f'Processing {total_users} users...')

        success_count = 0
        error_count = 0

        for user in users:
            try:
                # Generate embedding
                embedding = gnn_manager.generate_user_embedding(user.id)

                if embedding is not None:
                    success_count += 1
                    self.stdout.write(f'✓ User {user.id}: "{user.username}"')
                else:
                    error_count += 1
                    self.stdout.write(f'✗ Failed to generate embedding for user {user.id}')

            except Exception as e:
                error_count += 1
                self.stdout.write(f'✗ Error processing user {user.id}: {e}')

        self.stdout.write(
            self.style.SUCCESS(f'User embeddings completed: {success_count} successful, {error_count} errors')
        )