from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status

from blog.models import Category


class CategoryAPITests(APITestCase):
    def test_list_categories(self):
        Category.objects.create(name_en="Weight Management", name_ar="إدارة الوزن", slug="weight-management")
        Category.objects.create(name_en="Myths & Facts", name_ar="حقائق وخرافات", slug="myths-facts")

        response = self.client.get("/api/categories/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data["results"] if "results" in response.data else response.data
        self.assertEqual(len(results), 2)
        self.assertEqual(results[0]["slug"], "weight-management")
