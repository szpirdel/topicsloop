from rest_framework import serializers
from blog.models import Post, Category, Tag
from accounts.models import CustomUser, UserProfile

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email']

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'description']

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name']

class PostSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    primary_category = CategorySerializer(read_only=True)
    additional_categories = CategorySerializer(many=True, read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    
    # Add write fields
    primary_category_id = serializers.IntegerField(write_only=True)
    additional_category_ids = serializers.ListField(
        child=serializers.IntegerField(), 
        write_only=True, 
        required=False
    )
    tag_ids = serializers.ListField(
        child=serializers.IntegerField(), 
        write_only=True, 
        required=False
    )
    
    class Meta:
        model = Post
        fields = [
            'id', 'title', 'content', 'author',
            'primary_category', 'additional_categories', 'tags',
            'primary_category_id', 'additional_category_ids', 'tag_ids',
            'created_at', 'updated_at'
        ]
    
    def create(self, validated_data):
        additional_category_ids = validated_data.pop('additional_category_ids', [])
        tag_ids = validated_data.pop('tag_ids', [])

        # Create post
        post = Post.objects.create(**validated_data)

        # Set many-to-many relationships
        if additional_category_ids:
            post.additional_categories.set(additional_category_ids)
        if tag_ids:
            post.tags.set(tag_ids)

        return post

    def update(self, instance, validated_data):
        additional_category_ids = validated_data.pop('additional_category_ids', None)
        tag_ids = validated_data.pop('tag_ids', None)

        # Update basic fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Update many-to-many relationships if provided
        if additional_category_ids is not None:
            instance.additional_categories.set(additional_category_ids)
        if tag_ids is not None:
            instance.tags.set(tag_ids)

        return instance


class UserProfileSerializer(serializers.ModelSerializer):
    favorite_categories = CategorySerializer(many=True, read_only=True)
    favorite_category_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        help_text="List of category IDs to set as favorites"
    )
    user = UserSerializer(read_only=True)

    class Meta:
        model = UserProfile
        fields = [
            'id', 'user', 'bio', 'favorite_categories',
            'favorite_category_ids', 'created_at', 'updated_at'
        ]

    def update(self, instance, validated_data):
        favorite_category_ids = validated_data.pop('favorite_category_ids', None)

        # Update basic fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Update favorite categories if provided
        if favorite_category_ids is not None:
            instance.favorite_categories.set(favorite_category_ids)

        return instance
