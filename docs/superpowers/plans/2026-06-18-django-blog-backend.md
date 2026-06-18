# NutriDoc Django Blog Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Django + DRF backend that stores blog posts (bilingual EN/AR) and lead-capture form submissions (contact + plan requests), manageable via Django admin and exposed via a JSON API.

**Architecture:** A single Django project (`config`) with two apps: `blog` (Category, BlogPost models + read-only API) and `leads` (ContactSubmission, PlanRequest models + create-only API). SQLite for local dev. Django admin is the only admin UI — no custom frontend in this plan.

**Tech Stack:** Python 3, Django, Django REST Framework, django-cors-headers, SQLite.

## Global Constraints

- Bilingual fields use explicit `_en`/`_ar` suffixes (no i18n library) — matches the prototype's pattern and keeps admin editing simple. From spec: `docs/superpowers/specs/2026-06-18-django-backend-design.md`.
- Read endpoints (`GET /api/categories/`, `GET /api/posts/`, `GET /api/posts/<slug>/`) are public, unauthenticated.
- Write endpoints (`POST /api/contact/`, `POST /api/plan-requests/`) are public, unauthenticated, and only return success/failure — never echo back stored data.
- `BlogPost.body_en`/`body_ar` are plain Markdown-formatted `TextField`s, not the prototype's per-section fields (lede/h2a/p1/quote/etc.) — that structure was specific to one demo article and won't generalize.
- Admin is the only management UI. No custom admin frontend, no email notifications, no payments, no image upload/CDN (cover image is a URL field).
- All commands below assume the repo root is `/Users/yosefel-mesalamy/business-only/nutridoc-website-design`.

---

### Task 1: Project scaffolding (Django + DRF + CORS)

**Files:**
- Create: `backend/requirements.txt`
- Create: `backend/manage.py` (via `django-admin startproject`)
- Create: `backend/config/settings.py`, `backend/config/urls.py`, `backend/config/wsgi.py`, `backend/config/asgi.py` (via `django-admin startproject`)
- Create: `backend/blog/` app skeleton (via `manage.py startapp`)
- Create: `backend/leads/` app skeleton (via `manage.py startapp`)
- Create: `.gitignore`
- Test: `backend/config/tests.py`

**Interfaces:**
- Produces: a working Django project at `backend/` with `blog` and `leads` apps registered in `INSTALLED_APPS`, `rest_framework` and `corsheaders` installed and configured. Later tasks add models/views/urls inside `backend/blog/` and `backend/leads/`.

- [ ] **Step 1: Write `backend/requirements.txt`**

```
Django>=5.0,<6.0
djangorestframework>=3.15,<4.0
django-cors-headers>=4.3,<5.0
```

- [ ] **Step 2: Create a virtualenv and install dependencies**

Run (from repo root):
```bash
python3 -m venv .venv
source .venv/bin/activate
mkdir -p backend
pip install -r backend/requirements.txt
```
Expected: pip installs Django, djangorestframework, django-cors-headers without errors.

- [ ] **Step 3: Scaffold the Django project and apps**

Run (from repo root, with venv active):
```bash
cd backend
django-admin startproject config .
python manage.py startapp blog
python manage.py startapp leads
cd ..
```
Expected: `backend/manage.py`, `backend/config/`, `backend/blog/`, `backend/leads/` now exist.

- [ ] **Step 4: Edit `backend/config/settings.py` — replace `INSTALLED_APPS`**

Replace the `INSTALLED_APPS` list with:

```python
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'blog',
    'leads',
]
```

- [ ] **Step 5: Edit `backend/config/settings.py` — replace `MIDDLEWARE`**

Replace the `MIDDLEWARE` list with (note `CorsMiddleware` must be near the top, before `CommonMiddleware`):

```python
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]
```

- [ ] **Step 6: Edit `backend/config/settings.py` — append CORS and DRF config**

Append to the end of the file:

```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:4200",
]

REST_FRAMEWORK = {
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 9,
}
```

