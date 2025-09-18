from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import viewsets
from rest_framework.decorators import action
from blog.models import Post, Category, Tag
from accounts.models import UserProfile
from .serializers import PostSerializer, CategorySerializer, TagSerializer, UserProfileSerializer
from django.http import JsonResponse
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status
from django.shortcuts import get_object_or_404


def api_root(request):
    return JsonResponse({
        "message": "Welcome to TopicsLoop API",
        "endpoints": ["/posts/", "/categories/", "/tags/", "/profile/me/"]
    })

class PostListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        posts = Post.objects.prefetch_related(
            'primary_category',
            'additional_categories',
            'tags'
        ).all()

        # If user is authenticated and has favorite categories, filter by them
        if request.user.is_authenticated:
            try:
                user_profile = request.user.profile
                favorite_categories = user_profile.favorite_categories.all()

                if favorite_categories.exists():
                    # Get posts that match user's favorite categories
                    # Either primary_category OR any additional_category matches favorites
                    from django.db.models import Q
                    category_filter = (
                        Q(primary_category__in=favorite_categories) |
                        Q(additional_categories__in=favorite_categories)
                    )
                    filtered_posts = posts.filter(category_filter).distinct()

                    # If we have filtered posts, use them; otherwise show all posts
                    if filtered_posts.exists():
                        posts = filtered_posts

            except UserProfile.DoesNotExist:
                # User has no profile yet, show all posts
                pass

        serializer = PostSerializer(posts, many=True)
        return Response(serializer.data)

    def post(self, request):
        if not request.user.is_authenticated:
            return Response(
                {"error": "Authentication required"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        serializer = PostSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(author=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)    

class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]

class TagViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [AllowAny]

class PostDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        post = get_object_or_404(Post, pk=pk)
        serializer = PostSerializer(post)
        return Response(serializer.data)

    def put(self, request, pk):
        if not request.user.is_authenticated:
            return Response(
                {"error": "Authentication required"},
                status=status.HTTP_401_UNAUTHORIZED
            )

        post = get_object_or_404(Post, pk=pk)

        # Check if user is the author
        if post.author != request.user:
            return Response(
                {"error": "You can only edit your own posts"},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = PostSerializer(post, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        if not request.user.is_authenticated:
            return Response(
                {"error": "Authentication required"},
                status=status.HTTP_401_UNAUTHORIZED
            )

        post = get_object_or_404(Post, pk=pk)

        # Check if user is the author
        if post.author != request.user:
            return Response(
                {"error": "You can only delete your own posts"},
                status=status.HTTP_403_FORBIDDEN
            )

        post.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class UserProfileViewSet(viewsets.ModelViewSet):
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return only current user's profile"""
        return UserProfile.objects.filter(user=self.request.user)

    def get_object(self):
        """Get or create current user's profile"""
        profile, created = UserProfile.objects.get_or_create(user=self.request.user)
        return profile

    @action(detail=False, methods=['get', 'patch'])
    def me(self, request):
        """
        GET /api/profile/me/ - Get current user's profile
        PATCH /api/profile/me/ - Update current user's profile
        """
        profile = self.get_object()

        if request.method == 'GET':
            serializer = self.get_serializer(profile)
            return Response(serializer.data)

        elif request.method == 'PATCH':
            serializer = self.get_serializer(profile, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CategoryNetworkView(APIView):
    """
    Returns category network data for vis.js visualization
    """
    permission_classes = [AllowAny]

    def get(self, request):
        """
        Returns category network data for vis.js
        Structure: nodes (categories) + edges (connections via posts)
        """
        from django.db.models import Count
        from collections import defaultdict

        # Get all categories with post counts
        categories = Category.objects.annotate(
            post_count=Count('post', distinct=True) + Count('secondary_posts', distinct=True)
        ).filter(post_count__gt=0)

        # Create nodes
        nodes = []
        for category in categories:
            nodes.append({
                'id': category.id,
                'label': category.name,
                'title': f"{category.name}\n{category.description}\nPosts: {category.post_count}",
                'value': category.post_count,  # Size based on post count
                'group': 'category'
            })

        # Create edges based on posts that share categories
        edges = []
        edge_weights = defaultdict(int)

        # Get posts with their categories
        posts = Post.objects.prefetch_related('primary_category', 'additional_categories').all()

        for post in posts:
            post_categories = []
            if post.primary_category:
                post_categories.append(post.primary_category.id)
            post_categories.extend([cat.id for cat in post.additional_categories.all()])

            # Create edges between all category pairs in this post
            for i, cat1 in enumerate(post_categories):
                for cat2 in post_categories[i+1:]:
                    edge_key = tuple(sorted([cat1, cat2]))
                    edge_weights[edge_key] += 1

        # Convert edge weights to vis.js format
        for (cat1, cat2), weight in edge_weights.items():
            edges.append({
                'from': cat1,
                'to': cat2,
                'value': weight,
                'title': f"Shared in {weight} post(s)",
                'width': min(weight * 2, 10)  # Limit max width
            })

        return Response({
            'nodes': nodes,
            'edges': edges,
            'stats': {
                'total_categories': len(nodes),
                'total_connections': len(edges),
                'most_connected': max(categories, key=lambda c: c.post_count).name if categories else None
            }
        })


class UserNetworkView(APIView):
    """
    Returns user network based on shared interests
    """
    permission_classes = [AllowAny]

    def get(self, request):
        """
        Returns user network based on shared interests
        """
        # Get users with their favorite categories
        from collections import defaultdict

        profiles = UserProfile.objects.prefetch_related('favorite_categories', 'user').all()

        nodes = []
        edges = []

        # Create user nodes
        for profile in profiles:
            if profile.favorite_categories.exists():
                nodes.append({
                    'id': f"user_{profile.user.id}",
                    'label': profile.user.username,
                    'title': f"{profile.user.username}\nInterests: {', '.join([cat.name for cat in profile.favorite_categories.all()])}",
                    'group': 'user',
                    'value': profile.favorite_categories.count()
                })

        # Create edges based on shared interests
        for i, profile1 in enumerate(profiles):
            if not profile1.favorite_categories.exists():
                continue

            for profile2 in profiles[i+1:]:
                if not profile2.favorite_categories.exists():
                    continue

                # Count shared categories
                shared_categories = set(profile1.favorite_categories.values_list('id', flat=True)) & \
                                  set(profile2.favorite_categories.values_list('id', flat=True))

                if shared_categories:
                    edges.append({
                        'from': f"user_{profile1.user.id}",
                        'to': f"user_{profile2.user.id}",
                        'value': len(shared_categories),
                        'title': f"Shared interests: {len(shared_categories)}",
                        'width': len(shared_categories)
                    })

        return Response({
            'nodes': nodes,
            'edges': edges,
            'stats': {
                'total_users': len(nodes),
                'total_connections': len(edges)
            }
        })


class SimilarPostsView(APIView):
    """
    Get posts similar to a given post based on embeddings/similarity scores
    """
    permission_classes = [AllowAny]

    def get(self, request, post_id):
        from ai_models.models import PostSimilarity
        from django.db.models import Q

        try:
            # Get the target post
            target_post = get_object_or_404(Post, id=post_id)

            # Get similarity threshold from query params (default 0.7)
            threshold = float(request.GET.get('threshold', 0.7))
            algorithm = request.GET.get('algorithm', 'cosine')
            limit = int(request.GET.get('limit', 10))

            # Find similar posts
            similarities = PostSimilarity.get_similar_posts(
                post=target_post,
                threshold=threshold,
                algorithm=algorithm
            )[:limit]

            # Build response with similar posts
            similar_posts_data = []
            for similarity in similarities:
                # Determine which post is the "other" post
                other_post = similarity.post2 if similarity.post1 == target_post else similarity.post1

                similar_posts_data.append({
                    'post': PostSerializer(other_post).data,
                    'similarity_score': similarity.similarity_score,
                    'algorithm': similarity.algorithm,
                    'model_name': similarity.model_name
                })

            return Response({
                'target_post': PostSerializer(target_post).data,
                'similar_posts': similar_posts_data,
                'search_params': {
                    'threshold': threshold,
                    'algorithm': algorithm,
                    'limit': limit
                },
                'total_found': len(similar_posts_data)
            })

        except ValueError as e:
            return Response(
                {'error': f'Invalid parameter: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to find similar posts: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class RecommendationsView(APIView):
    """
    Get personalized post recommendations for authenticated users
    Based on user embeddings and post similarities
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from ai_models.models import UserEmbedding, PostEmbedding
        import numpy as np

        try:
            # Get query parameters
            limit = int(request.GET.get('limit', 10))
            model_name = request.GET.get('model', 'default')

            # Try to get user's interest embedding
            try:
                user_embedding = UserEmbedding.objects.get(
                    user=request.user,
                    model_name=model_name
                )
            except UserEmbedding.DoesNotExist:
                return Response({
                    'message': 'No interest profile found. Please interact with more content to get personalized recommendations.',
                    'recommendations': [],
                    'fallback': 'popular_posts'
                })

            # Get all post embeddings for the same model
            post_embeddings = PostEmbedding.objects.filter(
                model_name=model_name
            ).select_related('post').exclude(
                post__author=request.user  # Exclude user's own posts
            )

            # Calculate similarities
            recommendations = []
            user_vector = np.array(user_embedding.interest_vector)

            for post_embed in post_embeddings:
                post_vector = np.array(post_embed.embedding_vector)

                # Calculate cosine similarity
                dot_product = np.dot(user_vector, post_vector)
                user_norm = np.linalg.norm(user_vector)
                post_norm = np.linalg.norm(post_vector)

                if user_norm > 0 and post_norm > 0:
                    similarity = dot_product / (user_norm * post_norm)

                    recommendations.append({
                        'post': PostSerializer(post_embed.post).data,
                        'similarity_score': float(similarity),
                        'model_name': model_name
                    })

            # Sort by similarity and limit results
            recommendations.sort(key=lambda x: x['similarity_score'], reverse=True)
            recommendations = recommendations[:limit]

            return Response({
                'recommendations': recommendations,
                'user_profile': {
                    'activity_count': user_embedding.activity_count,
                    'last_updated': user_embedding.updated_at,
                    'vector_dimension': user_embedding.vector_dimension
                },
                'search_params': {
                    'limit': limit,
                    'model_name': model_name
                },
                'total_found': len(recommendations)
            })

        except ValueError as e:
            return Response(
                {'error': f'Invalid parameter: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to generate recommendations: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class EmbeddingStatsView(APIView):
    """
    Get statistics about embeddings and AI processing
    """
    permission_classes = [AllowAny]

    def get(self, request):
        from ai_models.models import PostEmbedding, UserEmbedding, PostSimilarity, EmbeddingJob
        from django.db.models import Count, Avg

        try:
            # Get embedding statistics
            post_embedding_stats = PostEmbedding.objects.aggregate(
                total_posts=Count('post', distinct=True),
                total_embeddings=Count('id'),
                models_used=Count('model_name', distinct=True),
                avg_dimension=Avg('embedding_dimension')
            )

            user_embedding_stats = UserEmbedding.objects.aggregate(
                total_users=Count('user', distinct=True),
                avg_activity=Avg('activity_count'),
                avg_dimension=Avg('vector_dimension')
            )

            similarity_stats = PostSimilarity.objects.aggregate(
                total_similarities=Count('id'),
                avg_similarity=Avg('similarity_score'),
                algorithms_used=Count('algorithm', distinct=True)
            )

            # Job statistics
            job_stats = EmbeddingJob.objects.values('status').annotate(
                count=Count('id')
            ).order_by('status')

            # Model usage statistics
            model_usage = PostEmbedding.objects.values('model_name').annotate(
                usage_count=Count('id')
            ).order_by('-usage_count')

            return Response({
                'post_embeddings': post_embedding_stats,
                'user_embeddings': user_embedding_stats,
                'similarities': similarity_stats,
                'job_queue': {stat['status']: stat['count'] for stat in job_stats},
                'model_usage': list(model_usage),
                'system_status': {
                    'ai_enabled': True,
                    'available_algorithms': ['cosine', 'euclidean', 'semantic'],
                    'supported_models': ['mistral-7b', 'sentence-transformers', 'openai-ada']
                }
            })

        except Exception as e:
            return Response(
                {'error': f'Failed to get embedding stats: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )