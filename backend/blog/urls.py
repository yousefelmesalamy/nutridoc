from django.urls import path

from .views import BlogPostDetailView, BlogPostListView, CategoryListView

urlpatterns = [
    path("categories/", CategoryListView.as_view(), name="category-list"),
    path("posts/", BlogPostListView.as_view(), name="post-list"),
    path("posts/<slug:slug>/", BlogPostDetailView.as_view(), name="post-detail"),
]