- [ ] **Step 7: Run initial migrations**

Run:
```bash
cd backend
python manage.py migrate
cd ..
```
Expected: output ends with `Applying ... OK` lines for `auth`, `admin`, `sessions`, `contenttypes`, no errors.

- [ ] **Step 8: Write the smoke test**

Create `backend/config/tests.py`:

```python
from django.test import TestCase


class AdminSmokeTest(TestCase):
    def test_admin_login_page_loads(self):
        response = self.client.get('/admin/login/')
        self.assertEqual(response.status_code, 200)
```

- [ ] **Step 9: Run the test and verify it passes**

Run:
```bash
cd backend
python manage.py test config
cd ..
```
Expected: `Ran 1 test ... OK`.

- [ ] **Step 10: Add `.gitignore` and commit**

Create `.gitignore` at repo root:

```
.venv/
__pycache__/
*.pyc
backend/db.sqlite3
```

Run:
```bash
git add backend .gitignore
git commit -m "Scaffold Django project with DRF and CORS configured"
```

---

### Task 2: Category model + admin

**Files:**
- Modify: `backend/blog/models.py`
- Modify: `backend/blog/admin.py`
- Create: `backend/blog/migrations/0001_initial.py` (via `makemigrations`)
- Test: `backend/blog/tests/__init__.py`, `backend/blog/tests/test_models.py`

**Interfaces:**
- Produces: `blog.models.Category` with fields `name_en` (str), `name_ar` (str), `slug` (str, unique). `Category.__str__()` returns `name_en`.

- [ ] **Step 1: Write the failing test**

Create `backend/blog/tests/__init__.py` (empty file).

Create `backend/blog/tests/test_models.py`:

```python
from django.test import TestCase

from blog.models import Category


class CategoryModelTests(TestCase):
    def test_str_returns_name_en(self):
        category = Category.objects.create(
            name_en="Weight Management",
            name_ar="إدارة الوزن",
            slug="weight-management",
        )
        self.assertEqual(str(category), "Weight Management")

    def test_slug_must_be_unique(self):
        Category.objects.create(name_en="A", name_ar="أ", slug="dup")
        with self.assertRaises(Exception):
            Category.objects.create(name_en="B", name_ar="ب", slug="dup")
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
cd backend
python manage.py test blog
cd ..
```
Expected: FAIL/ERROR — `ImportError: cannot import name 'Category' from 'blog.models'`.

- [ ] **Step 3: Implement the model**

Replace `backend/blog/models.py` with:

```python
from django.db import models


class Category(models.Model):
    name_en = models.CharField(max_length=100)
    name_ar = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)

    class Meta:
        verbose_name_plural = "categories"

    def __str__(self):
        return self.name_en
```

- [ ] **Step 4: Register in admin**

Replace `backend/blog/admin.py` with:

```python
from django.contrib import admin

from .models import Category


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name_en", "name_ar", "slug")
    search_fields = ("name_en", "name_ar", "slug")
```

- [ ] **Step 5: Generate and apply migration**

Run:
```bash
cd backend
python manage.py makemigrations blog
python manage.py migrate
cd ..
```
Expected: `Migrations for 'blog': blog/migrations/0001_initial.py`, then `Applying blog.0001_initial... OK`.

- [ ] **Step 6: Run test to verify it passes**

Run:
```bash
cd backend
python manage.py test blog
cd ..
```
Expected: `Ran 2 tests ... OK`.

- [ ] **Step 7: Commit**

```bash
git add backend/blog
git commit -m "Add Category model with admin registration"
```

---

### Task 3: BlogPost model + admin

**Files:**
- Modify: `backend/blog/models.py`
- Modify: `backend/blog/admin.py`
- Create: `backend/blog/migrations/0002_blogpost.py` (via `makemigrations`)
- Modify: `backend/blog/tests/test_models.py`

