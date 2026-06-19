from rest_framework import serializers

from .models import BlogPost, Category


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name_en", "name_ar", "slug"]


class BlogPostListSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)

    class Meta:
        model = BlogPost
        fields = [
            "id", "title_en", "title_ar", "slug", "category",
            "excerpt_en", "excerpt_ar", "author", "cover_image_url",
            "read_time_minutes", "published_at",
        ]


class BlogPostDetailSerializer(BlogPostListSerializer):
    related = serializers.SerializerMethodField()

    class Meta(BlogPostListSerializer.Meta):
        fields = BlogPostListSerializer.Meta.fields + ["body_en", "body_ar", "related"]

    def get_related(self, obj):
        related_qs = (
            BlogPost.objects.filter(category=obj.category, is_published=True)
            .exclude(pk=obj.pk)
            .order_by("-published_at")[:3]
        )
        return BlogPostListSerializer(related_qs, many=True).data
