from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PostListView, PostDetailView, api_root, CategoryViewSet, TagViewSet,
    UserProfileViewSet, CategoryNetworkView, UserNetworkView,
    SimilarPostsView, RecommendationsView, EmbeddingStatsView, EmbeddingGenerationView,
    SemanticCategoryNetworkView, AutoCategorizationView
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
    path('viz/semantic-category-network/', SemanticCategoryNetworkView.as_view(), name='semantic-category-network'),
    path('viz/user-network/', UserNetworkView.as_view(), name='user-network'),

    # AI-enhanced endpoints
    path('posts/<int:post_id>/similar/', SimilarPostsView.as_view(), name='similar-posts'),
    path('recommendations/', RecommendationsView.as_view(), name='recommendations'),
    path('ai/stats/', EmbeddingStatsView.as_view(), name='embedding-stats'),
    path('ai/embeddings/', EmbeddingGenerationView.as_view(), name='embedding-generation'),
    path('ai/auto-categorize/', AutoCategorizationView.as_view(), name='auto-categorization'),

    path('', include(router.urls)),  # Dodaje /categories/ i /tags/
]