**Interfaces:**
- Consumes: `blog.models.Category` (Task 2).
- Produces: `blog.models.BlogPost` with fields `title_en`, `title_ar` (str), `slug` (str, unique), `category` (FK to Category), `excerpt_en`, `excerpt_ar` (str), `body_en`, `body_ar` (str), `author` (str, default `"Dr. Karim Eltaher"`), `cover_image_url` (str, optional), `read_time_minutes` (int), `published_at` (datetime, optional), `is_published` (bool, default `False`), `created_at`, `updated_at` (auto datetimes). `BlogPost.__str__()` returns `title_en`.

- [ ] **Step 1: Write the failing test**

Append to `backend/blog/tests/test_models.py`:

```python
from blog.models import BlogPost


class BlogPostModelTests(TestCase):
    def setUp(self):
        self.category = Category.objects.create(
            name_en="Clinical Nutrition", name_ar="تغذية إكلينيكية", slug="clinical-nutrition"
        )

    def test_str_returns_title_en(self):
        post = BlogPost.objects.create(
            title_en="Protein Timing",
            title_ar="توقيت البروتين",
            slug="protein-timing",
            category=self.category,
            excerpt_en="excerpt",
            excerpt_ar="ملخص",
            body_en="body",
            body_ar="نص",
            read_time_minutes=6,
        )
        self.assertEqual(str(post), "Protein Timing")

    def test_defaults(self):
        post = BlogPost.objects.create(
            title_en="Protein Timing 2",
            title_ar="توقيت البروتين ٢",
            slug="protein-timing-2",
            category=self.category,
            excerpt_en="excerpt",
            excerpt_ar="ملخص",
            body_en="body",
            body_ar="نص",
            read_time_minutes=6,
        )
        self.assertEqual(post.author, "Dr. Karim Eltaher")
        self.assertFalse(post.is_published)
        self.assertIsNone(post.published_at)
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
cd backend
python manage.py test blog
cd ..
```
Expected: FAIL/ERROR — `ImportError: cannot import name 'BlogPost' from 'blog.models'`.

- [ ] **Step 3: Implement the model**

Append to `backend/blog/models.py`:

```python
class BlogPost(models.Model):
    title_en = models.CharField(max_length=200)
    title_ar = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name="posts")
    excerpt_en = models.TextField()
    excerpt_ar = models.TextField()
    body_en = models.TextField()
    body_ar = models.TextField()
    author = models.CharField(max_length=120, default="Dr. Karim Eltaher")
    cover_image_url = models.URLField(blank=True)
    read_time_minutes = models.PositiveIntegerField()
    published_at = models.DateTimeField(null=True, blank=True)
    is_published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-published_at"]

    def __str__(self):
        return self.title_en
```

- [ ] **Step 4: Register in admin**

Replace `backend/blog/admin.py` with:

```python
from django.contrib import admin

from .models import BlogPost, Category


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name_en", "name_ar", "slug")
    search_fields = ("name_en", "name_ar", "slug")


@admin.register(BlogPost)
class BlogPostAdmin(admin.ModelAdmin):
    list_display = ("title_en", "category", "is_published", "published_at")
    list_filter = ("category", "is_published")
    search_fields = ("title_en", "title_ar", "excerpt_en", "excerpt_ar")
```

- [ ] **Step 5: Generate and apply migration**

Run:
```bash
cd backend
python manage.py makemigrations blog
python manage.py migrate
cd ..
```
Expected: `Migrations for 'blog': blog/migrations/0002_blogpost.py`, then `Applying blog.0002_blogpost... OK`.

- [ ] **Step 6: Run test to verify it passes**

Run:
```bash
cd backend
python manage.py test blog
cd ..
```
Expected: `Ran 4 tests ... OK`.

- [ ] **Step 7: Commit**

```bash
git add backend/blog
git commit -m "Add BlogPost model with admin registration"
```

---

### Task 4: Categories API endpoint

**Files:**
- Create: `backend/blog/serializers.py`
- Modify: `backend/blog/views.py`
- Create: `backend/blog/urls.py`
- Modify: `backend/config/urls.py`
- Create: `backend/blog/tests/test_api.py`

