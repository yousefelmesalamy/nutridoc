from django.contrib import admin

from .models import BlogPost, Category


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name_en", "name_ar", "slug")
    search_fields = ("name_en", "name_ar", "slug")


@admin.register(BlogPost)
class BlogPostAdmin(admin.ModelAdmin):
    list_display = ("title_en", "category", "is_published", "published_at")
    list_filter = ("category", "is_published")
    search_fields = ("title_en", "title_ar", "excerpt_en", "excerpt_ar")
