from django.urls import path

from .views import ContactSubmissionCreateView, PlanRequestCreateView

urlpatterns = [
    path("contact/", ContactSubmissionCreateView.as_view(), name="contact-create"),
    path("plan-requests/", PlanRequestCreateView.as_view(), name="plan-request-create"),
]