**Interfaces:**
- Consumes: `blog.models.Category` (Task 2).
- Produces: `GET /api/categories/` returning a JSON list of `{id, name_en, name_ar, slug}`. `blog.serializers.CategorySerializer` (DRF `ModelSerializer`) usable by later tasks.

- [ ] **Step 1: Write the failing test**

Create `backend/blog/tests/test_api.py`:

```python
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
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
cd backend
python manage.py test blog
cd ..
```
Expected: FAIL — `404` because `/api/categories/` doesn't exist yet (or `ModuleNotFoundError` for `blog.serializers`).

- [ ] **Step 3: Implement the serializer**

Create `backend/blog/serializers.py`:

```python
from rest_framework import serializers

from .models import Category


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name_en", "name_ar", "slug"]
```

- [ ] **Step 4: Implement the view**

Replace `backend/blog/views.py` with:

```python
from rest_framework import generics

from .models import Category
from .serializers import CategorySerializer


class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.all().order_by("name_en")
    serializer_class = CategorySerializer
```

- [ ] **Step 5: Wire up URLs**

Create `backend/blog/urls.py`:

```python
from django.urls import path

from .views import CategoryListView

urlpatterns = [
    path("categories/", CategoryListView.as_view(), name="category-list"),
]
```

Edit `backend/config/urls.py` to match:

```python
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("blog.urls")),
]
```

- [ ] **Step 6: Run test to verify it passes**

Run:
```bash
cd backend
python manage.py test blog
cd ..
```
Expected: `Ran 5 tests ... OK`.

- [ ] **Step 7: Commit**

```bash
git add backend/blog backend/config/urls.py
git commit -m "Add categories list API endpoint"
```

---

### Task 5: Blog posts list API (filter + search)

**Files:**
- Modify: `backend/blog/serializers.py`
- Modify: `backend/blog/views.py`
- Modify: `backend/blog/urls.py`
- Modify: `backend/blog/tests/test_api.py`

**Interfaces:**
- Consumes: `blog.models.BlogPost` (Task 3), `blog.serializers.CategorySerializer` (Task 4).
- Produces: `GET /api/posts/` returning paginated published posts. Supports `?category=<slug>` and `?q=<text>`. `blog.serializers.BlogPostListSerializer` reused by Task 6.

- [ ] **Step 1: Write the failing test**

Append to `backend/blog/tests/test_api.py`:

```python
from django.utils import timezone

from blog.models import BlogPost


class BlogPostListAPITests(APITestCase):
    def setUp(self):
        self.cat_weight = Category.objects.create(name_en="Weight", name_ar="وزن", slug="weight")
        self.cat_myths = Category.objects.create(name_en="Myths", name_ar="خرافات", slug="myths")
        self.published_weight = BlogPost.objects.create(
            title_en="Crash Diets Fail", title_ar="فشل الحميات", slug="crash-diets-fail",
            category=self.cat_weight, excerpt_en="excerpt", excerpt_ar="ملخص",
            body_en="body", body_ar="نص", read_time_minutes=7,
            is_published=True, published_at=timezone.now(),
        )
        self.published_myth = BlogPost.objects.create(
            title_en="Detox Tea Myth", title_ar="خرافة شاي الديتوكس", slug="detox-tea-myth",
            category=self.cat_myths, excerpt_en="excerpt", excerpt_ar="ملخص",
            body_en="body", body_ar="نص", read_time_minutes=5,
            is_published=True, published_at=timezone.now(),
        )
        self.draft = BlogPost.objects.create(
            title_en="Unpublished Draft", title_ar="مسودة", slug="unpublished-draft",
            category=self.cat_weight, excerpt_en="excerpt", excerpt_ar="ملخص",
            body_en="body", body_ar="نص", read_time_minutes=4,
            is_published=False,
        )

    def test_list_only_returns_published(self):
        response = self.client.get("/api/posts/")
        slugs = [p["slug"] for p in response.data["results"]]
        self.assertIn("crash-diets-fail", slugs)
        self.assertIn("detox-tea-myth", slugs)
        self.assertNotIn("unpublished-draft", slugs)

    def test_filter_by_category(self):
        response = self.client.get("/api/posts/?category=myths")
        slugs = [p["slug"] for p in response.data["results"]]
        self.assertEqual(slugs, ["detox-tea-myth"])

    def test_search_by_query(self):
        response = self.client.get("/api/posts/?q=detox")
        slugs = [p["slug"] for p in response.data["results"]]
        self.assertEqual(slugs, ["detox-tea-myth"])
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
cd backend
python manage.py test blog
cd ..
```
Expected: FAIL — `404 Not Found` for `/api/posts/`.

