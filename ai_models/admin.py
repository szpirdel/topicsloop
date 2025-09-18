from django.contrib import admin
from .models import PostEmbedding, PostSimilarity, UserEmbedding, CategoryEmbedding, EmbeddingJob


@admin.register(PostEmbedding)
class PostEmbeddingAdmin(admin.ModelAdmin):
    list_display = ['post', 'model_name', 'embedding_dimension', 'created_at']
    list_filter = ['model_name', 'created_at', 'embedding_dimension']
    search_fields = ['post__title', 'model_name']
    readonly_fields = ['embedding_dimension', 'created_at', 'updated_at']

    fieldsets = (
        ('Post Information', {
            'fields': ('post', 'model_name')
        }),
        ('Embedding Data', {
            'fields': ('embedding_vector', 'embedding_dimension', 'content_hash')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('post')


@admin.register(PostSimilarity)
class PostSimilarityAdmin(admin.ModelAdmin):
    list_display = ['post1', 'post2', 'similarity_score', 'algorithm', 'model_name', 'created_at']
    list_filter = ['algorithm', 'model_name', 'created_at']
    search_fields = ['post1__title', 'post2__title']
    readonly_fields = ['created_at']

    fieldsets = (
        ('Posts', {
            'fields': ('post1', 'post2')
        }),
        ('Similarity Data', {
            'fields': ('similarity_score', 'algorithm', 'model_name')
        }),
        ('Metadata', {
            'fields': ('created_at',)
        }),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('post1', 'post2')

    # Custom action to recalculate similarities
    def recalculate_similarities(self, request, queryset):
        # Placeholder for future implementation
        self.message_user(request, f"Recalculation queued for {queryset.count()} similarities")

    recalculate_similarities.short_description = "Recalculate selected similarities"
    actions = [recalculate_similarities]


@admin.register(UserEmbedding)
class UserEmbeddingAdmin(admin.ModelAdmin):
    list_display = ['user', 'model_name', 'vector_dimension', 'activity_count', 'last_activity_at']
    list_filter = ['model_name', 'created_at', 'vector_dimension']
    search_fields = ['user__username', 'user__email', 'model_name']
    readonly_fields = ['vector_dimension', 'created_at', 'updated_at']

    fieldsets = (
        ('User Information', {
            'fields': ('user', 'model_name')
        }),
        ('Interest Data', {
            'fields': ('interest_vector', 'vector_dimension')
        }),
        ('Activity Tracking', {
            'fields': ('activity_count', 'last_activity_at')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')


@admin.register(CategoryEmbedding)
class CategoryEmbeddingAdmin(admin.ModelAdmin):
    list_display = ['category', 'model_name', 'vector_dimension', 'post_count', 'created_at']
    list_filter = ['model_name', 'created_at', 'vector_dimension']
    search_fields = ['category__name', 'model_name']
    readonly_fields = ['vector_dimension', 'created_at', 'updated_at']

    fieldsets = (
        ('Category Information', {
            'fields': ('category', 'model_name')
        }),
        ('Embedding Data', {
            'fields': ('aggregated_vector', 'vector_dimension', 'post_count')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('category')


@admin.register(EmbeddingJob)
class EmbeddingJobAdmin(admin.ModelAdmin):
    list_display = ['job_type', 'status', 'model_name', 'target_id', 'created_at', 'completed_at']
    list_filter = ['job_type', 'status', 'model_name', 'created_at']
    search_fields = ['job_type', 'model_name', 'target_id']
    readonly_fields = ['created_at', 'started_at', 'completed_at']

    fieldsets = (
        ('Job Information', {
            'fields': ('job_type', 'status', 'model_name', 'target_id')
        }),
        ('Error Information', {
            'fields': ('error_message',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'started_at', 'completed_at'),
            'classes': ('collapse',)
        }),
    )

    # Custom actions
    def retry_failed_jobs(self, request, queryset):
        failed_jobs = queryset.filter(status='failed')
        count = failed_jobs.update(status='pending', error_message='')
        self.message_user(request, f"Reset {count} failed jobs to pending")

    retry_failed_jobs.short_description = "Retry selected failed jobs"

    def mark_as_failed(self, request, queryset):
        count = queryset.update(status='failed')
        self.message_user(request, f"Marked {count} jobs as failed")

    mark_as_failed.short_description = "Mark selected jobs as failed"

    actions = [retry_failed_jobs, mark_as_failed]

    # Display job stats in changelist
    def changelist_view(self, request, extra_context=None):
        extra_context = extra_context or {}

        # Add job statistics
        from django.db.models import Count
        stats = EmbeddingJob.objects.values('status').annotate(count=Count('id'))
        extra_context['job_stats'] = {stat['status']: stat['count'] for stat in stats}

        return super().changelist_view(request, extra_context=extra_context)