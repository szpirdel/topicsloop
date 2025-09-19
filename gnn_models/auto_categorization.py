"""
Auto-categorization system using sentence transformers
Analyzes post content and suggests additional categories based on semantic similarity
"""

import numpy as np
import logging
from typing import List, Dict, Tuple, Optional
from django.conf import settings

logger = logging.getLogger(__name__)


class AutoCategorizationEngine:
    """
    Uses sentence transformers to automatically suggest categories for posts
    based on semantic analysis of content
    """

    def __init__(self):
        self.embedding_manager = None
        self.category_embeddings = {}
        self.category_cache_valid = False
        self._initialize()

    def _initialize(self):
        """Initialize the embedding manager"""
        try:
            from .embeddings import get_embedding_manager
            self.embedding_manager = get_embedding_manager()
            logger.info(f"Auto-categorization engine initialized with model: {self.embedding_manager.model_name}")
        except Exception as e:
            logger.error(f"Failed to initialize auto-categorization engine: {e}")
            self.embedding_manager = None

    def _update_category_embeddings(self):
        """Update cached category embeddings"""
        if not self.embedding_manager or not self.embedding_manager.available:
            return False

        try:
            from blog.models import Category
            from ai_models.models import PostEmbedding

            logger.info("Updating category embeddings cache...")
            self.category_embeddings = {}

            for category in Category.objects.all():
                # Get all post embeddings for this category
                embeddings = PostEmbedding.objects.filter(
                    post__primary_category=category,
                    model_name=self.embedding_manager.model_name
                ).values_list('embedding_vector', flat=True)

                if len(embeddings) >= 2:  # Need at least 2 posts for meaningful average
                    # Calculate average embedding for category
                    embedding_vectors = [np.array(emb, dtype=np.float32) for emb in embeddings]
                    avg_embedding = np.mean(embedding_vectors, axis=0)

                    self.category_embeddings[category.id] = {
                        'embedding': avg_embedding,
                        'name': category.name,
                        'description': category.description,
                        'post_count': len(embeddings)
                    }

            self.category_cache_valid = True
            logger.info(f"Category embeddings updated: {len(self.category_embeddings)} categories")
            return True

        except Exception as e:
            logger.error(f"Failed to update category embeddings: {e}")
            return False

    def suggest_categories_for_text(
        self,
        title: str,
        content: str,
        current_primary_category_id: Optional[int] = None,
        top_k: int = 3,
        similarity_threshold: float = 0.7
    ) -> List[Dict]:
        """
        Suggest additional categories for given text based on semantic similarity

        Args:
            title: Post title
            content: Post content
            current_primary_category_id: ID of current primary category (to exclude)
            top_k: Number of suggestions to return
            similarity_threshold: Minimum similarity score

        Returns:
            List of category suggestions with similarity scores
        """
        if not self.embedding_manager or not self.embedding_manager.available:
            logger.warning("Embedding manager not available for auto-categorization")
            return []

        # Update category embeddings if needed
        if not self.category_cache_valid:
            if not self._update_category_embeddings():
                return []

        if not self.category_embeddings:
            logger.warning("No category embeddings available")
            return []

        try:
            # Generate embedding for the text
            combined_text = f"{title} {content}"
            text_embedding = self.embedding_manager.encode_texts([combined_text])[0]

            # Calculate similarities with all categories
            suggestions = []
            for cat_id, cat_data in self.category_embeddings.items():
                # Skip current primary category
                if cat_id == current_primary_category_id:
                    continue

                # Calculate cosine similarity
                similarity = self.embedding_manager.calculate_similarity(
                    text_embedding, cat_data['embedding']
                )

                if similarity >= similarity_threshold:
                    suggestions.append({
                        'category_id': cat_id,
                        'category_name': cat_data['name'],
                        'similarity_score': float(similarity),
                        'confidence': self._calculate_confidence(similarity, cat_data['post_count']),
                        'reason': f"Semantic similarity: {similarity:.3f} (based on {cat_data['post_count']} posts)"
                    })

            # Sort by similarity and return top_k
            suggestions.sort(key=lambda x: x['similarity_score'], reverse=True)
            return suggestions[:top_k]

        except Exception as e:
            logger.error(f"Failed to suggest categories: {e}")
            return []

    def suggest_categories_for_post(self, post_id: int, **kwargs) -> List[Dict]:
        """
        Suggest additional categories for an existing post

        Args:
            post_id: Post ID
            **kwargs: Additional parameters for suggest_categories_for_text

        Returns:
            List of category suggestions
        """
        try:
            from blog.models import Post

            post = Post.objects.get(id=post_id)

            return self.suggest_categories_for_text(
                title=post.title or "",
                content=post.content or "",
                current_primary_category_id=post.primary_category.id if post.primary_category else None,
                **kwargs
            )

        except Exception as e:
            logger.error(f"Failed to suggest categories for post {post_id}: {e}")
            return []

    def auto_assign_categories(
        self,
        post_id: int,
        similarity_threshold: float = 0.8,
        max_categories: int = 2
    ) -> Dict:
        """
        Automatically assign additional categories to a post

        Args:
            post_id: Post ID
            similarity_threshold: Minimum similarity for auto-assignment
            max_categories: Maximum number of categories to auto-assign

        Returns:
            Dictionary with assignment results
        """
        try:
            from blog.models import Post, Category

            suggestions = self.suggest_categories_for_post(
                post_id,
                similarity_threshold=similarity_threshold,
                top_k=max_categories
            )

            if not suggestions:
                return {
                    'success': False,
                    'message': 'No suitable categories found',
                    'assigned_categories': []
                }

            post = Post.objects.get(id=post_id)
            assigned = []

            for suggestion in suggestions:
                try:
                    category = Category.objects.get(id=suggestion['category_id'])

                    # Check if not already assigned
                    if not post.additional_categories.filter(id=category.id).exists():
                        post.additional_categories.add(category)
                        assigned.append({
                            'category_name': category.name,
                            'similarity_score': suggestion['similarity_score'],
                            'reason': suggestion['reason']
                        })

                except Category.DoesNotExist:
                    continue

            return {
                'success': True,
                'message': f'Auto-assigned {len(assigned)} categories',
                'assigned_categories': assigned,
                'suggestions_considered': len(suggestions)
            }

        except Exception as e:
            logger.error(f"Failed to auto-assign categories for post {post_id}: {e}")
            return {
                'success': False,
                'message': f'Error: {str(e)}',
                'assigned_categories': []
            }

    def _calculate_confidence(self, similarity: float, post_count: int) -> str:
        """Calculate confidence level based on similarity and data quality"""

        # Adjust confidence based on similarity
        if similarity >= 0.9:
            confidence_base = "very_high"
        elif similarity >= 0.8:
            confidence_base = "high"
        elif similarity >= 0.7:
            confidence_base = "medium"
        else:
            confidence_base = "low"

        # Adjust based on category data quality
        if post_count >= 10:
            data_quality = "robust"
        elif post_count >= 5:
            data_quality = "moderate"
        else:
            data_quality = "limited"

        return f"{confidence_base}_{data_quality}"

    def batch_auto_categorize(
        self,
        post_ids: List[int] = None,
        similarity_threshold: float = 0.75,
        dry_run: bool = True
    ) -> Dict:
        """
        Auto-categorize multiple posts in batch

        Args:
            post_ids: List of post IDs (if None, process all posts without additional categories)
            similarity_threshold: Minimum similarity threshold
            dry_run: If True, don't actually assign categories

        Returns:
            Batch processing results
        """
        try:
            from blog.models import Post

            if post_ids is None:
                # Get posts that have only primary category (no additional categories)
                posts = Post.objects.filter(
                    additional_categories__isnull=True,
                    primary_category__isnull=False
                )[:50]  # Limit for performance
                post_ids = [post.id for post in posts]

            results = {
                'processed': 0,
                'assigned': 0,
                'failed': 0,
                'details': []
            }

            for post_id in post_ids:
                try:
                    if dry_run:
                        suggestions = self.suggest_categories_for_post(
                            post_id,
                            similarity_threshold=similarity_threshold
                        )
                        result = {
                            'post_id': post_id,
                            'would_assign': len(suggestions),
                            'suggestions': suggestions
                        }
                    else:
                        result = self.auto_assign_categories(
                            post_id,
                            similarity_threshold=similarity_threshold
                        )
                        result['post_id'] = post_id

                    results['details'].append(result)
                    results['processed'] += 1

                    if not dry_run and result.get('success', False):
                        results['assigned'] += len(result.get('assigned_categories', []))

                except Exception as e:
                    results['failed'] += 1
                    results['details'].append({
                        'post_id': post_id,
                        'error': str(e)
                    })

            return results

        except Exception as e:
            logger.error(f"Batch auto-categorization failed: {e}")
            return {
                'processed': 0,
                'assigned': 0,
                'failed': 1,
                'error': str(e)
            }

    def get_categorization_stats(self) -> Dict:
        """Get statistics about the auto-categorization system"""
        try:
            from blog.models import Post, Category
            from ai_models.models import PostEmbedding

            # Ensure category embeddings are up to date
            if not self.category_cache_valid:
                self._update_category_embeddings()

            stats = {
                'embedding_manager_available': self.embedding_manager.available if self.embedding_manager else False,
                'category_embeddings_count': len(self.category_embeddings),
                'total_categories': Category.objects.count(),
                'posts_with_embeddings': PostEmbedding.objects.count(),
                'posts_with_single_category': Post.objects.filter(
                    additional_categories__isnull=True
                ).count(),
                'categorization_coverage': {}
            }

            # Calculate coverage per category
            for cat_id, cat_data in self.category_embeddings.items():
                stats['categorization_coverage'][cat_data['name']] = {
                    'posts_with_embeddings': cat_data['post_count'],
                    'semantic_quality': 'good' if cat_data['post_count'] >= 5 else 'limited'
                }

            return stats

        except Exception as e:
            logger.error(f"Failed to get categorization stats: {e}")
            return {'error': str(e)}


# Global instance
auto_categorization_engine = AutoCategorizationEngine()