- [ ] **Step 3: Implement the serializer**

Append to `backend/blog/serializers.py`:

```python
from .models import BlogPost


class BlogPostListSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)

    class Meta:
        model = BlogPost
        fields = [
            "id", "title_en", "title_ar", "slug", "category",
            "excerpt_en", "excerpt_ar", "author", "cover_image_url",
            "read_time_minutes", "published_at",
        ]
```

- [ ] **Step 4: Implement the view**

Append to `backend/blog/views.py`:

```python
from django.db.models import Q

from .models import BlogPost
from .serializers import BlogPostListSerializer


class BlogPostListView(generics.ListAPIView):
    serializer_class = BlogPostListSerializer

    def get_queryset(self):
        queryset = BlogPost.objects.filter(is_published=True).select_related("category")

        category_slug = self.request.query_params.get("category")
        if category_slug:
            queryset = queryset.filter(category__slug=category_slug)

        q = self.request.query_params.get("q")
        if q:
            queryset = queryset.filter(
                Q(title_en__icontains=q)
                | Q(title_ar__icontains=q)
                | Q(excerpt_en__icontains=q)
                | Q(excerpt_ar__icontains=q)
            )

        return queryset.order_by("-published_at")
```

- [ ] **Step 5: Wire up URLs**

Replace `backend/blog/urls.py` with:

```python
from django.urls import path

from .views import BlogPostListView, CategoryListView

urlpatterns = [
    path("categories/", CategoryListView.as_view(), name="category-list"),
    path("posts/", BlogPostListView.as_view(), name="post-list"),
]
```

- [ ] **Step 6: Run test to verify it passes**

Run:
```bash
cd backend
python manage.py test blog
cd ..
```
Expected: `Ran 8 tests ... OK`.

- [ ] **Step 7: Commit**

```bash
git add backend/blog
git commit -m "Add blog posts list API with category filter and search"
```

---

### Task 6: Blog post detail API with related posts

**Files:**
- Modify: `backend/blog/serializers.py`
- Modify: `backend/blog/views.py`
- Modify: `backend/blog/urls.py`
- Modify: `backend/blog/tests/test_api.py`

**Interfaces:**
- Consumes: `blog.serializers.BlogPostListSerializer` (Task 5).
- Produces: `GET /api/posts/<slug>/` returning full post detail plus `related` (up to 3 same-category published posts, excluding self).

- [ ] **Step 1: Write the failing test**

Append to `backend/blog/tests/test_api.py`:

