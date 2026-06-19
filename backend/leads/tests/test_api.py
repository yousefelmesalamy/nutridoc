from rest_framework.test import APITestCase
from rest_framework import status

from leads.models import ContactSubmission


class ContactSubmissionAPITests(APITestCase):
    def test_create_with_valid_data(self):
        response = self.client.post("/api/contact/", {
            "name": "Sara",
            "email": "sara@example.com",
            "phone": "+966500000000",
            "subject": "consult",
            "message": "I'd like a consultation.",
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ContactSubmission.objects.count(), 1)
        submission = ContactSubmission.objects.first()
        self.assertEqual(submission.name, "Sara")
        self.assertFalse(submission.is_read)

    def test_create_without_email_fails(self):
        response = self.client.post("/api/contact/", {
            "name": "Sara",
            "message": "Missing email.",
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(ContactSubmission.objects.count(), 0)

    def test_subject_defaults_to_general(self):
        response = self.client.post("/api/contact/", {
            "name": "Sara",
            "email": "sara@example.com",
            "message": "No subject given.",
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ContactSubmission.objects.first().subject, "general")
