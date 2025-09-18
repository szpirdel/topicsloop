from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PostListView, PostDetailView, api_root, CategoryViewSet, TagViewSet,
    UserProfileViewSet, CategoryNetworkView, UserNetworkView
)

# Router dla ViewSets
router = DefaultRouter()
router.register(r'categories', CategoryViewSet)
router.register(r'tags', TagViewSet)
router.register(r'profile', UserProfileViewSet, basename='userprofile')

urlpatterns = [
    path('', api_root, name='api-root'),
    path('posts/', PostListView.as_view(), name='post-list'),
    path('posts/<int:pk>/', PostDetailView.as_view(), name='post-detail'),

    # Visualization endpoints
    path('viz/category-network/', CategoryNetworkView.as_view(), name='category-network'),
    path('viz/user-network/', UserNetworkView.as_view(), name='user-network'),

    path('', include(router.urls)),  # Dodaje /categories/ i /tags/
]