```python
class BlogPostDetailAPITests(APITestCase):
    def setUp(self):
        self.category = Category.objects.create(name_en="Weight", name_ar="وزن", slug="weight")
        self.other_category = Category.objects.create(name_en="Myths", name_ar="خرافات", slug="myths")
        self.main = BlogPost.objects.create(
            title_en="Main Post", title_ar="المقال الرئيسي", slug="main-post",
            category=self.category, excerpt_en="excerpt", excerpt_ar="ملخص",
            body_en="full body", body_ar="نص كامل", read_time_minutes=6,
            is_published=True, published_at=timezone.now(),
        )
        self.related_posts = [
            BlogPost.objects.create(
                title_en=f"Related {i}", title_ar=f"ذو صلة {i}", slug=f"related-{i}",
                category=self.category, excerpt_en="e", excerpt_ar="م",
                body_en="b", body_ar="ن", read_time_minutes=5,
                is_published=True, published_at=timezone.now(),
            )
            for i in range(4)
        ]
        self.other_category_post = BlogPost.objects.create(
            title_en="Other Category", title_ar="فئة أخرى", slug="other-category",
            category=self.other_category, excerpt_en="e", excerpt_ar="م",
            body_en="b", body_ar="ن", read_time_minutes=5,
            is_published=True, published_at=timezone.now(),
        )

    def test_detail_includes_body_and_related(self):
        response = self.client.get("/api/posts/main-post/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["body_en"], "full body")
        related_slugs = [r["slug"] for r in response.data["related"]]
        self.assertEqual(len(related_slugs), 3)
        self.assertNotIn("main-post", related_slugs)
        self.assertNotIn("other-category", related_slugs)
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
cd backend
python manage.py test blog
cd ..
```
Expected: FAIL — `404 Not Found` for `/api/posts/main-post/`.

- [ ] **Step 3: Implement the serializer**

Append to `backend/blog/serializers.py`:

```python
class BlogPostDetailSerializer(BlogPostListSerializer):
    related = serializers.SerializerMethodField()

    class Meta(BlogPostListSerializer.Meta):
        fields = BlogPostListSerializer.Meta.fields + ["body_en", "body_ar", "related"]

    def get_related(self, obj):
        related_qs = (
            BlogPost.objects.filter(category=obj.category, is_published=True)
            .exclude(pk=obj.pk)
            .order_by("-published_at")[:3]
        )
        return BlogPostListSerializer(related_qs, many=True).data
```

- [ ] **Step 4: Implement the view**

Append to `backend/blog/views.py`:

```python
from .serializers import BlogPostDetailSerializer


class BlogPostDetailView(generics.RetrieveAPIView):
    queryset = BlogPost.objects.filter(is_published=True).select_related("category")
    serializer_class = BlogPostDetailSerializer
    lookup_field = "slug"
```

- [ ] **Step 5: Wire up URLs**

Replace `backend/blog/urls.py` with:

```python
from django.urls import path

from .views import BlogPostDetailView, BlogPostListView, CategoryListView

urlpatterns = [
    path("categories/", CategoryListView.as_view(), name="category-list"),
    path("posts/", BlogPostListView.as_view(), name="post-list"),
    path("posts/<slug:slug>/", BlogPostDetailView.as_view(), name="post-detail"),
]
```

- [ ] **Step 6: Run test to verify it passes**

Run:
```bash
cd backend
python manage.py test blog
cd ..
```
Expected: `Ran 9 tests ... OK`.

- [ ] **Step 7: Commit**

```bash
git add backend/blog
git commit -m "Add blog post detail API with related posts"
```

---

### Task 7: ContactSubmission model + admin + API

**Files:**
- Modify: `backend/leads/models.py`
- Modify: `backend/leads/admin.py`
- Create: `backend/leads/serializers.py`
- Modify: `backend/leads/views.py`
- Create: `backend/leads/urls.py`
- Modify: `backend/config/urls.py`
- Create: `backend/leads/migrations/0001_initial.py` (via `makemigrations`)
- Create: `backend/leads/tests/__init__.py`, `backend/leads/tests/test_api.py`

**Interfaces:**
- Produces: `leads.models.ContactSubmission` with fields `name`, `email`, `phone` (optional), `subject` (choices: general/consult/media/partnership, default general), `message`, `created_at`, `is_read` (default `False`). `POST /api/contact/` creates one; requires `name`, `email`, `message`.

- [ ] **Step 1: Write the failing test**

Create `backend/leads/tests/__init__.py` (empty file).

Create `backend/leads/tests/test_api.py`:

```python
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
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
cd backend
python manage.py test leads
cd ..
```
Expected: FAIL/ERROR — `ImportError: cannot import name 'ContactSubmission' from 'leads.models'`.

- [ ] **Step 3: Implement the model**

