from django.db import models
from django_ckeditor_5.fields import CKEditor5Field


class Category(models.Model):
    name_en = models.CharField(max_length=100)
    name_ar = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)

    class Meta:
        verbose_name_plural = "categories"

    def __str__(self):
        return self.name_en


class BlogPost(models.Model):
    title_en = models.CharField(max_length=200)
    title_ar = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name="posts")
    excerpt_en = models.TextField()
    excerpt_ar = models.TextField()
    body_en = CKEditor5Field(config_name="default")
    body_ar = CKEditor5Field(config_name="default")
    author = models.CharField(max_length=120, default="Dr. Karim Eltaher")
    cover_image_url = models.URLField(blank=True)
    read_time_minutes = models.PositiveIntegerField()
    published_at = models.DateTimeField(null=True, blank=True)
    is_published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-published_at"]

    def __str__(self):
        return self.title_en
