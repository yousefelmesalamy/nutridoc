from django.conf import settings
from django.test import TestCase


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
