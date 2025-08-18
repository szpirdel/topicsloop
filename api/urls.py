from django.urls import path
from .views import PostListView, api_root

urlpatterns = [
    path('', api_root, name='api-root'),  # Dodaj domyślny widok dla /api/
    path('posts/', PostListView.as_view(), name='post-list'),
]


