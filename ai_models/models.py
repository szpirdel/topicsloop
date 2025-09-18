from django.db import models
from django.contrib.postgres.fields import ArrayField
from blog.models import Post
from accounts.models import CustomUser
import json
import numpy as np
from django.core.exceptions import ValidationError


class BaseEmbedding(models.Model):
    """
    Abstract base class for embedding models
    """
    model_name = models.CharField(
        max_length=100,
        help_text="Name of the model used to generate embeddings (e.g., 'mistral-7b', 'sentence-transformers')"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

    def clean(self):
        """Validate embedding data"""
        if hasattr(self, 'embedding_vector') and self.embedding_vector:
            if not isinstance(self.embedding_vector, list):
                raise ValidationError("Embedding vector must be a list of numbers")
            if len(self.embedding_vector) == 0:
                raise ValidationError("Embedding vector cannot be empty")
            if not all(isinstance(x, (int, float)) for x in self.embedding_vector):
                raise ValidationError("All embedding values must be numbers")


class PostEmbedding(BaseEmbedding):
    """
    Stores semantic embeddings for posts
    Each post can have multiple embeddings from different models
    """
    post = models.ForeignKey(
        Post,
        on_delete=models.CASCADE,
        related_name='embeddings'
    )
    embedding_vector = models.JSONField(
        help_text="Vector representation of the post content (list of floats)"
    )
    embedding_dimension = models.PositiveIntegerField(
        help_text="Dimension of the embedding vector"
    )
    content_hash = models.CharField(
        max_length=64,
        help_text="Hash of the content used to detect changes"
    )

    class Meta:
        unique_together = ('post', 'model_name')
        indexes = [
            models.Index(fields=['post', 'model_name']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"Embedding for '{self.post.title}' ({self.model_name})"

    def save(self, *args, **kwargs):
        if self.embedding_vector:
            self.embedding_dimension = len(self.embedding_vector)
        super().save(*args, **kwargs)

    def get_vector_as_numpy(self):
        """Convert embedding to numpy array for calculations"""
        return np.array(self.embedding_vector, dtype=np.float32)

    @classmethod
    def cosine_similarity(cls, embedding1, embedding2):
        """Calculate cosine similarity between two embeddings"""
        vec1 = embedding1.get_vector_as_numpy()
        vec2 = embedding2.get_vector_as_numpy()

        dot_product = np.dot(vec1, vec2)
        norm1 = np.linalg.norm(vec1)
        norm2 = np.linalg.norm(vec2)

        if norm1 == 0 or norm2 == 0:
            return 0.0

        return float(dot_product / (norm1 * norm2))


class PostSimilarity(models.Model):
    """
    Stores precomputed similarity scores between posts
    Helps avoid recalculating similarities repeatedly
    """
    ALGORITHM_CHOICES = [
        ('cosine', 'Cosine Similarity'),
        ('euclidean', 'Euclidean Distance'),
        ('manhattan', 'Manhattan Distance'),
        ('semantic', 'Semantic Similarity (AI-based)'),
    ]

    post1 = models.ForeignKey(
        Post,
        on_delete=models.CASCADE,
        related_name='similarities_as_first'
    )
    post2 = models.ForeignKey(
        Post,
        on_delete=models.CASCADE,
        related_name='similarities_as_second'
    )
    similarity_score = models.FloatField(
        help_text="Similarity score between 0.0 (completely different) and 1.0 (identical)"
    )
    algorithm = models.CharField(
        max_length=20,
        choices=ALGORITHM_CHOICES,
        default='cosine'
    )
    model_name = models.CharField(
        max_length=100,
        help_text="Model used to calculate similarity"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('post1', 'post2', 'algorithm', 'model_name')
        indexes = [
            models.Index(fields=['post1', 'similarity_score']),
            models.Index(fields=['similarity_score']),
            models.Index(fields=['algorithm', 'model_name']),
        ]

    def __str__(self):
        return f"Similarity {self.similarity_score:.3f} between '{self.post1.title}' and '{self.post2.title}'"

    def clean(self):
        """Validate similarity data"""
        if self.post1 == self.post2:
            raise ValidationError("A post cannot be similar to itself")
        if not (0.0 <= self.similarity_score <= 1.0):
            raise ValidationError("Similarity score must be between 0.0 and 1.0")

    def save(self, *args, **kwargs):
        # Ensure consistent ordering (smaller ID first)
        if self.post1.id > self.post2.id:
            self.post1, self.post2 = self.post2, self.post1
        super().save(*args, **kwargs)

    @classmethod
    def get_similar_posts(cls, post, threshold=0.7, algorithm='cosine', model_name=None):
        """
        Get posts similar to the given post above the threshold
        """
        similar_posts = cls.objects.filter(
            models.Q(post1=post) | models.Q(post2=post),
            similarity_score__gte=threshold,
            algorithm=algorithm
        )

        if model_name:
            similar_posts = similar_posts.filter(model_name=model_name)

        return similar_posts.order_by('-similarity_score')


class UserEmbedding(BaseEmbedding):
    """
    Stores aggregated interest embeddings for users
    Updated periodically based on user activity (viewed posts, likes, etc.)
    """
    user = models.OneToOneField(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='interest_embedding'
    )
    interest_vector = models.JSONField(
        help_text="Aggregated vector representing user's interests"
    )
    vector_dimension = models.PositiveIntegerField(
        help_text="Dimension of the interest vector"
    )
    activity_count = models.PositiveIntegerField(
        default=0,
        help_text="Number of activities used to build this embedding"
    )
    last_activity_at = models.DateTimeField(
        null=True, blank=True,
        help_text="Last user activity that contributed to this embedding"
    )

    class Meta:
        unique_together = ('user', 'model_name')

    def __str__(self):
        return f"Interest embedding for {self.user.username} ({self.model_name})"

    def save(self, *args, **kwargs):
        if self.interest_vector:
            self.vector_dimension = len(self.interest_vector)
        super().save(*args, **kwargs)

    def get_vector_as_numpy(self):
        """Convert interest vector to numpy array"""
        return np.array(self.interest_vector, dtype=np.float32)

    def similarity_to_post(self, post_embedding):
        """Calculate similarity between user interests and a post"""
        return PostEmbedding.cosine_similarity(self, post_embedding)


class CategoryEmbedding(BaseEmbedding):
    """
    Embeddings for categories based on aggregated posts
    """
    category = models.ForeignKey(
        'blog.Category',
        on_delete=models.CASCADE,
        related_name='embeddings'
    )
    aggregated_vector = models.JSONField(
        help_text="Vector aggregated from all posts in this category"
    )
    vector_dimension = models.PositiveIntegerField()
    post_count = models.PositiveIntegerField(
        default=0,
        help_text="Number of posts used to create this aggregation"
    )

    class Meta:
        unique_together = ('category', 'model_name')

    def __str__(self):
        return f"Category embedding for '{self.category.name}' ({self.model_name})"

    def save(self, *args, **kwargs):
        if self.aggregated_vector:
            self.vector_dimension = len(self.aggregated_vector)
        super().save(*args, **kwargs)


class EmbeddingJob(models.Model):
    """
    Tracks embedding generation jobs for async processing
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]

    JOB_TYPE_CHOICES = [
        ('post_embedding', 'Post Embedding'),
        ('user_embedding', 'User Interest Embedding'),
        ('category_embedding', 'Category Embedding'),
        ('similarity_calculation', 'Similarity Calculation'),
    ]

    job_type = models.CharField(max_length=30, choices=JOB_TYPE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    model_name = models.CharField(max_length=100)
    target_id = models.PositiveIntegerField(help_text="ID of the target object (post, user, etc.)")
    error_message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=['status', 'job_type']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.job_type} job for ID {self.target_id} ({self.status})"