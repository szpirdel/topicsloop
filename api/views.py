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
        ).select_related('author').all()

        # === SEARCH FUNCTIONALITY ===
        search_query = request.query_params.get('search', None)
        if search_query:
            from django.contrib.postgres.search import SearchQuery, SearchRank
            from django.db.models import Q

            # Try PostgreSQL full-text search first
            try:
                search_query_obj = SearchQuery(search_query)
                posts = posts.filter(search_vector=search_query_obj).annotate(
                    rank=SearchRank('search_vector', search_query_obj)
                ).order_by('-rank', '-created_at')
            except Exception:
                # Fallback to icontains search if full-text search fails
                search_filter = (
                    Q(title__icontains=search_query) |
                    Q(content__icontains=search_query)
                )
                posts = posts.filter(search_filter)

        # === CATEGORY FILTERING ===
        # New category filtering parameter (separate from existing favorites logic)
        category_filter_id = request.query_params.get('category', None)
        if category_filter_id:
            try:
                category_id = int(category_filter_id)
                from django.db.models import Q
                category_filter = (
                    Q(primary_category__id=category_id) |
                    Q(additional_categories__id=category_id)
                )
                posts = posts.filter(category_filter).distinct()
            except (ValueError, TypeError):
                pass  # Invalid category ID, ignore filter

        # Check for manual category filtering via query parameters (existing logic)
        category_ids = request.query_params.get('categories', None)
        show_all = request.query_params.get('show_all', 'false').lower() == 'true'

        if request.user.is_authenticated:
            try:
                user_profile = request.user.profile
                favorite_categories = user_profile.favorite_categories.all()

                # Manual category selection (via query params)
                if category_ids is not None and not show_all:
                    try:
                        if category_ids == '':
                            # User explicitly selected NO categories - show no posts
                            posts = posts.none()
                        else:
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
                            else:
                                # No valid categories selected - show no posts
                                posts = posts.none()
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

        # === ORDERING ===
        order_by = request.query_params.get('order', 'newest')
        if order_by == 'oldest':
            posts = posts.order_by('created_at')
        elif order_by == 'title':
            posts = posts.order_by('title')
        else:  # default: newest
            posts = posts.order_by('-created_at')

        # === PAGINATION ===
        from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger

        page_size = int(request.query_params.get('page_size', 10))  # Default 10 posts per page
        page_number = request.query_params.get('page', 1)

        paginator = Paginator(posts, page_size)
        total_count = paginator.count
        total_pages = paginator.num_pages

        try:
            page_obj = paginator.page(page_number)
        except PageNotAnInteger:
            page_obj = paginator.page(1)
        except EmptyPage:
            page_obj = paginator.page(paginator.num_pages)

        # === RESPONSE WITH PAGINATION METADATA ===
        serializer = PostSerializer(page_obj.object_list, many=True)

        return Response({
            'posts': serializer.data,
            'pagination': {
                'current_page': page_obj.number,
                'total_pages': total_pages,
                'total_count': total_count,
                'page_size': page_size,
                'has_next': page_obj.has_next(),
                'has_previous': page_obj.has_previous(),
                'next_page': page_obj.next_page_number() if page_obj.has_next() else None,
                'previous_page': page_obj.previous_page_number() if page_obj.has_previous() else None,
            },
            'filters_applied': {
                'search': search_query,
                'category': category_filter_id,
                'categories': category_ids,
                'show_all': show_all,
                'order': order_by,
                'page': page_number,
                'page_size': page_size
            }
        })

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

    def get_queryset(self):
        """Get categories with post counts and subcategory counts"""
        from django.db.models import Count

        return Category.objects.annotate(
            post_count=Count('post', distinct=True) + Count('secondary_posts', distinct=True),
            subcategory_count=Count('subcategories', distinct=True)
        ).prefetch_related('subcategories', 'parent')

    def list(self, request, *args, **kwargs):
        """Override list to optionally filter main categories only"""
        main_only = request.query_params.get('main_only', 'false').lower() == 'true'

        queryset = self.get_queryset()

        if main_only:
            queryset = queryset.filter(level=0)

        # Apply ordering - main categories first, then by name
        queryset = queryset.order_by('level', 'name')

        serializer = self.get_serializer(queryset, many=True)

        # Add summary stats
        total_categories = Category.objects.count()
        main_categories = Category.objects.filter(level=0).count()
        total_posts = Post.objects.count()

        return Response({
            'categories': serializer.data,
            'stats': {
                'total_categories': total_categories,
                'main_categories': main_categories,
                'total_posts': total_posts,
                'showing_main_only': main_only
            }
        })

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


