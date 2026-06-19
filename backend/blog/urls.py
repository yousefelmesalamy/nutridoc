from django.urls import path

from .views import BlogPostListView, CategoryListView

urlpatterns = [
    path("categories/", CategoryListView.as_view(), name="category-list"),
    path("posts/", BlogPostListView.as_view(), name="post-list"),
]
