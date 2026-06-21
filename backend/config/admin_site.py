from datetime import date, timedelta

from django.contrib import admin
from django.db.models import Count
from django.db.models.functions import TruncDate, TruncMonth

from blog.models import BlogPost
from leads.models import ContactSubmission, PlanRequest

DAILY_WINDOW_DAYS = 90
MONTHLY_WINDOW_MONTHS = 12


def _activity_series(queryset, date_field="created_at"):
    today = date.today()

    daily_start = today - timedelta(days=DAILY_WINDOW_DAYS - 1)
    daily_counts = dict(
        queryset.filter(**{f"{date_field}__date__gte": daily_start})
        .annotate(day=TruncDate(date_field))
        .values("day")
        .annotate(count=Count("id"))
        .values_list("day", "count")
    )
    daily = []
    for offset in range(DAILY_WINDOW_DAYS):
        day = daily_start + timedelta(days=offset)
        daily.append({"label": day.isoformat(), "value": daily_counts.get(day, 0)})

    month_keys = []
    year, month = today.year, today.month
    for _ in range(MONTHLY_WINDOW_MONTHS):
        month_keys.append((year, month))
        month -= 1
        if month == 0:
            month = 12
            year -= 1
    month_keys.reverse()
    monthly_start = date(month_keys[0][0], month_keys[0][1], 1)

    monthly_counts = dict(
        queryset.filter(**{f"{date_field}__date__gte": monthly_start})
        .annotate(month=TruncMonth(date_field))
        .values("month")
        .annotate(count=Count("id"))
        .values_list("month", "count")
    )
    monthly_counts = {(d.year, d.month): c for d, c in monthly_counts.items()}
    monthly = [
        {"label": f"{y:04d}-{m:02d}", "value": monthly_counts.get((y, m), 0)}
        for (y, m) in month_keys
    ]

    return {"daily": daily, "monthly": monthly}


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
        extra_context["posts_chart"] = _activity_series(BlogPost.objects.all())
        extra_context["contacts_chart"] = _activity_series(ContactSubmission.objects.all())
        extra_context["plan_requests_chart"] = _activity_series(PlanRequest.objects.all())
        return super().index(request, extra_context)
