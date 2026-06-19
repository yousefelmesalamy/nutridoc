from django.contrib.admin.apps import AdminConfig


class NutriDocAdminConfig(AdminConfig):
    default_site = "config.admin_site.NutriDocAdminSite"
