from django.contrib import admin

from .models import Category


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name_en", "name_ar", "slug")
    search_fields = ("name_en", "name_ar", "slug")