class SimilarCategoriesView(APIView):
    """
    Get categories similar to a given category based on embeddings
    """
    permission_classes = [AllowAny]

    def get(self, request, category_id):
        from ai_models.models import CategoryEmbedding
        import numpy as np
        from django.db.models import Q

        try:
            # Get the target category
            target_category = get_object_or_404(Category, id=category_id)

            # Get similarity threshold from query params (default 0.7)
            threshold = float(request.GET.get('threshold', 0.7))
            limit = int(request.GET.get('limit', 10))

            # Get embeddings for the target category
            target_embeddings = CategoryEmbedding.objects.filter(category=target_category)

            if not target_embeddings.exists():
                return Response({
                    'similar_categories': [],
                    'message': 'No embeddings found for this category',
                    'target_category': {
                        'id': target_category.id,
                        'name': target_category.name,
                        'description': target_category.description
                    },
                    'total_found': 0
                })

            # Use the latest embedding
            target_embedding = target_embeddings.order_by('-created_at').first()
            target_vector = np.array(target_embedding.aggregated_vector)

            # Get all other category embeddings
            other_embeddings = CategoryEmbedding.objects.exclude(
                category=target_category
            ).select_related('category')

            similar_categories = []

            for embedding in other_embeddings:
                try:
                    other_vector = np.array(embedding.aggregated_vector)

                    # Calculate cosine similarity
                    dot_product = np.dot(target_vector, other_vector)
                    norm_target = np.linalg.norm(target_vector)
                    norm_other = np.linalg.norm(other_vector)

                    if norm_target > 0 and norm_other > 0:
                        similarity = dot_product / (norm_target * norm_other)

                        if similarity >= threshold:
                            similar_categories.append({
                                'category': {
                                    'id': embedding.category.id,
                                    'name': embedding.category.name,
                                    'description': embedding.category.description,
                                    'level': embedding.category.level,
                                    'parent': embedding.category.parent.name if embedding.category.parent else None
                                },
                                'similarity_score': float(similarity),
                                'post_count': embedding.post_count,
                                'embedding_model': embedding.model_name
                            })
                except Exception as e:
                    logger.warning(f"Error calculating similarity for category {embedding.category.id}: {str(e)}")
                    continue

            # Sort by similarity score (descending) and limit results
            similar_categories.sort(key=lambda x: x['similarity_score'], reverse=True)
            similar_categories = similar_categories[:limit]

            return Response({
                'similar_categories': similar_categories,
                'target_category': {
                    'id': target_category.id,
                    'name': target_category.name,
                    'description': target_category.description,
                    'level': target_category.level,
                    'parent': target_category.parent.name if target_category.parent else None
                },
                'parameters': {
                    'threshold': threshold,
                    'limit': limit,
                    'embedding_model': target_embedding.model_name
                },
                'total_found': len(similar_categories)
            })

        except ValueError as e:
            return Response(
                {'error': f'Invalid parameter: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to find similar categories: {str(e)}'},
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


class UnifiedCategoryNetworkView(APIView):
    """
    🎯 NOWY UNIFIED NETWORK - zastępuje 3 osobne sieci

    Hybrydowy algorytm łączący:
    1. 📊 Wspólne posty między kategoriami (ilościowe)
    2. 🧠 AI semantic similarity (jakościowe)
    3. 🌳 Hierarchiczną strukturę expandowalną

    Konfigurowalny 50/50 balans między podejściami
    """
    permission_classes = [AllowAny]

    def get(self, request):
        """
        🚀 Generuje hybrydową sieć kategorii

        Parametry URL:
        - level: 0 (główne), 1 (pod), 2 (pod-pod)
        - parent_id: ID rodzica dla podkategorii
        - personalized: true/false - personalizowana sieć na bazie ulubionych
        - shared_weight: waga wspólnych postów (0.5)
        - ai_weight: waga AI similarity (0.5)
        - min_posts: min postów na kategorię (2)
        - similarity_threshold: próg AI (0.4)
        - include_posts: true/false - czy dodać post nodes (default: false)
        - focus_post_id: ID posta do focus (opcjonalne)
        - max_posts: max liczba post nodes (default: 20)
        """
        try:
            # === 🔧 PARAMETRY KONFIGURACJI ===
            level = int(request.GET.get('level', 0))
            parent_id = request.GET.get('parent_id')
            personalized = request.GET.get('personalized', 'false').lower() == 'true'
            shared_weight = float(request.GET.get('shared_weight', 0.5))
            ai_weight = float(request.GET.get('ai_weight', 0.5))
            min_posts = int(request.GET.get('min_posts', 2))
            similarity_threshold = float(request.GET.get('similarity_threshold', 0.4))

            # === 📄 POST NODES PARAMETRY ===
            include_posts = request.GET.get('include_posts', 'false').lower() == 'true'
            focus_post_id = request.GET.get('focus_post_id')
            max_posts = int(request.GET.get('max_posts', 20))

            logger.info(f"🎯 Unified Network: level={level}, parent={parent_id}, "
                       f"weights=({shared_weight}/{ai_weight}), threshold={similarity_threshold}")

            from django.db.models import Count, Q
            from collections import defaultdict
            from gnn_models.integration import gnn_manager
            import numpy as np

            # === 📂 KROK 1: WYBÓR KATEGORII ===
            # Filtrowanie według pozimu hierarchii i rodzica
            categories_query = Category.objects.annotate(
                post_count=Count('post', distinct=True) + Count('secondary_posts', distinct=True)
            ).filter(
                level=level  # 🎯 Konkretny poziom hierarchii
            )

            # 🔢 Dla głównych kategorii wymagaj min_posts, dla subcategorii - nie
            if level == 0:
                categories_query = categories_query.filter(post_count__gte=min_posts)
            else:
                # Dla subcategorii pokażemy wszystkie (nawet z 0 postów)
                logger.info(f"🌳 Showing all subcategories for level {level} (ignoring min_posts)")

            # 🌳 Hierarchiczna logika
            if parent_id:
                categories_query = categories_query.filter(parent_id=int(parent_id))
            elif level == 0:
                categories_query = categories_query.filter(parent__isnull=True)

            categories = list(categories_query)

            # === 🎨 PERSONALIZACJA OPARTA NA ULUBIONYCH ===
            favorite_category_ids = set()
            if personalized and request.user.is_authenticated and not parent_id:
                try:
                    user_profile = request.user.profile
                    favorite_categories = user_profile.favorite_categories.filter(level=level)
                    favorite_category_ids = set(favorite_categories.values_list('id', flat=True))

                    if favorite_category_ids:
                        logger.info(f"🎯 Personalized view: Found {len(favorite_category_ids)} favorite categories")

                        # Znajdź kategorie powiązane z ulubionymi
                        from django.db.models import Q
                        connected_categories = Category.objects.filter(
                            level=level,
                            post_count__gte=1  # Tylko kategorie z co najmniej 1 postem
                        ).exclude(
                            id__in=favorite_category_ids  # Wyklucz już ulubione
                        )

                        # Filtruj do kategorii które mają połączenia z ulubionymi
                        # (współdzielone posty lub podobieństwo AI)
                        filtered_connected = []
                        for cat in connected_categories:
                            # Sprawdź czy ma wspólne posty z ulubionymi
                            shared_posts = cat.post_set.filter(
                                Q(primary_category__id__in=favorite_category_ids) |
                                Q(additional_categories__id__in=favorite_category_ids)
                            ).count()

                            if shared_posts > 0:
                                filtered_connected.append(cat)

                        # Kombinuj ulubione + powiązane
                        favorite_cats = list(favorite_categories)
                        connected_cats = filtered_connected[:10]  # Limit dla czytelności
                        categories = favorite_cats + connected_cats

                        logger.info(f"🎨 Personalized network: {len(favorite_cats)} favorites + {len(connected_cats)} connected")
                    else:
                        logger.info("🎯 No favorite categories found, showing all")
                except Exception as e:
                    logger.warning(f"⚠️ Personalization failed: {e}, falling back to all categories")

            if len(categories) < 2:
                return Response({
                    'nodes': [],
                    'edges': [],
                    'stats': {
                        'message': f'Za mało kategorii na poziomie {level}',
                        'level': level,
                        'parent_id': parent_id
                    }
                })

            logger.info(f"📊 Znaleziono {len(categories)} kategorii do analizy")

            # === 🎨 KROK 2: TWORZENIE WĘZŁÓW ===
            nodes = []
            category_ids = []

            for category in categories:
                # 🔍 Sprawdzamy czy można rozwinąć
                has_subcategories = category.subcategories.exists()

                # 🎨 Kolory: ulubione vs powiązane vs poziom
                if personalized and favorite_category_ids:
                    if category.id in favorite_category_ids:
                        color = '#3498db'  # Niebieski dla ulubionych
                        node_type = 'favorite'
                    else:
                        color = '#f39c12'  # Pomarańczowy dla powiązanych
                        node_type = 'connected'
                else:
                    # Standardowe kolory według poziomu
                    colors = {0: '#3498db', 1: '#2ecc71', 2: '#f39c12'}
                    color = colors.get(level, '#95a5a6')
                    node_type = f'level_{level}'

                nodes.append({
                    'id': category.id,
                    'label': category.name,
                    'title': (f"📍 {category.get_full_path()}\n"
                             f"📊 Level: {category.level}\n"
                             f"📄 Posts: {category.post_count}\n"
                             f"📝 {category.description or 'Bez opisu'}\n"
                             f"{'💙 Ulubiona kategoria' if personalized and category.id in favorite_category_ids else '🔗 Powiązana kategoria' if personalized and favorite_category_ids else ''}\n"
                             f"{'🔽 Dwuklik = rozwiń' if has_subcategories else ''}"),
                    'value': category.post_count,  # Rozmiar = liczba postów
                    'level': category.level,
                    'parent_id': category.parent_id,
                    'has_subcategories': has_subcategories,
                    'full_path': category.get_full_path(),
                    'color': {
                        'background': color,
                        'border': '#2c3e50',
                        'highlight': {'background': '#e74c3c', 'border': '#c0392b'}
                    },
                    'font': {'size': 14 + (2 if level == 0 else 0)},
                    'group': node_type,
                    'node_type': node_type  # Metadata dla frontend
                })
                category_ids.append(category.id)

            # === 📊 KROK 3: KALKULACJA WSPÓLNYCH POSTÓW ===
            logger.info("📊 Obliczam połączenia wspólnych postów...")

            edge_weights_shared = defaultdict(int)
            posts = Post.objects.prefetch_related('primary_category', 'additional_categories').all()

            for post in posts:
                # 🔍 Zbieramy kategorie tego posta
                post_categories = []
                if post.primary_category and post.primary_category.id in category_ids:
                    post_categories.append(post.primary_category.id)

                for add_cat in post.additional_categories.all():
                    if add_cat.id in category_ids:
                        post_categories.append(add_cat.id)

                # 🔗 Połączenia między wszystkimi parami
                for i, cat1 in enumerate(post_categories):
                    for cat2 in post_categories[i+1:]:
                        edge_key = tuple(sorted([cat1, cat2]))  # Sortujemy = bez duplikatów
                        edge_weights_shared[edge_key] += 1

            logger.info(f"📊 Znaleziono {len(edge_weights_shared)} połączeń wspólnych postów")

            # === 🧠 KROK 4: KALKULACJA AI SEMANTIC SIMILARITY ===
            logger.info("🧠 Obliczam AI semantic similarities...")

            edge_weights_ai = {}

            # 🤖 Sprawdzamy dostępność AI
            if gnn_manager and gnn_manager.embedding_manager and gnn_manager.embedding_manager.available:
                logger.info("🤖 AI embeddings dostępne!")

                # 📊 Generujemy embeddingi kategorii
                category_embeddings = {}
                for category in categories:
                    embedding = gnn_manager.generate_category_embedding(category.id)
                    if embedding is not None:
                        category_embeddings[category.id] = embedding

                # 🧮 Similarity między wszystkimi parami
                for i, cat1_id in enumerate(category_ids):
                    for cat2_id in category_ids[i+1:]:
                        if cat1_id in category_embeddings and cat2_id in category_embeddings:
                            similarity = gnn_manager.calculate_semantic_similarity(
                                category_embeddings[cat1_id],
                                category_embeddings[cat2_id]
                            )

                            # ✅ Tylko powyżej progu
                            if similarity >= similarity_threshold:
                                edge_key = tuple(sorted([cat1_id, cat2_id]))
                                edge_weights_ai[edge_key] = similarity

                logger.info(f"🧠 Znaleziono {len(edge_weights_ai)} AI połączeń")
            else:
                logger.warning("⚠️ AI embeddings niedostępne - tylko wspólne posty")

            # === ⚡ KROK 5: HYBRYDOWE ŁĄCZENIE ===
            logger.info("⚡ Łączę shared posts + AI semantic...")

            edges = []
            final_connections = {}

            # 📐 Normalizacja wspólnych postów (0-1)
            max_shared = max(edge_weights_shared.values()) if edge_weights_shared else 1

            # 🔗 Wszystkie unikalne pary
            all_edge_keys = set(edge_weights_shared.keys()) | set(edge_weights_ai.keys())

            for edge_key in all_edge_keys:
                cat1_id, cat2_id = edge_key

                # 📊 Znormalizowane wspólne posty
                shared_normalized = edge_weights_shared.get(edge_key, 0) / max_shared

                # 🧠 AI similarity (już 0-1)
                ai_similarity = edge_weights_ai.get(edge_key, 0)

                # ⚡ HYBRYDOWA FORMUŁA ⚡
                hybrid_strength = (shared_normalized * shared_weight) + (ai_similarity * ai_weight)

                # ✅ Tylko znaczące połączenia
                if hybrid_strength > 0.1:
                    shared_count = edge_weights_shared.get(edge_key, 0)

                    edges.append({
                        'from': cat1_id,
                        'to': cat2_id,
                        'value': hybrid_strength,
                        'width': min(hybrid_strength * 8, 12),
                        'title': (f"🔗 Hybrydowa siła: {hybrid_strength:.2f}\n"
                                 f"📊 Wspólne posty: {shared_count} (waga: {shared_normalized:.2f})\n"
                                 f"🧠 AI similarity: {ai_similarity:.2f}\n"
                                 f"📐 Formuła: ({shared_normalized:.2f} × {shared_weight}) + ({ai_similarity:.2f} × {ai_weight})"),
                        'color': {
                            'color': '#95a5a6' if hybrid_strength < 0.5 else '#3498db',
                            'highlight': '#e74c3c'
                        },
                        'smooth': {'type': 'continuous'},
                        # 🔧 Metadata debugowania
                        'shared_posts': shared_count,
                        'ai_similarity': ai_similarity,
                        'hybrid_strength': hybrid_strength
                    })

                    final_connections[edge_key] = hybrid_strength

            # 📈 Sortowanie: najsilniejsze pierwsze
            edges.sort(key=lambda x: x['value'], reverse=True)

            logger.info(f"⚡ Wygenerowano {len(edges)} hybrydowych połączeń")

            # === 📄 KROK 6: POST NODES (jeśli włączone) ===
            post_nodes = []
            post_edges = []

            if include_posts:
                logger.info(f"🔄 Adding post nodes to unified network...")

                # Determine which posts to include
                posts_query = Post.objects.select_related('primary_category', 'author')

                if focus_post_id:
                    # Focus on specific post + similar posts
                    try:
                        focus_post = Post.objects.get(id=focus_post_id)
                        focus_posts = [focus_post]

                        # Add similar posts if embeddings available
                        if gnn_manager and gnn_manager.embedding_manager and gnn_manager.embedding_manager.available:
                            try:
                                similar_post_data = gnn_manager.find_similar_posts_by_embedding(
                                    post_id=focus_post.id,
                                    top_k=max_posts-1,
                                    threshold=similarity_threshold
                                )
                                if similar_post_data:
                                    similar_post_ids = [pid for pid, score in similar_post_data]
                                    similar_posts = Post.objects.filter(id__in=similar_post_ids)
                                    focus_posts.extend(similar_posts)
                            except Exception as e:
                                logger.warning(f"Similarity search failed: {e}")

                        posts_query = Post.objects.filter(id__in=[p.id for p in focus_posts])
                    except Post.DoesNotExist:
                        logger.warning(f"Focus post {focus_post_id} not found")
                        posts_query = posts_query.filter(primary_category__in=categories)[:max_posts]
                else:
                    # Recent posts from selected categories
                    posts_query = posts_query.filter(primary_category__in=categories).order_by('-created_at')[:max_posts]

                posts = list(posts_query)
                logger.info(f"📊 Selected {len(posts)} posts for network")

                # Create post nodes
                for post in posts:
                    is_focus = focus_post_id and str(post.id) == str(focus_post_id)

                    post_nodes.append({
                        'id': f'post_{post.id}',
                        'label': post.title[:40] + ('...' if len(post.title) > 40 else ''),
                        'type': 'post',
                        'post_id': post.id,
                        'title': f'📄 {post.title}\n👤 {post.author.username}\n📅 {post.created_at.strftime("%Y-%m-%d")}\n📂 {post.primary_category.name if post.primary_category else "No category"}',
                        'shape': 'box',
                        'size': 25 if is_focus else 18,
                        'color': {
                            'background': '#e74c3c' if is_focus else '#e67e22',
                            'border': '#c0392b' if is_focus else '#d35400'
                        },
                        'font': {'size': 12, 'color': 'white'},
                        'physics': True,
                        'is_focus': is_focus,
                        'level': 999  # Special level for posts
                    })

                # Create post-category connections
                category_id_map = {cat.id: f'category_{cat.id}' for cat in categories}

                for post in posts:
                    post_node_id = f'post_{post.id}'

                    # Primary category connection
                    if post.primary_category and post.primary_category.id in category_id_map:
                        cat_node_id = category_id_map[post.primary_category.id]
                        post_edges.append({
                            'id': f'post_{post.id}_to_cat_{post.primary_category.id}',
                            'from': post_node_id,
                            'to': cat_node_id,
                            'title': 'Primary category',
                            'color': {'color': '#95a5a6'},
                            'width': 2,
                            'dashes': [5, 5],  # Dashed line
                            'smooth': {'type': 'continuous'}
                        })

                    # Additional categories connections
                    for additional_cat in post.additional_categories.all():
                        if additional_cat.id in category_id_map:
                            cat_node_id = category_id_map[additional_cat.id]
                            post_edges.append({
                                'id': f'post_{post.id}_to_cat_{additional_cat.id}',
                                'from': post_node_id,
                                'to': cat_node_id,
                                'title': 'Additional category',
                                'color': {'color': '#bdc3c7'},
                                'width': 1,
                                'dashes': [3, 3],  # Lighter dashed line
                                'smooth': {'type': 'continuous'}
                            })

                # Create post-post similarity connections
                if gnn_manager and gnn_manager.embedding_manager and gnn_manager.embedding_manager.available:
                    try:
                        post_pairs_checked = set()
                        similarity_connections = 0
                        max_similarity_connections = 50  # Limit total similarity edges

                        for post in posts:
                            if similarity_connections >= max_similarity_connections:
                                break

                            try:
                                similar_post_data = gnn_manager.find_similar_posts_by_embedding(
                                    post_id=post.id,
                                    top_k=5,  # Max 5 similar posts per post
                                    threshold=similarity_threshold
                                )

                                if similar_post_data:
                                    for similar_post_id, similarity_score in similar_post_data:
                                        # Check if both posts are in our nodes
                                        if any(p.id == similar_post_id for p in posts):
                                            # Avoid duplicate edges
                                            pair_key = tuple(sorted([post.id, similar_post_id]))
                                            if pair_key not in post_pairs_checked:
                                                post_pairs_checked.add(pair_key)
                                                similarity_connections += 1

                                                # Color based on similarity strength
                                                if similarity_score > 0.9:
                                                    color = '#2ecc71'  # Strong green
                                                    width = 4
                                                elif similarity_score > 0.8:
                                                    color = '#3498db'  # Blue
                                                    width = 3
                                                else:
                                                    color = '#95a5a6'  # Gray
                                                    width = 2

                                                post_edges.append({
                                                    'id': f'similarity_{post.id}_{similar_post_id}',
                                                    'from': f'post_{post.id}',
                                                    'to': f'post_{similar_post_id}',
                                                    'title': f'Semantic similarity: {similarity_score:.3f}',
                                                    'color': {'color': color},
                                                    'width': width,
                                                    'smooth': {'type': 'continuous'}
                                                })

                                                if similarity_connections >= max_similarity_connections:
                                                    break
                            except Exception as e:
                                logger.warning(f"Failed to get similarities for post {post.id}: {e}")

                        logger.info(f"🔗 Created {similarity_connections} post similarity connections")

                    except Exception as e:
                        logger.warning(f"Post similarity connections failed: {e}")

                logger.info(f"📄 Added {len(post_nodes)} post nodes and {len(post_edges)} post edges")

            # Combine category and post nodes/edges
            all_nodes = nodes + post_nodes
            all_edges = edges + post_edges

            # === 📤 KROK 7: ODPOWIEDŹ ===
            return Response({
                'nodes': all_nodes,
                'edges': all_edges,
                'stats': {
                    'total_nodes': len(all_nodes),
                    'total_edges': len(all_edges),
                    'category_nodes': len(nodes),
                    'post_nodes': len(post_nodes),
                    'category_connections': len(edges),
                    'post_connections': len(post_edges),
                    'level': level,
                    'parent_id': parent_id,
                    'personalized': personalized,
                    'favorite_categories_count': len(favorite_category_ids) if personalized else 0,
                    'algorithm': 'hybrid_unified',
                    'weights': {
                        'shared_posts': shared_weight,
                        'ai_similarity': ai_weight
                    },
                    'thresholds': {
                        'min_posts': min_posts,
                        'ai_similarity': similarity_threshold
                    },
                    'raw_stats': {
                        'shared_connections': len(edge_weights_shared),
                        'ai_connections': len(edge_weights_ai),
                        'hybrid_connections': len(final_connections)
                    },
                    'strongest_connection': max(final_connections.values()) if final_connections else 0,
                    'ai_available': bool(gnn_manager and gnn_manager.embedding_manager and gnn_manager.embedding_manager.available)
                }
            })

        except Exception as e:
            logger.error(f"💥 Unified network generation failed: {e}")
            import traceback
            logger.error(traceback.format_exc())

            return Response({
                'error': 'Generacja unified network nie powiodła się',
                'details': str(e),
                'nodes': [],
                'edges': []
            }, status=500)


class PostNetworkView(APIView):
    """
    🎯 POST NETWORK - Graf z postami jako nodes

    Nowy endpoint dla funkcjonalności:
    1. 📄 Post nodes obok category nodes
    2. 🔗 Semantic similarity connections między postami
    3. 📂 Kategoryzacja - posty grouped by categories
    4. 🎯 Focus na specific post + jego connections
    """
    permission_classes = [AllowAny]

    def get(self, request):
        """
        🚀 Generuje sieć postów i kategorii

        Parametry URL:
        - focus_post_id: ID posta do focus (opcjonalne)
        - category_id: limit do specific kategorii (opcjonalne)
        - include_posts: true/false - czy dodać post nodes (default: true)
        - similarity_threshold: próg similarity dla connections (default: 0.7)
        - max_posts: max liczba post nodes (default: 20)
        - max_connections: max connections per post (default: 5)
        """
        try:
            # === 🔧 PARAMETRY ===
            focus_post_id = request.GET.get('focus_post_id')
            category_id = request.GET.get('category_id')
            include_posts = request.GET.get('include_posts', 'true').lower() == 'true'
            similarity_threshold = float(request.GET.get('similarity_threshold', 0.7))
            max_posts = int(request.GET.get('max_posts', 20))
            max_connections = int(request.GET.get('max_connections', 5))

            logger.info(f"🎯 Post Network: focus={focus_post_id}, category={category_id}, "
                       f"threshold={similarity_threshold}, max_posts={max_posts}")

            from gnn_models.integration import gnn_manager
            from django.db.models import Count, Q

            nodes = []
            edges = []

            # === 📂 KROK 1: CATEGORY NODES ===
            # Get relevant categories
            if category_id:
                categories = Category.objects.filter(id=category_id)
            elif focus_post_id:
                # Get categories from focus post
                focus_post = get_object_or_404(Post, id=focus_post_id)
                category_ids = [focus_post.primary_category.id] if focus_post.primary_category else []
                category_ids.extend(focus_post.additional_categories.values_list('id', flat=True))
                categories = Category.objects.filter(id__in=category_ids)
            else:
                # Get main categories with most posts
                categories = Category.objects.annotate(
                    post_count=Count('post', distinct=True) + Count('secondary_posts', distinct=True)
                ).filter(post_count__gte=2).order_by('-post_count')[:10]

            # Create category nodes
            for category in categories:
                nodes.append({
                    'id': f'category_{category.id}',
                    'label': category.name,
                    'type': 'category',
                    'title': f'📂 {category.name}\n{category.description}',
                    'shape': 'dot',
                    'size': 25,
                    'color': {
                        'background': '#3498db',
                        'border': '#2980b9'
                    },
                    'font': {'size': 16},
                    'physics': True
                })

            # === 📄 KROK 2: POST NODES (jeśli włączone) ===
            if include_posts:
                posts_query = Post.objects.select_related('primary_category', 'author')

                if category_id:
                    # Posts from specific category
                    posts_query = posts_query.filter(
                        Q(primary_category_id=category_id) |
                        Q(additional_categories__id=category_id)
                    ).distinct()
                elif focus_post_id:
                    # Get focus post + similar posts
                    focus_post = get_object_or_404(Post, id=focus_post_id)

                    # Start with focus post
                    focus_posts = [focus_post]

                    # Add similar posts if embeddings available
                    if gnn_manager and gnn_manager.embedding_manager and gnn_manager.embedding_manager.available:
                        try:
                            similar_post_data = gnn_manager.find_similar_posts_by_embedding(
                                post_id=focus_post.id,
                                top_k=max_posts-1,  # -1 for focus post
                                threshold=similarity_threshold
                            )
                            if similar_post_data:
                                similar_post_ids = [pid for pid, score in similar_post_data]
                                similar_posts = Post.objects.filter(id__in=similar_post_ids)
                                focus_posts.extend(similar_posts)
                        except Exception as e:
                            logger.warning(f"Similarity search failed: {e}")

                    posts_query = Post.objects.filter(id__in=[p.id for p in focus_posts])
                else:
                    # Recent posts from all categories
                    posts_query = posts_query.order_by('-created_at')[:max_posts]

                posts = list(posts_query[:max_posts])

                # Create post nodes
                for post in posts:
                    # Determine if this is the focus post
                    is_focus = focus_post_id and str(post.id) == str(focus_post_id)

                    nodes.append({
                        'id': f'post_{post.id}',
                        'label': post.title[:30] + ('...' if len(post.title) > 30 else ''),
                        'type': 'post',
                        'post_id': post.id,
                        'title': f'📄 {post.title}\n👤 {post.author.username}\n📅 {post.created_at.strftime("%Y-%m-%d")}\n📂 {post.primary_category.name if post.primary_category else "No category"}',
                        'shape': 'box',
                        'size': 30 if is_focus else 20,
                        'color': {
                            'background': '#e74c3c' if is_focus else '#e67e22',
                            'border': '#c0392b' if is_focus else '#d35400'
                        },
                        'font': {'size': 14, 'color': 'white'},
                        'physics': True,
                        'is_focus': is_focus
                    })

                # === 🔗 KROK 3: POST-CATEGORY CONNECTIONS ===
                # Connect posts to their categories
                for post in posts:
                    # Primary category
                    if post.primary_category:
                        cat_node_id = f'category_{post.primary_category.id}'
                        if any(n['id'] == cat_node_id for n in nodes):
                            edges.append({
                                'id': f'post_{post.id}_to_cat_{post.primary_category.id}',
                                'from': f'post_{post.id}',
                                'to': cat_node_id,
                                'title': 'Primary category',
                                'color': {'color': '#95a5a6'},
                                'width': 2,
                                'dashes': [5, 5]  # Dashed line
                            })

                    # Additional categories
                    for additional_cat in post.additional_categories.all():
                        cat_node_id = f'category_{additional_cat.id}'
                        if any(n['id'] == cat_node_id for n in nodes):
                            edges.append({
                                'id': f'post_{post.id}_to_cat_{additional_cat.id}',
                                'from': f'post_{post.id}',
                                'to': cat_node_id,
                                'title': 'Additional category',
                                'color': {'color': '#bdc3c7'},
                                'width': 1,
                                'dashes': [3, 3]  # Lighter dashed line
                            })

                # === 🔗 KROK 4: POST-POST SIMILARITY CONNECTIONS ===
                if gnn_manager and gnn_manager.embedding_manager and gnn_manager.embedding_manager.available:
                    try:
                        # Create similarity connections between posts
                        post_pairs_checked = set()

                        for post in posts:
                            if len(edges) > 100:  # Limit total edges
                                break

                            similar_post_data = gnn_manager.find_similar_posts_by_embedding(
                                post_id=post.id,
                                top_k=max_connections,
                                threshold=similarity_threshold
                            )

                            if similar_post_data:
                                for similar_post_id, similarity_score in similar_post_data:
                                    # Check if both posts are in our nodes
                                    target_post_node = f'post_{similar_post_id}'
                                    source_post_node = f'post_{post.id}'

                                    if (any(n['id'] == target_post_node for n in nodes) and
                                        any(n['id'] == source_post_node for n in nodes)):

                                        # Avoid duplicate edges
                                        pair_key = tuple(sorted([post.id, similar_post_id]))
                                        if pair_key not in post_pairs_checked:
                                            post_pairs_checked.add(pair_key)

                                            # Color based on similarity strength
                                            if similarity_score > 0.9:
                                                color = '#2ecc71'  # Strong green
                                                width = 4
                                            elif similarity_score > 0.8:
                                                color = '#3498db'  # Blue
                                                width = 3
                                            else:
                                                color = '#95a5a6'  # Gray
                                                width = 2

                                            edges.append({
                                                'id': f'similarity_{post.id}_{similar_post_id}',
                                                'from': source_post_node,
                                                'to': target_post_node,
                                                'title': f'Semantic similarity: {similarity_score:.3f}',
                                                'color': {'color': color},
                                                'width': width,
                                                'smooth': {'type': 'continuous'}
                                            })

                    except Exception as e:
                        logger.warning(f"Post similarity connections failed: {e}")

            # === 📤 RESPONSE ===
            return Response({
                'nodes': nodes,
                'edges': edges,
                'stats': {
                    'total_nodes': len(nodes),
                    'total_edges': len(edges),
                    'category_nodes': len([n for n in nodes if n['type'] == 'category']),
                    'post_nodes': len([n for n in nodes if n['type'] == 'post']),
                    'focus_post_id': focus_post_id,
                    'category_id': category_id,
                    'similarity_threshold': similarity_threshold,
                    'max_posts': max_posts,
                    'embeddings_available': bool(gnn_manager and gnn_manager.embedding_manager and gnn_manager.embedding_manager.available)
                }
            })

        except Exception as e:
            logger.error(f"💥 Post network generation failed: {e}")
            import traceback
            logger.error(traceback.format_exc())

            return Response({
                'error': 'Post network generation failed',
                'details': str(e),
                'nodes': [],
                'edges': []
            }, status=500)