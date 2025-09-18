from django.db import models
from django.contrib.auth.models import AbstractUser
from django.db.models.signals import post_save
from django.dispatch import receiver


class CustomUser(AbstractUser):
    email = models.EmailField(unique=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.email


class UserProfile(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='profile')
    favorite_categories = models.ManyToManyField('blog.Category', blank=True, related_name='interested_users')
    bio = models.TextField(max_length=500, blank=True, help_text="Tell us about yourself")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s profile"

    def get_favorite_categories_list(self):
        """Helper method to get list of favorite category names"""
        return [cat.name for cat in self.favorite_categories.all()]


@receiver(post_save, sender=CustomUser)
def create_user_profile(sender, instance, created, **kwargs):
    """Automatically create UserProfile when CustomUser is created"""
    if created:
        UserProfile.objects.create(user=instance)


@receiver(post_save, sender=CustomUser)
def save_user_profile(sender, instance, **kwargs):
    """Save UserProfile when CustomUser is saved"""
    if hasattr(instance, 'profile'):
        instance.profile.save()
    else:
        UserProfile.objects.create(user=instance)