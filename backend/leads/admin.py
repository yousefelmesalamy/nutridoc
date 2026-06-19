from django.contrib import admin

from .models import ContactSubmission, PlanRequest


@admin.register(ContactSubmission)
class ContactSubmissionAdmin(admin.ModelAdmin):
    list_display = ("name", "email", "subject", "created_at", "is_read")
    list_filter = ("subject", "is_read")
    search_fields = ("name", "email", "message")
    readonly_fields = ("created_at",)


@admin.register(PlanRequest)
class PlanRequestAdmin(admin.ModelAdmin):
    list_display = ("name", "email", "plan", "status", "created_at")
    list_filter = ("plan", "status")
    search_fields = ("name", "email", "message")
    readonly_fields = ("created_at",)
