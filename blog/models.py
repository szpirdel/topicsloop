from django.db import models
from django.contrib.postgres.search import SearchVector, SearchVectorField
from django.contrib.postgres.indexes import GinIndex

class Category(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)  # Opcjonalny opis kategorii
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='subcategories',
        help_text="Parent category (null for main categories)"
    )
    level = models.PositiveIntegerField(
        default=0,
        help_text="Category level: 0=main category, 1=subcategory, etc."
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        if self.parent:
            return f"{self.parent.name} > {self.name}"
        return self.name

    def get_full_path(self):
        """Return full hierarchical path as string"""
        if self.parent:
            return f"{self.parent.get_full_path()} > {self.name}"
        return self.name

    def get_root_category(self):
        """Get the root (main) category"""
        if self.parent:
            return self.parent.get_root_category()
        return self

    def get_all_subcategories(self):
        """Get all subcategories recursively"""
        subcats = list(self.subcategories.all())
        for subcat in list(subcats):
            subcats.extend(subcat.get_all_subcategories())
        return subcats

    def get_recursive_post_count(self, use_cache=True):
        """
        Get total post count including all subcategories recursively
        Returns count of UNIQUE posts that have this category OR any of its children
        as primary or additional category

        Note: Uses distinct() so a post in multiple subcategories is counted once.
        Per-category counts may sum to more than the recursive total due to overlaps.

        Args:
            use_cache: If True, use cached value (default: True)
        """
        from django.core.cache import cache
        from django.db.models import Q

        # Try cache first
        if use_cache:
            cache_key = f'category_post_count_{self.id}'
            cached_count = cache.get(cache_key)
            if cached_count is not None:
                return cached_count

        # Get all descendant category IDs (this category + all children recursively)
        all_category_ids = [self.id]
        all_subcategories = self.get_all_subcategories()
        all_category_ids.extend([cat.id for cat in all_subcategories])

        # Count posts that have ANY of these categories (primary or additional)
        post_count = Post.objects.filter(
            Q(primary_category_id__in=all_category_ids) |
            Q(additional_categories__id__in=all_category_ids)
        ).distinct().count()

        # Cache for 30 minutes
        if use_cache:
            cache_key = f'category_post_count_{self.id}'
            cache.set(cache_key, post_count, 1800)  # 1800 seconds = 30 min

        return post_count

    @classmethod
    def clear_post_count_cache(cls):
        """Clear all category post count caches"""
        from django.core.cache import cache
        # Clear cache for all categories
        for category in cls.objects.all():
            cache_key = f'category_post_count_{category.id}'
            cache.delete(cache_key)

    def is_subcategory_of(self, category):
        """Check if this category is a subcategory of given category"""
        if self.parent == category:
            return True
        if self.parent:
            return self.parent.is_subcategory_of(category)
        return False

    def save(self, *args, **kwargs):
        # Auto-calculate level based on parent
        if self.parent:
            self.level = self.parent.level + 1
        else:
            self.level = 0
        super().save(*args, **kwargs)

    def clean(self):
        """Validate category hierarchy"""
        from django.core.exceptions import ValidationError

        # Prevent circular references
        if self.parent:
            if self.parent == self:
                raise ValidationError("Category cannot be its own parent")

            # Check for circular dependency
            parent = self.parent
            while parent:
                if parent == self:
                    raise ValidationError("Circular dependency detected in category hierarchy")
                parent = parent.parent

            # Limit hierarchy depth (optional)
            if self.parent.level >= 9:  # Max 10 levels (0-9)
                raise ValidationError("Maximum category hierarchy depth is 10 levels")

    class Meta:
        verbose_name_plural = "Categories"  # Django admin: "Categories" zamiast "Categorys"
        indexes = [
            models.Index(fields=['parent', 'level']),
            models.Index(fields=['level']),
        ]


class Tag(models.Model):
    name = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"#{self.name}"
    
    class Meta:
        ordering = ['name']  # Alfabetycznie w admin


class Post(models.Model):
    title = models.CharField(max_length=200)
    content = models.TextField()
    author = models.ForeignKey('accounts.CustomUser', on_delete=models.CASCADE)
    primary_category = models.ForeignKey(Category, on_delete=models.CASCADE, null=True, blank=True)
    additional_categories = models.ManyToManyField(
        Category,
        blank=True,
        related_name='secondary_posts'
    )
    tags = models.ManyToManyField(Tag, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # PostgreSQL full-text search
    search_vector = SearchVectorField(null=True, blank=True)

    class Meta:
        indexes = [
            GinIndex(fields=['search_vector']),
            models.Index(fields=['created_at']),
            models.Index(fields=['primary_category']),
        ]
        ordering = ['-created_at']

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        # Update search vector when saving
        super().save(*args, **kwargs)
        self.__class__.objects.filter(pk=self.pk).update(
            search_vector=SearchVector('title', weight='A') + SearchVector('content', weight='B')
        )

        # Clear category post count cache when post is saved
        # (affects primary category and all its parents)
        if self.primary_category:
            self._clear_category_tree_cache(self.primary_category)

        # Also clear for additional categories
        for category in self.additional_categories.all():
            self._clear_category_tree_cache(category)

    def _clear_category_tree_cache(self, category):
        """Clear cache for a category and all its parents"""
        from django.core.cache import cache

        current = category
        while current:
            cache_key = f'category_post_count_{current.id}'
            cache.delete(cache_key)
            current = current.parent

class Comment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey('accounts.CustomUser', on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Comment by {self.author.username} on {self.post}'
