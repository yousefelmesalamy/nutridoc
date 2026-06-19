from django.db.models import Q
from rest_framework import generics

from .models import BlogPost, Category
from .serializers import BlogPostListSerializer, CategorySerializer


class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.all().order_by("id")
    serializer_class = CategorySerializer


class BlogPostListView(generics.ListAPIView):
    serializer_class = BlogPostListSerializer

    def get_queryset(self):
        queryset = BlogPost.objects.filter(is_published=True).select_related("category")

        category_slug = self.request.query_params.get("category")
        if category_slug:
            queryset = queryset.filter(category__slug=category_slug)

        q = self.request.query_params.get("q")
        if q:
            queryset = queryset.filter(
                Q(title_en__icontains=q)
                | Q(title_ar__icontains=q)
                | Q(excerpt_en__icontains=q)
                | Q(excerpt_ar__icontains=q)
            )

        return queryset.order_by("-published_at")
