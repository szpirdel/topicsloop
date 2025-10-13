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

class Comment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey('accounts.CustomUser', on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Comment by {self.author.username} on {self.post}'
