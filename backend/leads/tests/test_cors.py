from rest_framework.test import APITestCase
from rest_framework import status


class CorsTests(APITestCase):
    def test_allowed_origin_gets_cors_header(self):
        response = self.client.get(
            "/api/categories/",
            HTTP_ORIGIN="http://localhost:4200",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.headers.get("Access-Control-Allow-Origin"),
            "http://localhost:4200",
        )
