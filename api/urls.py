from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PostListView, PostDetailView, api_root, CategoryViewSet, TagViewSet,
    UserProfileViewSet, CategoryNetworkView, UserNetworkView,
    SimilarPostsView, SimilarCategoriesView, RecommendationsView, EmbeddingStatsView, EmbeddingGenerationView,
    SemanticCategoryNetworkView, UnifiedCategoryNetworkView, AutoCategorizationView,
    PostNetworkView
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
    path('viz/unified-network/', UnifiedCategoryNetworkView.as_view(), name='unified-category-network'),
    path('viz/user-network/', UserNetworkView.as_view(), name='user-network'),
    path('viz/post-network/', PostNetworkView.as_view(), name='post-network'),

    # AI-enhanced endpoints
    path('posts/<int:post_id>/similar/', SimilarPostsView.as_view(), name='similar-posts'),
    path('categories/<int:category_id>/similar/', SimilarCategoriesView.as_view(), name='similar-categories'),
    path('recommendations/', RecommendationsView.as_view(), name='recommendations'),
    path('ai/stats/', EmbeddingStatsView.as_view(), name='embedding-stats'),
    path('ai/embeddings/', EmbeddingGenerationView.as_view(), name='embedding-generation'),
    path('ai/auto-categorize/', AutoCategorizationView.as_view(), name='auto-categorization'),

    path('', include(router.urls)),  # Dodaje /categories/ i /tags/
]