"""
Sentence Transformers integration for generating semantic embeddings
Provides high-quality embeddings for posts, categories, and users
"""

import numpy as np
import logging
from typing import List, Dict, Optional, Union, Tuple
from django.conf import settings
from django.core.cache import cache

logger = logging.getLogger(__name__)

# Conditional imports for sentence-transformers
try:
    from sentence_transformers import SentenceTransformer
    import torch
    SENTENCE_TRANSFORMERS_AVAILABLE = True
    logger.info("Sentence Transformers available - full embedding functionality enabled")
except ImportError:
    SENTENCE_TRANSFORMERS_AVAILABLE = False
    logger.warning("Sentence Transformers not available - using fallback methods")


class EmbeddingManager:
    """
    Manages sentence-transformers models for generating semantic embeddings
    Integrates with existing GNN infrastructure
    """

    def __init__(self, model_name: str = 'all-MiniLM-L6-v2'):
        """
        Initialize embedding manager

        Args:
            model_name: Sentence transformer model name
                       'all-MiniLM-L6-v2' - fast, 384 dimensions
                       'all-mpnet-base-v2' - high quality, 768 dimensions
                       'paraphrase-multilingual-MiniLM-L12-v2' - multilingual, 384 dims
        """
        self.model_name = model_name
        self.model = None
        self.embedding_dim = None
        self.available = SENTENCE_TRANSFORMERS_AVAILABLE

        if self.available:
            self._load_model()

    def _load_model(self):
        """Load the sentence transformer model"""
        try:
            logger.info(f"Loading sentence transformer model: {self.model_name}")
            self.model = SentenceTransformer(self.model_name)

            # Get embedding dimension by encoding a test sentence
            test_embedding = self.model.encode("test")
            self.embedding_dim = len(test_embedding)

            logger.info(f"Model loaded successfully. Embedding dimension: {self.embedding_dim}")

        except Exception as e:
            logger.error(f"Failed to load sentence transformer model: {e}")
            self.available = False
            self.model = None

    def encode_texts(self, texts: List[str], batch_size: int = 32) -> np.ndarray:
        """
        Encode list of texts into embeddings

        Args:
            texts: List of text strings to encode
            batch_size: Batch size for processing

        Returns:
            Array of embeddings [num_texts, embedding_dim]
        """
        if not self.available or self.model is None:
            logger.warning("Sentence transformers not available, using fallback")
            return self._fallback_embeddings(texts)

        try:
            # Cache key for batch
            cache_keys = [f"embedding_{hash(text)}_{self.model_name}" for text in texts]

            # Check cache first
            cached_embeddings = []
            uncached_texts = []
            uncached_indices = []

            for i, (text, cache_key) in enumerate(zip(texts, cache_keys)):
                cached = cache.get(cache_key)
                if cached is not None:
                    cached_embeddings.append((i, cached))
                else:
                    uncached_texts.append(text)
                    uncached_indices.append(i)

            # Generate embeddings for uncached texts
            if uncached_texts:
                logger.info(f"Generating embeddings for {len(uncached_texts)} texts")
                new_embeddings = self.model.encode(
                    uncached_texts,
                    batch_size=batch_size,
                    show_progress_bar=len(uncached_texts) > 10
                )

                # Cache new embeddings (cache for 1 hour)
                for text, embedding, cache_key in zip(uncached_texts, new_embeddings,
                                                    [cache_keys[i] for i in uncached_indices]):
                    cache.set(cache_key, embedding.tolist(), 3600)
            else:
                new_embeddings = []

            # Combine cached and new embeddings
            all_embeddings = [None] * len(texts)

            # Place cached embeddings
            for idx, embedding in cached_embeddings:
                all_embeddings[idx] = np.array(embedding)

            # Place new embeddings
            for i, embedding in enumerate(new_embeddings):
                original_idx = uncached_indices[i]
                all_embeddings[original_idx] = embedding

            return np.array(all_embeddings)

        except Exception as e:
            logger.error(f"Error generating embeddings: {e}")
            return self._fallback_embeddings(texts)

    def _fallback_embeddings(self, texts: List[str]) -> np.ndarray:
        """
        Generate simple fallback embeddings when sentence-transformers unavailable
        Uses basic TF-IDF approach
        """
        from sklearn.feature_extraction.text import TfidfVectorizer

        try:
            # Use TF-IDF with limited features to approximate embeddings
            vectorizer = TfidfVectorizer(
                max_features=384,  # Match MiniLM dimension
                stop_words='english',
                ngram_range=(1, 2)
            )

            # Handle empty texts
            processed_texts = [text if text.strip() else "empty content" for text in texts]

            embeddings = vectorizer.fit_transform(processed_texts).toarray()

            logger.info(f"Generated fallback TF-IDF embeddings: {embeddings.shape}")
            return embeddings

        except Exception as e:
            logger.error(f"Error generating fallback embeddings: {e}")
            # Last resort: random embeddings
            return np.random.normal(0, 0.1, (len(texts), 384))

    def generate_post_embedding(self, title: str, content: str, category: str = "", tags: List[str] = None, category_path: str = "") -> np.ndarray:
        """
        Generate embedding for a single post with hierarchical category context

        Args:
            title: Post title
            content: Post content
            category: Post category name
            tags: List of tag names
            category_path: Full hierarchical category path (e.g., "AI > Machine Learning")

        Returns:
            Post embedding vector
        """
        # Combine post information into meaningful text with hierarchical context
        combined_text = self._combine_post_text(title, content, category, tags or [], category_path)

        embeddings = self.encode_texts([combined_text])
        return embeddings[0]

    def generate_category_embedding(self, name: str, description: str = "", parent_name: str = "", level: int = 0) -> np.ndarray:
        """
        Generate embedding for a category with hierarchical context

        Args:
            name: Category name
            description: Category description
            parent_name: Parent category name (for subcategories)
            level: Category level (0=main, 1=sub, etc.)

        Returns:
            Category embedding vector
        """
        # Build hierarchical context
        combined_text = f"{name}"

        if description:
            combined_text += f" {description}"

        # Add hierarchical context for subcategories
        if parent_name and level > 0:
            combined_text = f"{parent_name} {name} {combined_text}"

        # Add level indicator for better semantic understanding
        if level > 0:
            combined_text += f" subcategory level {level}"
        else:
            combined_text += " main category"

        embeddings = self.encode_texts([combined_text])
        return embeddings[0]

    def generate_user_embedding(self, favorite_categories: List[str], interaction_history: List[str] = None) -> np.ndarray:
        """
        Generate embedding for a user based on preferences and interactions

        Args:
            favorite_categories: List of favorite category names
            interaction_history: List of post titles/content user interacted with

        Returns:
            User embedding vector
        """
        # Combine user interests
        combined_text = " ".join(favorite_categories)

        if interaction_history:
            # Add recent interactions (limit to prevent too long text)
            recent_interactions = interaction_history[-10:]  # Last 10 interactions
            combined_text += " " + " ".join(recent_interactions)

        if not combined_text.strip():
            combined_text = "general interests"

        embeddings = self.encode_texts([combined_text])
        return embeddings[0]

    def _combine_post_text(self, title: str, content: str, category: str, tags: List[str], category_path: str = "") -> str:
        """Combine post components into meaningful text for embedding with hierarchical category context"""
        combined = []

        if title:
            combined.append(title)

        if content:
            # Limit content length to prevent too long sequences
            content_words = content.split()[:200]  # First 200 words
            combined.append(" ".join(content_words))

        # Use full category path for hierarchical context
        if category_path:
            combined.append(f"Category: {category_path}")
        elif category:
            combined.append(f"Category: {category}")

        if tags:
            combined.append(f"Tags: {', '.join(tags)}")

        return " ".join(combined)

    def calculate_similarity(self, embedding1: np.ndarray, embedding2: np.ndarray, method: str = 'cosine') -> float:
        """
        Calculate similarity between two embeddings

        Args:
            embedding1: First embedding vector
            embedding2: Second embedding vector
            method: Similarity method ('cosine', 'euclidean', 'dot')

        Returns:
            Similarity score
        """
        if method == 'cosine':
            # Cosine similarity
            dot_product = np.dot(embedding1, embedding2)
            norm1 = np.linalg.norm(embedding1)
            norm2 = np.linalg.norm(embedding2)

            if norm1 == 0 or norm2 == 0:
                return 0.0

            return float(dot_product / (norm1 * norm2))

        elif method == 'euclidean':
            # Euclidean distance converted to similarity
            distance = np.linalg.norm(embedding1 - embedding2)
            return float(1.0 / (1.0 + distance))

        elif method == 'dot':
            # Dot product similarity
            return float(np.dot(embedding1, embedding2))

        else:
            raise ValueError(f"Unknown similarity method: {method}")

    def find_similar_embeddings(self, target_embedding: np.ndarray, candidate_embeddings: np.ndarray,
                               top_k: int = 10, threshold: float = 0.5) -> List[Tuple[int, float]]:
        """
        Find most similar embeddings to target

        Args:
            target_embedding: Target embedding vector
            candidate_embeddings: Array of candidate embeddings [num_candidates, embedding_dim]
            top_k: Number of top results to return
            threshold: Minimum similarity threshold

        Returns:
            List of (index, similarity_score) tuples
        """
        similarities = []

        for i, candidate in enumerate(candidate_embeddings):
            similarity = self.calculate_similarity(target_embedding, candidate)
            if similarity >= threshold:
                similarities.append((i, similarity))

        # Sort by similarity score (descending)
        similarities.sort(key=lambda x: x[1], reverse=True)

        return similarities[:top_k]


# Global embedding manager instance
embedding_manager = EmbeddingManager()


def get_embedding_manager(model_name: str = None) -> EmbeddingManager:
    """Get global embedding manager instance"""
    global embedding_manager

    if model_name and model_name != embedding_manager.model_name:
        # Create new instance with different model
        embedding_manager = EmbeddingManager(model_name)

    return embedding_manager