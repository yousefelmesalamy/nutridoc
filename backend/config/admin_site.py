from django.contrib import admin

from blog.models import BlogPost
from leads.models import ContactSubmission, PlanRequest


class NutriDocAdminSite(admin.AdminSite):
    def index(self, request, extra_context=None):
        extra_context = extra_context or {}
        extra_context["dashboard_stats"] = [
            {
                "label": "Total Posts",
                "value": BlogPost.objects.count(),
                "icon": "fas fa-book",
            },
            {
                "label": "Published Posts",
                "value": BlogPost.objects.filter(is_published=True).count(),
                "icon": "fas fa-check-circle",
            },
            {
                "label": "Unread Contacts",
                "value": ContactSubmission.objects.filter(is_read=False).count(),
                "icon": "fas fa-envelope",
            },
            {
                "label": "New Plan Requests",
                "value": PlanRequest.objects.filter(status="new").count(),
                "icon": "fas fa-clipboard-list",
            },
        ]
        extra_context["dashboard_recent"] = {
            "posts": BlogPost.objects.order_by("-created_at")[:5],
            "plan_requests": PlanRequest.objects.order_by("-created_at")[:5],
            "contacts": ContactSubmission.objects.order_by("-created_at")[:5],
        }
        return super().index(request, extra_context)
