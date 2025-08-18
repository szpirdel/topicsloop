from django.db import models


class Post(models.Model):
    title = models.CharField(max_length=200)  # Tytuł posta
    content = models.TextField()  # Treść posta
    created_at = models.DateTimeField(auto_now_add=True)  # Data utworzenia
    updated_at = models.DateTimeField(auto_now=True)  # Data ostatniej edycji

    def __str__(self):
        return self.title  # Reprezentacja obiektów w panelu admina


class Comment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')  # Powiązanie z postem
    author = models.CharField(max_length=100)  # Autor komentarza
    content = models.TextField()  # Treść komentarza
    created_at = models.DateTimeField(auto_now_add=True)  # Data utworzenia

    def __str__(self):
        return f'Comment by {self.author} on {self.post}'

# Create your models here.