Replace `backend/leads/models.py` with:

```python
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
```

- [ ] **Step 4: Register in admin**

Replace `backend/leads/admin.py` with:

```python
from django.contrib import admin

from .models import ContactSubmission


@admin.register(ContactSubmission)
class ContactSubmissionAdmin(admin.ModelAdmin):
    list_display = ("name", "email", "subject", "created_at", "is_read")
    list_filter = ("subject", "is_read")
    search_fields = ("name", "email", "message")
    readonly_fields = ("created_at",)
```

- [ ] **Step 5: Implement the serializer**

Create `backend/leads/serializers.py`:

```python
from rest_framework import serializers

from .models import ContactSubmission


class ContactSubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactSubmission
        fields = ["name", "email", "phone", "subject", "message"]
```

- [ ] **Step 6: Implement the view**

Replace `backend/leads/views.py` with:

```python
from rest_framework import generics

from .models import ContactSubmission
from .serializers import ContactSubmissionSerializer


class ContactSubmissionCreateView(generics.CreateAPIView):
    queryset = ContactSubmission.objects.all()
    serializer_class = ContactSubmissionSerializer
```

- [ ] **Step 7: Wire up URLs**

Create `backend/leads/urls.py`:

```python
from django.urls import path

from .views import ContactSubmissionCreateView

urlpatterns = [
    path("contact/", ContactSubmissionCreateView.as_view(), name="contact-create"),
]
```

Replace `backend/config/urls.py` with:

```python
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("blog.urls")),
    path("api/", include("leads.urls")),
]
```

- [ ] **Step 8: Generate and apply migration**

Run:
```bash
cd backend
python manage.py makemigrations leads
python manage.py migrate
cd ..
```
Expected: `Migrations for 'leads': leads/migrations/0001_initial.py`, then `Applying leads.0001_initial... OK`.

- [ ] **Step 9: Run test to verify it passes**

Run:
```bash
cd backend
python manage.py test leads
cd ..
```
Expected: `Ran 3 tests ... OK`.

- [ ] **Step 10: Commit**

```bash
git add backend/leads backend/config/urls.py
git commit -m "Add ContactSubmission model, admin, and create API"
```

---

### Task 8: PlanRequest model + admin + API

**Files:**
- Modify: `backend/leads/models.py`
- Modify: `backend/leads/admin.py`
- Modify: `backend/leads/serializers.py`
- Modify: `backend/leads/views.py`
- Modify: `backend/leads/urls.py`
- Create: `backend/leads/migrations/0002_planrequest.py` (via `makemigrations`)
- Modify: `backend/leads/tests/test_api.py`

**Interfaces:**
- Produces: `leads.models.PlanRequest` with fields `name`, `email`, `phone` (optional), `plan` (choices: basic/pro/premium, required), `message` (optional), `created_at`, `status` (choices: new/contacted/closed, default `new`). `POST /api/plan-requests/` creates one; requires `name`, `email`, `plan`.

- [ ] **Step 1: Write the failing test**

Append to `backend/leads/tests/test_api.py`:

```python
from leads.models import PlanRequest


class PlanRequestAPITests(APITestCase):
    def test_create_with_valid_data(self):
        response = self.client.post("/api/plan-requests/", {
            "name": "Omar",
            "email": "omar@example.com",
            "phone": "+966500000001",
            "plan": "pro",
            "message": "Interested in the Pro plan.",
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(PlanRequest.objects.count(), 1)
        request = PlanRequest.objects.first()
        self.assertEqual(request.plan, "pro")
        self.assertEqual(request.status, "new")

    def test_create_without_plan_fails(self):
        response = self.client.post("/api/plan-requests/", {
            "name": "Omar",
            "email": "omar@example.com",
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(PlanRequest.objects.count(), 0)
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
cd backend
python manage.py test leads
cd ..
```
Expected: FAIL/ERROR — `ImportError: cannot import name 'PlanRequest' from 'leads.models'`.

- [ ] **Step 3: Implement the model**

