from django.test import TestCase

from blog.models import BlogPost, Category


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


class BlogPostModelTests(TestCase):
    def setUp(self):
        self.category = Category.objects.create(
            name_en="Clinical Nutrition", name_ar="تغذية إكلينيكية", slug="clinical-nutrition"
        )

    def test_str_returns_title_en(self):
        post = BlogPost.objects.create(
            title_en="Protein Timing",
            title_ar="توقيت البروتين",
            slug="protein-timing",
            category=self.category,
            excerpt_en="excerpt",
            excerpt_ar="ملخص",
            body_en="body",
            body_ar="نص",
            read_time_minutes=6,
        )
        self.assertEqual(str(post), "Protein Timing")

    def test_defaults(self):
        post = BlogPost.objects.create(
            title_en="Protein Timing 2",
            title_ar="توقيت البروتين ٢",
            slug="protein-timing-2",
            category=self.category,
            excerpt_en="excerpt",
            excerpt_ar="ملخص",
            body_en="body",
            body_ar="نص",
            read_time_minutes=6,
        )
        self.assertEqual(post.author, "Dr. Karim Eltaher")
        self.assertFalse(post.is_published)
        self.assertIsNone(post.published_at)
