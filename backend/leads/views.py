from rest_framework import generics

from .models import ContactSubmission, PlanRequest
from .serializers import ContactSubmissionSerializer, PlanRequestSerializer


class ContactSubmissionCreateView(generics.CreateAPIView):
    queryset = ContactSubmission.objects.all()
    serializer_class = ContactSubmissionSerializer


class PlanRequestCreateView(generics.CreateAPIView):
    queryset = PlanRequest.objects.all()
    serializer_class = PlanRequestSerializer
