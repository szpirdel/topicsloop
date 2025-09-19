"""
Integration module for GNN models with Django AI models
Provides compatibility layer and fallback methods when PyTorch is not available
"""

import numpy as np
from typing import List, Dict, Tuple, Optional, Any
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

# Check PyTorch availability
try:
    import torch
    import torch.nn.functional as F
    from torch_geometric.data import Data
    PYTORCH_AVAILABLE = True
    logger.info("PyTorch and PyTorch Geometric available - full GNN functionality enabled")
except ImportError:
    PYTORCH_AVAILABLE = False
    logger.warning("PyTorch not available - using fallback similarity methods")


class GNNIntegrationManager:
    """
    Manages integration between GNN models and Django AI models
    Provides fallback functionality when PyTorch is not available
    """

    def __init__(self):
        self.pytorch_available = PYTORCH_AVAILABLE
        self.models_loaded = False
        self.gnn_models = {}

    def initialize_models(self) -> bool:
        """Initialize GNN models if PyTorch is available"""
        if not self.pytorch_available:
            logger.info("Using fallback similarity methods without PyTorch")
            return True

        try:
            from .models import PostGraphConv, CategoryGraphConv, UserInterestGNN
            # Initialize models but don't load weights yet
            self.gnn_models = {
                'post': PostGraphConv,
                'category': CategoryGraphConv,
                'user': UserInterestGNN
            }
            self.models_loaded = True
            logger.info("GNN models initialized successfully")
            return True
        except Exception as e:
            logger.error(f"Failed to initialize GNN models: {e}")
            return False

    def calculate_post_similarity_gnn(
        self,
        post1_id: int,
        post2_id: int,
        method: str = 'fallback'
    ) -> float:
        """
        Calculate similarity between posts using GNN or fallback methods

        Args:
            post1_id: First post ID
            post2_id: Second post ID
            method: 'gnn' for Graph Neural Network, 'fallback' for traditional methods

        Returns:
            Similarity score between 0 and 1
        """

        if method == 'gnn' and self.pytorch_available and self.models_loaded:
            return self._calculate_gnn_similarity(post1_id, post2_id)
        else:
            return self._calculate_fallback_similarity(post1_id, post2_id)

    def _calculate_gnn_similarity(self, post1_id: int, post2_id: int) -> float:
        """Calculate similarity using trained GNN models"""
        try:
            # This will be implemented when PyTorch is available
            # For now, return fallback
            logger.info("GNN similarity calculation not yet implemented - using fallback")
            return self._calculate_fallback_similarity(post1_id, post2_id)
        except Exception as e:
            logger.error(f"GNN similarity calculation failed: {e}")
            return self._calculate_fallback_similarity(post1_id, post2_id)

    def _calculate_fallback_similarity(self, post1_id: int, post2_id: int) -> float:
        """Calculate similarity using traditional methods without PyTorch"""
        try:
            from blog.models import Post
            from ai_models.models import PostSimilarity

            # Check if similarity already exists in database
            similarity = PostSimilarity.objects.filter(
                post1_id=post1_id,
                post2_id=post2_id
            ).first()

            if similarity:
                return similarity.similarity_score

            # Check reverse direction
            similarity = PostSimilarity.objects.filter(
                post1_id=post2_id,
                post2_id=post1_id
            ).first()

            if similarity:
                return similarity.similarity_score

            # Calculate basic similarity if posts exist
            try:
                post1 = Post.objects.get(id=post1_id)
                post2 = Post.objects.get(id=post2_id)

                similarity_score = self._calculate_basic_similarity(post1, post2)

                # Store the calculated similarity
                PostSimilarity.objects.create(
                    post1=post1,
                    post2=post2,
                    similarity_score=similarity_score,
                    algorithm='fallback_basic',
                    model_name='gnn_fallback'
                )

                return similarity_score

            except Post.DoesNotExist:
                logger.warning(f"Posts {post1_id} or {post2_id} not found")
                return 0.0

        except Exception as e:
            logger.error(f"Fallback similarity calculation failed: {e}")
            return 0.0

    def _calculate_basic_similarity(self, post1, post2) -> float:
        """Calculate basic similarity between two posts"""
        similarity_score = 0.0

        # Category similarity (40% weight)
        if post1.primary_category and post2.primary_category:
            if post1.primary_category == post2.primary_category:
                similarity_score += 0.4

        # Tag similarity (30% weight)
        tags1 = set(tag.name for tag in post1.tags.all())
        tags2 = set(tag.name for tag in post2.tags.all())

        if tags1 and tags2:
            tag_similarity = len(tags1.intersection(tags2)) / len(tags1.union(tags2))
            similarity_score += tag_similarity * 0.3

        # Author similarity (10% weight)
        if post1.author == post2.author:
            similarity_score += 0.1

        # Content length similarity (20% weight)
        len1 = len(post1.content) if post1.content else 0
        len2 = len(post2.content) if post2.content else 0

        if len1 > 0 and len2 > 0:
            length_ratio = min(len1, len2) / max(len1, len2)
            similarity_score += length_ratio * 0.2

        return min(similarity_score, 1.0)

    def get_post_recommendations_gnn(
        self,
        user_id: int,
        num_recommendations: int = 5,
        method: str = 'fallback'
    ) -> List[Dict[str, Any]]:
        """
        Get post recommendations using GNN or fallback methods

        Args:
            user_id: User ID to get recommendations for
            num_recommendations: Number of recommendations to return
            method: 'gnn' or 'fallback'

        Returns:
            List of recommended posts with scores
        """

        if method == 'gnn' and self.pytorch_available and self.models_loaded:
            return self._get_gnn_recommendations(user_id, num_recommendations)
        else:
            return self._get_fallback_recommendations(user_id, num_recommendations)

    def _get_gnn_recommendations(self, user_id: int, num_recommendations: int) -> List[Dict[str, Any]]:
        """Get recommendations using GNN models"""
        # Placeholder for GNN recommendations
        logger.info("GNN recommendations not yet implemented - using fallback")
        return self._get_fallback_recommendations(user_id, num_recommendations)

    def _get_fallback_recommendations(self, user_id: int, num_recommendations: int) -> List[Dict[str, Any]]:
        """Get recommendations using traditional methods"""
        try:
            from blog.models import Post
            from accounts.models import CustomUser
            from ai_models.models import PostSimilarity
            from django.db.models import Q, Avg

            user = CustomUser.objects.get(id=user_id)

            # Get user's posts to understand their interests
            user_posts = Post.objects.filter(author=user)

            if not user_posts.exists():
                # For new users, return most popular posts
                popular_posts = Post.objects.annotate(
                    avg_similarity=Avg('similarities_as_post1__similarity_score')
                ).order_by('-avg_similarity')[:num_recommendations]

                return [
                    {
                        'post_id': post.id,
                        'title': post.title,
                        'score': 0.5,
                        'reason': 'Popular content'
                    }
                    for post in popular_posts
                ]

            # Find posts similar to user's posts
            similar_posts = []

            for user_post in user_posts:
                similarities = PostSimilarity.objects.filter(
                    Q(post1=user_post) | Q(post2=user_post),
                    similarity_score__gte=0.3
                ).select_related('post1', 'post2')

                for similarity in similarities:
                    recommended_post = similarity.post2 if similarity.post1 == user_post else similarity.post1

                    # Don't recommend user's own posts
                    if recommended_post.author != user:
                        similar_posts.append({
                            'post_id': recommended_post.id,
                            'title': recommended_post.title,
                            'score': similarity.similarity_score,
                            'reason': f'Similar to your post: {user_post.title[:50]}...'
                        })

            # Sort by score and return top recommendations
            similar_posts.sort(key=lambda x: x['score'], reverse=True)
            return similar_posts[:num_recommendations]

        except Exception as e:
            logger.error(f"Fallback recommendations failed: {e}")
            return []

    def create_post_graph_data_fallback(self, posts_data: List[Dict]) -> Dict[str, Any]:
        """
        Create graph representation using basic Python structures
        For use when PyTorch is not available
        """
        try:
            from ai_models.models import PostSimilarity

            # Create adjacency list representation
            num_posts = len(posts_data)
            post_id_to_idx = {post['id']: idx for idx, post in enumerate(posts_data)}

            # Initialize adjacency matrix
            adjacency_matrix = np.zeros((num_posts, num_posts))
            edge_list = []

            # Get similarities from database
            similarities = PostSimilarity.objects.filter(
                similarity_score__gte=0.3
            ).values('post1_id', 'post2_id', 'similarity_score')

            for sim in similarities:
                post1_id = sim['post1_id']
                post2_id = sim['post2_id']
                score = sim['similarity_score']

                if post1_id in post_id_to_idx and post2_id in post_id_to_idx:
                    idx1 = post_id_to_idx[post1_id]
                    idx2 = post_id_to_idx[post2_id]

                    adjacency_matrix[idx1, idx2] = score
                    adjacency_matrix[idx2, idx1] = score  # Undirected graph

                    edge_list.append((idx1, idx2, score))
                    edge_list.append((idx2, idx1, score))

            return {
                'num_nodes': num_posts,
                'adjacency_matrix': adjacency_matrix,
                'edge_list': edge_list,
                'node_features': [self._extract_basic_features(post) for post in posts_data],
                'post_id_to_idx': post_id_to_idx
            }

        except Exception as e:
            logger.error(f"Failed to create graph data: {e}")
            return {}

    def _extract_basic_features(self, post: Dict) -> List[float]:
        """Extract basic numerical features from post data"""
        features = []

        # Basic statistics
        features.append(len(post.get('title', '')))
        features.append(len(post.get('content', '')))
        features.append(len(post.get('tags', [])))
        features.append(float(post.get('category_id', 0)))

        # Text-based features (simplified)
        content = post.get('content', '').lower()
        title = post.get('title', '').lower()

        # Word count features
        features.append(len(content.split()))
        features.append(len(title.split()))

        # Simple content indicators
        features.append(1.0 if 'question' in content or '?' in content else 0.0)
        features.append(1.0 if 'tutorial' in content or 'how to' in content else 0.0)
        features.append(1.0 if 'code' in content or 'programming' in content else 0.0)

        return features


# Global instance
gnn_manager = GNNIntegrationManager()