from django.conf import settings
from django.test import TestCase
from django.contrib.auth import get_user_model

from blog.models import BlogPost, Category
from leads.models import ContactSubmission, PlanRequest


class AdminSmokeTest(TestCase):
    def test_admin_login_page_loads(self):
        response = self.client.get('/admin/login/')
        self.assertEqual(response.status_code, 200)


class JazzminThemeTest(TestCase):
    def test_jazzmin_settings_configured(self):
        self.assertEqual(settings.JAZZMIN_SETTINGS["site_brand"], "NutriDoc")
        self.assertEqual(settings.JAZZMIN_UI_TWEAKS["accent"], "accent-success")

    def test_admin_login_page_uses_jazzmin_branding(self):
        response = self.client.get('/admin/login/')
        self.assertContains(response, "NutriDoc")


class AdminDashboardContextTest(TestCase):
    def setUp(self):
        User = get_user_model()
        self.admin_user = User.objects.create_superuser(
            username="admin", email="admin@example.com", password="password123"
        )
        self.client.force_login(self.admin_user)

        category = Category.objects.create(name_en="Diet", name_ar="حمية", slug="diet")
        BlogPost.objects.create(
            title_en="Published Post", title_ar="منشور", slug="published-post",
            category=category, excerpt_en="x", excerpt_ar="x", body_en="x", body_ar="x",
            read_time_minutes=3, is_published=True,
        )
        BlogPost.objects.create(
            title_en="Draft Post", title_ar="مسودة", slug="draft-post",
            category=category, excerpt_en="x", excerpt_ar="x", body_en="x", body_ar="x",
            read_time_minutes=3, is_published=False,
        )
        ContactSubmission.objects.create(name="Jane", email="jane@example.com", message="hi", is_read=False)
        ContactSubmission.objects.create(name="Joe", email="joe@example.com", message="hi", is_read=True)
        PlanRequest.objects.create(name="Sam", email="sam@example.com", plan="pro", status="new")
        PlanRequest.objects.create(name="Lee", email="lee@example.com", plan="basic", status="closed")

    def test_dashboard_stats_in_context(self):
        response = self.client.get("/admin/")
        stats = {s["label"]: s["value"] for s in response.context["dashboard_stats"]}
        self.assertEqual(stats["Total Posts"], 2)
        self.assertEqual(stats["Published Posts"], 1)
        self.assertEqual(stats["Unread Contacts"], 1)
        self.assertEqual(stats["New Plan Requests"], 1)

    def test_dashboard_recent_in_context(self):
        response = self.client.get("/admin/")
        recent = response.context["dashboard_recent"]
        self.assertEqual(list(recent["posts"]), list(BlogPost.objects.order_by("-created_at")[:5]))
        self.assertEqual(list(recent["plan_requests"]), list(PlanRequest.objects.order_by("-created_at")[:5]))
        self.assertEqual(list(recent["contacts"]), list(ContactSubmission.objects.order_by("-created_at")[:5]))

    def test_dashboard_chart_series_in_context(self):
        response = self.client.get("/admin/")
        for key in ("posts_chart", "contacts_chart", "plan_requests_chart"):
            chart = response.context[key]
            self.assertIn("daily", chart)
            self.assertIn("monthly", chart)
            self.assertEqual(len(chart["daily"]), 90)
            self.assertEqual(len(chart["monthly"]), 12)
            # every entry created in setUp() happened today
            self.assertEqual(chart["daily"][-1]["value"], 2)
            self.assertEqual(chart["monthly"][-1]["value"], 2)
            # labels are zero-filled, oldest first
            self.assertTrue(chart["daily"][0]["label"] < chart["daily"][-1]["label"])


class AdminDashboardTemplateTest(TestCase):
    def setUp(self):
        User = get_user_model()
        self.admin_user = User.objects.create_superuser(
            username="admin2", email="admin2@example.com", password="password123"
        )
        self.client.force_login(self.admin_user)
        category = Category.objects.create(name_en="Hydration", name_ar="ترطيب", slug="hydration")
        BlogPost.objects.create(
            title_en="Stay Hydrated", title_ar="ترطيب", slug="stay-hydrated",
            category=category, excerpt_en="x", excerpt_ar="x", body_en="x", body_ar="x",
            read_time_minutes=2, is_published=True,
        )

    def test_dashboard_renders_stat_cards_and_recent_post(self):
        response = self.client.get("/admin/")
        self.assertContains(response, "Total Posts")
        self.assertContains(response, "Published Posts")
        self.assertContains(response, "Unread Contacts")
        self.assertContains(response, "New Plan Requests")
        self.assertContains(response, "Stay Hydrated")
