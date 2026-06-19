from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APITestCase
from rest_framework import status

from blog.models import BlogPost, Category


class CategoryAPITests(APITestCase):
    def test_list_categories(self):
        Category.objects.create(name_en="Weight Management", name_ar="إدارة الوزن", slug="weight-management")
        Category.objects.create(name_en="Myths & Facts", name_ar="حقائق وخرافات", slug="myths-facts")

        response = self.client.get("/api/categories/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data["results"] if "results" in response.data else response.data
        self.assertEqual(len(results), 2)
        self.assertEqual(results[0]["slug"], "weight-management")


class BlogPostListAPITests(APITestCase):
    def setUp(self):
        self.cat_weight = Category.objects.create(name_en="Weight", name_ar="وزن", slug="weight")
        self.cat_myths = Category.objects.create(name_en="Myths", name_ar="خرافات", slug="myths")
        self.published_weight = BlogPost.objects.create(
            title_en="Crash Diets Fail", title_ar="فشل الحميات", slug="crash-diets-fail",
            category=self.cat_weight, excerpt_en="excerpt", excerpt_ar="ملخص",
            body_en="body", body_ar="نص", read_time_minutes=7,
            is_published=True, published_at=timezone.now(),
        )
        self.published_myth = BlogPost.objects.create(
            title_en="Detox Tea Myth", title_ar="خرافة شاي الديتوكس", slug="detox-tea-myth",
            category=self.cat_myths, excerpt_en="excerpt", excerpt_ar="ملخص",
            body_en="body", body_ar="نص", read_time_minutes=5,
            is_published=True, published_at=timezone.now(),
        )
        self.draft = BlogPost.objects.create(
            title_en="Unpublished Draft", title_ar="مسودة", slug="unpublished-draft",
            category=self.cat_weight, excerpt_en="excerpt", excerpt_ar="ملخص",
            body_en="body", body_ar="نص", read_time_minutes=4,
            is_published=False,
        )

    def test_list_only_returns_published(self):
        response = self.client.get("/api/posts/")
        slugs = [p["slug"] for p in response.data["results"]]
        self.assertIn("crash-diets-fail", slugs)
        self.assertIn("detox-tea-myth", slugs)
        self.assertNotIn("unpublished-draft", slugs)

    def test_filter_by_category(self):
        response = self.client.get("/api/posts/?category=myths")
        slugs = [p["slug"] for p in response.data["results"]]
        self.assertEqual(slugs, ["detox-tea-myth"])

    def test_search_by_query(self):
        response = self.client.get("/api/posts/?q=detox")
        slugs = [p["slug"] for p in response.data["results"]]
        self.assertEqual(slugs, ["detox-tea-myth"])
