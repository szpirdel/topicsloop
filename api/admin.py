from django.contrib import admin

# Register your models here.

from django.contrib import admin
from .models import Post

@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ('title', 'content')  # Dopasuj pola do swojego modelu
