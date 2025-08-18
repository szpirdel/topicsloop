from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Post
from .serializers import PostSerializer
from django.http import JsonResponse

def api_root(request):
    return JsonResponse({"message": "Welcome to the API", "endpoints": ["/posts/"]})


class PostListView(APIView):
    def get(self, request):
        posts = Post.objects.all()
        serializer = PostSerializer(posts, many=True)
        return Response(serializer.data)
