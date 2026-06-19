from django.urls import path

from .views import ContactSubmissionCreateView

urlpatterns = [
    path("contact/", ContactSubmissionCreateView.as_view(), name="contact-create"),
]
