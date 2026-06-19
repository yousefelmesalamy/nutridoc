from django.db import models


class ContactSubmission(models.Model):
    SUBJECT_CHOICES = [
        ("general", "General Inquiry"),
        ("consult", "Nutrition Consultation"),
        ("media", "Media"),
        ("partnership", "Partnership"),
    ]

    name = models.CharField(max_length=120)
    email = models.EmailField()
    phone = models.CharField(max_length=40, blank=True)
    subject = models.CharField(max_length=20, choices=SUBJECT_CHOICES, default="general")
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.name} ({self.get_subject_display()})"


class PlanRequest(models.Model):
    PLAN_CHOICES = [
        ("basic", "Basic"),
        ("pro", "Pro"),
        ("premium", "Premium"),
    ]
    STATUS_CHOICES = [
        ("new", "New"),
        ("contacted", "Contacted"),
        ("closed", "Closed"),
    ]

    name = models.CharField(max_length=120)
    email = models.EmailField()
    phone = models.CharField(max_length=40, blank=True)
    plan = models.CharField(max_length=10, choices=PLAN_CHOICES)
    message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="new")

    def __str__(self):
        return f"{self.name} ({self.get_plan_display()})"
