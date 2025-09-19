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
import logging

logger = logging.getLogger(__name__)


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

        # Check for manual category filtering via query parameters
        category_ids = request.query_params.get('categories', None)
        show_all = request.query_params.get('show_all', 'false').lower() == 'true'

        if request.user.is_authenticated:
            try:
                user_profile = request.user.profile
                favorite_categories = user_profile.favorite_categories.all()

                # Manual category selection (via query params)
                if category_ids and not show_all:
                    try:
                        selected_category_ids = [int(cat_id.strip()) for cat_id in category_ids.split(',') if cat_id.strip()]
                        # Filter by manually selected categories from user's favorites
                        user_favorite_ids = list(favorite_categories.values_list('id', flat=True))
                        valid_category_ids = [cat_id for cat_id in selected_category_ids if cat_id in user_favorite_ids]

                        if valid_category_ids:
                            from django.db.models import Q
                            category_filter = (
                                Q(primary_category__id__in=valid_category_ids) |
                                Q(additional_categories__id__in=valid_category_ids)
                            )
                            posts = posts.filter(category_filter).distinct()
                    except (ValueError, TypeError):
                        pass  # Invalid category IDs, fall back to default behavior

                # Default behavior: show posts from all favorite categories (if no manual selection)
                elif not show_all and favorite_categories.exists():
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
    Enhanced with GNN support
    """
    permission_classes = [AllowAny]

    def get(self, request, post_id):
        from ai_models.models import PostSimilarity
        from gnn_models.integration import gnn_manager
        from django.db.models import Q

        try:
            # Get the target post
            target_post = get_object_or_404(Post, id=post_id)

            # Get similarity threshold from query params (default 0.7)
            threshold = float(request.GET.get('threshold', 0.7))
            algorithm = request.GET.get('algorithm', 'cosine')
            method = request.GET.get('method', 'fallback')  # 'gnn' or 'fallback'
            limit = int(request.GET.get('limit', 10))

            # Initialize GNN manager if not already done
            if not gnn_manager.models_loaded:
                gnn_manager.initialize_models()

            # Find similar posts using appropriate method
            if method == 'gnn' and gnn_manager.pytorch_available:
                # Use semantic embeddings for enhanced similarity
                semantic_similarities = gnn_manager.find_similar_posts_by_embedding(
                    post_id=target_post.id,
                    top_k=limit,
                    threshold=threshold
                )

                if semantic_similarities:
                    # Convert to PostSimilarity-like objects for response
                    similarities = []
                    for similar_post_id, similarity_score in semantic_similarities:
                        try:
                            similar_post = Post.objects.get(id=similar_post_id)
                            similarities.append(type('obj', (object,), {
                                'post1': target_post,
                                'post2': similar_post,
                                'similarity_score': similarity_score,
                                'algorithm': 'sentence_transformers',
                                'model_name': gnn_manager.embedding_manager.model_name if gnn_manager.embedding_manager else 'unknown'
                            }))
                        except Post.DoesNotExist:
                            continue
                    method_used = 'semantic_embeddings'
                else:
                    # Fallback to traditional
                    similarities = PostSimilarity.get_similar_posts(
                        post=target_post,
                        threshold=threshold,
                        algorithm=algorithm
                    )[:limit]
                    method_used = 'traditional_fallback'
            else:
                # Traditional similarity
                similarities = PostSimilarity.get_similar_posts(
                    post=target_post,
                    threshold=threshold,
                    algorithm=algorithm
                )[:limit]
                method_used = 'traditional'

            # Build response with similar posts
            similar_posts_data = []
            for similarity in similarities:
                # Determine which post is the "other" post
                other_post = similarity.post2 if similarity.post1 == target_post else similarity.post1

                # Calculate GNN similarity score if requested
                gnn_score = None
                if method == 'gnn':
                    gnn_score = gnn_manager.calculate_post_similarity_gnn(
                        target_post.id,
                        other_post.id,
                        method='fallback'
                    )

                similar_posts_data.append({
                    'post': PostSerializer(other_post).data,
                    'similarity_score': similarity.similarity_score,
                    'gnn_similarity_score': gnn_score,
                    'algorithm': similarity.algorithm,
                    'model_name': similarity.model_name,
                    'method_used': method_used
                })

            return Response({
                'target_post': PostSerializer(target_post).data,
                'similar_posts': similar_posts_data,
                'search_params': {
                    'threshold': threshold,
                    'algorithm': algorithm,
                    'method': method,
                    'limit': limit
                },
                'gnn_status': {
                    'available': gnn_manager.pytorch_available,
                    'models_loaded': gnn_manager.models_loaded
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
    Based on user embeddings and post similarities, enhanced with GNN
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from ai_models.models import UserEmbedding, PostEmbedding
        from gnn_models.integration import gnn_manager
        import numpy as np

        try:
            # Get query parameters
            limit = int(request.GET.get('limit', 10))
            model_name = request.GET.get('model', 'default')
            method = request.GET.get('method', 'fallback')  # 'gnn' or 'fallback'

            # Initialize GNN manager if not already done
            if not gnn_manager.models_loaded:
                gnn_manager.initialize_models()

            # Try GNN-based recommendations first
            if method == 'gnn':
                gnn_recommendations = gnn_manager.get_post_recommendations_gnn(
                    user_id=request.user.id,
                    num_recommendations=limit,
                    method=method
                )

                if gnn_recommendations:
                    return Response({
                        'recommendations': gnn_recommendations,
                        'method_used': 'gnn',
                        'gnn_status': {
                            'available': gnn_manager.pytorch_available,
                            'models_loaded': gnn_manager.models_loaded
                        },
                        'search_params': {
                            'limit': limit,
                            'method': method
                        },
                        'total_found': len(gnn_recommendations)
                    })

            # Fallback to traditional embedding-based recommendations
            try:
                user_embedding = UserEmbedding.objects.get(
                    user=request.user,
                    model_name=model_name
                )
            except UserEmbedding.DoesNotExist:
                # If no embeddings, use GNN fallback
                gnn_recommendations = gnn_manager.get_post_recommendations_gnn(
                    user_id=request.user.id,
                    num_recommendations=limit,
                    method='fallback'
                )

                return Response({
                    'message': 'No interest profile found. Using basic recommendations.',
                    'recommendations': gnn_recommendations,
                    'method_used': 'fallback',
                    'gnn_status': {
                        'available': gnn_manager.pytorch_available,
                        'models_loaded': gnn_manager.models_loaded
                    },
                    'fallback': 'basic_similarity'
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
                        'model_name': model_name,
                        'reason': 'Embedding similarity'
                    })

            # Sort by similarity and limit results
            recommendations.sort(key=lambda x: x['similarity_score'], reverse=True)
            recommendations = recommendations[:limit]

            return Response({
                'recommendations': recommendations,
                'method_used': 'embedding_similarity',
                'user_profile': {
                    'activity_count': user_embedding.activity_count,
                    'last_updated': user_embedding.updated_at,
                    'vector_dimension': user_embedding.vector_dimension
                },
                'gnn_status': {
                    'available': gnn_manager.pytorch_available,
                    'models_loaded': gnn_manager.models_loaded
                },
                'search_params': {
                    'limit': limit,
                    'model_name': model_name,
                    'method': method
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
        from gnn_models.integration import gnn_manager
        from django.db.models import Count, Avg

        try:
            # Initialize GNN manager if not already done
            if not gnn_manager.models_loaded:
                gnn_manager.initialize_models()

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

            # GNN statistics
            gnn_stats = {
                'pytorch_available': gnn_manager.pytorch_available,
                'models_loaded': gnn_manager.models_loaded,
                'available_models': list(gnn_manager.gnn_models.keys()) if gnn_manager.models_loaded else [],
                'status': 'ready' if gnn_manager.pytorch_available and gnn_manager.models_loaded else 'fallback_mode'
            }

            return Response({
                'post_embeddings': post_embedding_stats,
                'user_embeddings': user_embedding_stats,
                'similarities': similarity_stats,
                'job_queue': {stat['status']: stat['count'] for stat in job_stats},
                'model_usage': list(model_usage),
                'gnn_status': gnn_stats,
                'system_status': {
                    'ai_enabled': True,
                    'gnn_enabled': gnn_manager.pytorch_available,
                    'available_algorithms': ['cosine', 'euclidean', 'semantic', 'gnn_enhanced'],
                    'supported_models': ['mistral-7b', 'sentence-transformers', 'openai-ada', 'gnn-post', 'gnn-category', 'gnn-user'],
                    'recommendation_methods': ['embedding', 'gnn', 'fallback']
                }
            })

        except Exception as e:
            return Response(
                {'error': f'Failed to get embedding stats: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class EmbeddingGenerationView(APIView):
    """
    Generate and manage semantic embeddings using sentence transformers
    """
    permission_classes = [AllowAny]

    def post(self, request):
        """
        Generate embeddings for posts, categories, or users

        POST body:
        {
            "type": "post|category|user",
            "id": 123,
            "batch_ids": [1, 2, 3],  // Alternative to single id
            "force_update": false
        }
        """
        try:
            from gnn_models.integration import gnn_manager

            # Initialize if not already done
            if not gnn_manager.models_loaded:
                gnn_manager.initialize_models()

            data = request.data
            embedding_type = data.get('type')
            entity_id = data.get('id')
            batch_ids = data.get('batch_ids', [])
            force_update = data.get('force_update', False)

            if not embedding_type or embedding_type not in ['post', 'category', 'user']:
                return Response({
                    'error': 'Invalid embedding type. Must be: post, category, or user'
                }, status=400)

            results = []

            # Process single ID or batch
            ids_to_process = batch_ids if batch_ids else ([entity_id] if entity_id else [])

            if not ids_to_process:
                return Response({
                    'error': 'No IDs provided'
                }, status=400)

            for current_id in ids_to_process:
                try:
                    if embedding_type == 'post':
                        embedding = gnn_manager.generate_post_embedding(current_id)
                        if embedding is not None:
                            # Update cache if available
                            cache_updated = gnn_manager.update_post_embedding_cache(current_id)
                        else:
                            cache_updated = False

                    elif embedding_type == 'category':
                        embedding = gnn_manager.generate_category_embedding(current_id)
                        cache_updated = False  # Category caching not implemented yet

                    elif embedding_type == 'user':
                        embedding = gnn_manager.generate_user_embedding(current_id)
                        cache_updated = False  # User caching not implemented yet

                    if embedding is not None:
                        results.append({
                            'id': current_id,
                            'type': embedding_type,
                            'success': True,
                            'embedding_dimension': len(embedding),
                            'cached': cache_updated,
                            'model': gnn_manager.embedding_manager.model_name if gnn_manager.embedding_manager else 'unknown'
                        })
                    else:
                        results.append({
                            'id': current_id,
                            'type': embedding_type,
                            'success': False,
                            'error': 'Failed to generate embedding'
                        })

                except Exception as e:
                    results.append({
                        'id': current_id,
                        'type': embedding_type,
                        'success': False,
                        'error': str(e)
                    })

            return Response({
                'results': results,
                'total_processed': len(ids_to_process),
                'successful': len([r for r in results if r.get('success', False)]),
                'embedding_manager': {
                    'available': gnn_manager.embedding_manager.available if gnn_manager.embedding_manager else False,
                    'model_name': gnn_manager.embedding_manager.model_name if gnn_manager.embedding_manager else None,
                    'embedding_dimension': gnn_manager.embedding_manager.embedding_dim if gnn_manager.embedding_manager else None
                }
            })

        except Exception as e:
            logger.error(f"Embedding generation failed: {e}")
            return Response({
                'error': 'Embedding generation failed',
                'details': str(e)
            }, status=500)

    def get(self, request):
        """
        Get embedding status and available models
        """
        try:
            from gnn_models.integration import gnn_manager

            return Response({
                'embedding_manager': {
                    'available': gnn_manager.embedding_manager.available if gnn_manager.embedding_manager else False,
                    'model_name': gnn_manager.embedding_manager.model_name if gnn_manager.embedding_manager else None,
                    'embedding_dimension': gnn_manager.embedding_manager.embedding_dim if gnn_manager.embedding_manager else None
                },
                'sentence_transformers_available': gnn_manager.embedding_manager.available if gnn_manager.embedding_manager else False,
                'supported_types': ['post', 'category', 'user'],
                'available_models': [
                    'all-MiniLM-L6-v2',  # Fast, 384 dims
                    'all-mpnet-base-v2',  # High quality, 768 dims
                    'paraphrase-multilingual-MiniLM-L12-v2'  # Multilingual, 384 dims
                ]
            })

        except Exception as e:
            logger.error(f"Embedding status check failed: {e}")
            return Response({
                'error': 'Embedding status check failed',
                'details': str(e)
            }, status=500)


class SemanticCategoryNetworkView(APIView):
    """
    Returns category network based on semantic similarity of posts using embeddings
    Much more accurate than simple tag-based connections
    """
    permission_classes = [AllowAny]

    def get(self, request):
        """
        Generate category network using semantic embeddings
        """
        try:
            from django.db.models import Count
            from ai_models.models import PostEmbedding
            from collections import defaultdict
            import numpy as np

            # Get query parameters
            similarity_threshold = float(request.GET.get('threshold', 0.6))
            min_posts_per_category = int(request.GET.get('min_posts', 3))

            # Get categories with enough posts and embeddings
            categories = Category.objects.annotate(
                post_count=Count('post', distinct=True)
            ).filter(
                post_count__gte=min_posts_per_category
            )

            if len(categories) < 2:
                return Response({
                    'nodes': [],
                    'edges': [],
                    'stats': {'message': 'Not enough categories with embeddings for semantic analysis'}
                })

            # Create nodes
            nodes = []
            category_embeddings = {}

            for category in categories:
                # Get all embeddings for posts in this category
                embeddings = PostEmbedding.objects.filter(
                    post__primary_category=category
                ).select_related('post')

                if embeddings.count() < min_posts_per_category:
                    continue

                # Calculate category's average embedding
                embedding_vectors = []
                for emb in embeddings:
                    embedding_vectors.append(np.array(emb.embedding_vector, dtype=np.float32))

                if embedding_vectors:
                    # Average embedding represents category's semantic center
                    avg_embedding = np.mean(embedding_vectors, axis=0)
                    category_embeddings[category.id] = avg_embedding

                    nodes.append({
                        'id': category.id,
                        'label': category.name,
                        'title': f"{category.name}\\n{category.description}\\nPosts: {category.post_count}\\nSemantic center of {len(embedding_vectors)} posts",
                        'value': category.post_count,
                        'group': 'semantic_category'
                    })

            # Create semantic edges based on embedding similarity
            edges = []
            edge_weights = defaultdict(float)

            categories_list = list(category_embeddings.keys())
            for i, cat1_id in enumerate(categories_list):
                for cat2_id in categories_list[i+1:]:
                    # Calculate cosine similarity between category embeddings
                    emb1 = category_embeddings[cat1_id]
                    emb2 = category_embeddings[cat2_id]

                    # Cosine similarity
                    dot_product = np.dot(emb1, emb2)
                    norm_product = np.linalg.norm(emb1) * np.linalg.norm(emb2)
                    similarity = float(dot_product / norm_product) if norm_product > 0 else 0.0

                    if similarity >= similarity_threshold:
                        edges.append({
                            'from': cat1_id,
                            'to': cat2_id,
                            'value': similarity,
                            'title': f"Semantic similarity: {similarity:.3f}",
                            'width': min(similarity * 10, 8),  # Scale for visualization
                            'color': {
                                'color': '#2ecc71' if similarity > 0.8 else '#3498db' if similarity > 0.7 else '#95a5a6'
                            }
                        })

            return Response({
                'nodes': nodes,
                'edges': edges,
                'stats': {
                    'total_categories': len(nodes),
                    'semantic_connections': len(edges),
                    'similarity_threshold': similarity_threshold,
                    'min_posts_per_category': min_posts_per_category,
                    'avg_similarity': np.mean([edge['value'] for edge in edges]) if edges else 0,
                    'method': 'semantic_embeddings'
                }
            })

        except Exception as e:
            logger.error(f"Semantic category network generation failed: {e}")
            return Response({
                'error': 'Semantic analysis failed',
                'details': str(e)
            }, status=500)


class AutoCategorizationView(APIView):
    """
    Auto-categorization using semantic analysis
    """
    permission_classes = [AllowAny]

    def post(self, request):
        """
        Auto-categorize posts or suggest categories

        POST body:
        {
            "action": "suggest|assign|batch",
            "post_id": 123,
            "post_ids": [1, 2, 3],  // For batch processing
            "title": "Post title",  // For suggestion without existing post
            "content": "Post content",
            "similarity_threshold": 0.75,
            "dry_run": true  // For batch action
        }
        """
        try:
            from gnn_models.auto_categorization import auto_categorization_engine

            data = request.data
            action = data.get('action', 'suggest')

            if action == 'suggest':
                # Suggest categories for text or existing post
                post_id = data.get('post_id')
                title = data.get('title', '')
                content = data.get('content', '')
                threshold = float(data.get('similarity_threshold', 0.7))

                if post_id:
                    suggestions = auto_categorization_engine.suggest_categories_for_post(
                        post_id=post_id,
                        similarity_threshold=threshold
                    )
                elif title or content:
                    suggestions = auto_categorization_engine.suggest_categories_for_text(
                        title=title,
                        content=content,
                        similarity_threshold=threshold
                    )
                else:
                    return Response({
                        'error': 'Either post_id or title/content required for suggestions'
                    }, status=400)

                return Response({
                    'action': 'suggest',
                    'suggestions': suggestions,
                    'total_suggestions': len(suggestions)
                })

            elif action == 'assign':
                # Auto-assign categories to a post
                post_id = data.get('post_id')
                if not post_id:
                    return Response({
                        'error': 'post_id required for assignment'
                    }, status=400)

                threshold = float(data.get('similarity_threshold', 0.8))
                result = auto_categorization_engine.auto_assign_categories(
                    post_id=post_id,
                    similarity_threshold=threshold
                )

                return Response({
                    'action': 'assign',
                    'result': result
                })

            elif action == 'batch':
                # Batch auto-categorization
                post_ids = data.get('post_ids')
                threshold = float(data.get('similarity_threshold', 0.75))
                dry_run = data.get('dry_run', True)

                result = auto_categorization_engine.batch_auto_categorize(
                    post_ids=post_ids,
                    similarity_threshold=threshold,
                    dry_run=dry_run
                )

                return Response({
                    'action': 'batch',
                    'result': result,
                    'dry_run': dry_run
                })

            else:
                return Response({
                    'error': f'Unknown action: {action}. Use: suggest, assign, or batch'
                }, status=400)

        except Exception as e:
            logger.error(f"Auto-categorization failed: {e}")
            return Response({
                'error': 'Auto-categorization failed',
                'details': str(e)
            }, status=500)

    def get(self, request):
        """
        Get auto-categorization system status and stats
        """
        try:
            from gnn_models.auto_categorization import auto_categorization_engine

            stats = auto_categorization_engine.get_categorization_stats()

            return Response({
                'auto_categorization_stats': stats,
                'available_actions': ['suggest', 'assign', 'batch'],
                'default_thresholds': {
                    'suggestion': 0.7,
                    'assignment': 0.8,
                    'batch': 0.75
                }
            })

        except Exception as e:
            logger.error(f"Auto-categorization stats failed: {e}")
            return Response({
                'error': 'Stats retrieval failed',
                'details': str(e)
            }, status=500)