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