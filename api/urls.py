from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PostListView, PostDetailView, api_root, CategoryViewSet, TagViewSet, UserProfileViewSet

# Router dla ViewSets
router = DefaultRouter()
router.register(r'categories', CategoryViewSet)
router.register(r'tags', TagViewSet)
router.register(r'profile', UserProfileViewSet, basename='userprofile')

urlpatterns = [
    path('', api_root, name='api-root'),
    path('posts/', PostListView.as_view(), name='post-list'),
    path('posts/<int:pk>/', PostDetailView.as_view(), name='post-detail'),
    path('', include(router.urls)),  # Dodaje /categories/ i /tags/
]