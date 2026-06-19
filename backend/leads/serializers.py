from rest_framework import serializers

from .models import ContactSubmission, PlanRequest


class ContactSubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactSubmission
        fields = ["name", "email", "phone", "subject", "message"]


class PlanRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlanRequest
        fields = ["name", "email", "phone", "plan", "message"]