Append to `backend/leads/models.py`:

```python
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
```

- [ ] **Step 4: Register in admin**

Append to `backend/leads/admin.py`:

```python
from .models import PlanRequest


@admin.register(PlanRequest)
class PlanRequestAdmin(admin.ModelAdmin):
    list_display = ("name", "email", "plan", "status", "created_at")
    list_filter = ("plan", "status")
    search_fields = ("name", "email", "message")
    readonly_fields = ("created_at",)
```

- [ ] **Step 5: Implement the serializer**

Append to `backend/leads/serializers.py`:

```python
from .models import PlanRequest


class PlanRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlanRequest
        fields = ["name", "email", "phone", "plan", "message"]
```

- [ ] **Step 6: Implement the view**

Append to `backend/leads/views.py`:

```python
from .models import PlanRequest
from .serializers import PlanRequestSerializer


class PlanRequestCreateView(generics.CreateAPIView):
    queryset = PlanRequest.objects.all()
    serializer_class = PlanRequestSerializer
```

- [ ] **Step 7: Wire up URLs**

Replace `backend/leads/urls.py` with:

```python
from django.urls import path

from .views import ContactSubmissionCreateView, PlanRequestCreateView

urlpatterns = [
    path("contact/", ContactSubmissionCreateView.as_view(), name="contact-create"),
    path("plan-requests/", PlanRequestCreateView.as_view(), name="plan-request-create"),
]
```

- [ ] **Step 8: Generate and apply migration**

Run:
```bash
cd backend
python manage.py makemigrations leads
python manage.py migrate
cd ..
```
Expected: `Migrations for 'leads': leads/migrations/0002_planrequest.py`, then `Applying leads.0002_planrequest... OK`.

- [ ] **Step 9: Run test to verify it passes**

Run:
```bash
cd backend
python manage.py test leads
cd ..
```
Expected: `Ran 5 tests ... OK`.

- [ ] **Step 10: Commit**

```bash
git add backend/leads
git commit -m "Add PlanRequest model, admin, and create API"
```

---

### Task 9: CORS verification, superuser setup docs, and README

**Files:**
- Create: `backend/leads/tests/test_cors.py`
- Create: `backend/README.md`

**Interfaces:**
- Consumes: full API surface from Tasks 4–8.
- Produces: a verified, documented backend — no new production code.

- [ ] **Step 1: Write the failing test**

Create `backend/leads/tests/test_cors.py`:

```python
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
```

- [ ] **Step 2: Run test to verify it fails or passes**

Run:
```bash
cd backend
python manage.py test leads.tests.test_cors
cd ..
```
Expected: `Ran 1 test ... OK` — CORS was already configured in Task 1, so this should pass immediately and confirms the full request pipeline (CORS middleware + blog app + leads app) works end-to-end. If it fails, re-check `MIDDLEWARE` order and `CORS_ALLOWED_ORIGINS` from Task 1 Steps 5–6.

- [ ] **Step 3: Run the full test suite**

Run:
```bash
cd backend
python manage.py test
cd ..
```
Expected: `Ran 16 tests ... OK` — zero failures. (1 from `config`, 9 from `blog`, 6 from `leads`, across Tasks 1–9.)

- [ ] **Step 4: Write `backend/README.md`**

```markdown
# NutriDoc Backend

Django + Django REST Framework backend for the NutriDoc blog and lead-capture forms.

## Local setup

\`\`\`bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
cd backend
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
\`\`\`

Admin panel: http://localhost:8000/admin/

## API

- `GET /api/categories/`
- `GET /api/posts/` — supports `?category=<slug>` and `?q=<text>`
- `GET /api/posts/<slug>/`
- `POST /api/contact/`
- `POST /api/plan-requests/`

## Tests

\`\`\`bash
cd backend
python manage.py test
\`\`\`
```

- [ ] **Step 5: Commit**

```bash
git add backend/leads/tests/test_cors.py backend/README.md
git commit -m "Verify CORS end-to-end and document backend setup"
```
