from django.contrib import admin

from blog.models import BlogPost
from leads.models import ContactSubmission, PlanRequest


class NutriDocAdminSite(admin.AdminSite):
    def index(self, request, extra_context=None):
        extra_context = extra_context or {}
        unread_contacts = ContactSubmission.objects.filter(is_read=False).count()
        new_plan_requests = PlanRequest.objects.filter(status="new").count()
        extra_context["dashboard_stats"] = [
            {
                "label": "Total Posts",
                "value": BlogPost.objects.count(),
                "icon": "fas fa-book",
                "color": "primary",
                "url": "admin:blog_blogpost_changelist",
            },
            {
                "label": "Published Posts",
                "value": BlogPost.objects.filter(is_published=True).count(),
                "icon": "fas fa-check-circle",
                "color": "success",
                "url": "admin:blog_blogpost_changelist",
            },
            {
                "label": "Unread Contacts",
                "value": unread_contacts,
                "icon": "fas fa-envelope",
                "color": "danger" if unread_contacts else "secondary",
                "url": "admin:leads_contactsubmission_changelist",
            },
            {
                "label": "New Plan Requests",
                "value": new_plan_requests,
                "icon": "fas fa-clipboard-list",
                "color": "warning" if new_plan_requests else "secondary",
                "url": "admin:leads_planrequest_changelist",
            },
        ]
        extra_context["dashboard_recent"] = {
            "posts": BlogPost.objects.order_by("-created_at")[:5],
            "plan_requests": PlanRequest.objects.order_by("-created_at")[:5],
            "contacts": ContactSubmission.objects.order_by("-created_at")[:5],
        }
        return super().index(request, extra_context)
