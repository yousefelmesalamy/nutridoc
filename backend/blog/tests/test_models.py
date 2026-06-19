from django.test import TestCase

from blog.models import Category


class CategoryModelTests(TestCase):
    def test_str_returns_name_en(self):
        category = Category.objects.create(
            name_en="Weight Management",
            name_ar="إدارة الوزن",
            slug="weight-management",
        )
        self.assertEqual(str(category), "Weight Management")

    def test_slug_must_be_unique(self):
        Category.objects.create(name_en="A", name_ar="أ", slug="dup")
        with self.assertRaises(Exception):
            Category.objects.create(name_en="B", name_ar="ب", slug="dup")
