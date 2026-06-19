# Jazzmin Admin Theme + Custom Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the NutriDoc Django admin with `django-jazzmin` in a green/teal theme, and add a custom admin homepage dashboard showing post/lead stats and recent activity.

**Architecture:** Swap the default admin site via Django's documented `AdminConfig.default_site` mechanism (a custom `NutriDocAdminSite` subclassing `admin.AdminSite`), so existing `@admin.register(...)` calls in `blog/admin.py` and `leads/admin.py` need zero changes. Jazzmin is added as a separate `INSTALLED_APPS` entry that restyles the admin templates; a custom `templates/admin/index.html` extends Jazzmin's index template to add dashboard cards and recent-activity lists.

**Tech Stack:** Django 5.2, django-jazzmin, SQLite (existing `db.sqlite3`), Django's built-in test client/TestCase.

## Global Constraints

- Python/Django version floor: `Django>=5.0,<6.0` (from `backend/requirements.txt`) — pick a `django-jazzmin` version that supports Django 5.x.
- All work happens inside `backend/` (the Django project root containing `manage.py`).
- No changes to `blog/admin.py` or `leads/admin.py` model registrations — they must keep working unmodified against the swapped default site.
- No new models or migrations.
- No charts/graphs — dashboard shows stat cards + recent-activity lists only.
- Theme: green/teal (Bootstrap "success" palette), light mode, no dark-mode toggle.

---

### Task 1: Add Jazzmin dependency and verify baseline admin still works

**Files:**
- Modify: `backend/requirements.txt`
- Modify: `backend/config/settings.py:33-44` (`INSTALLED_APPS`)
- Test: `backend/config/tests.py` (existing `AdminSmokeTest`, no new test needed — used as the regression check)

**Interfaces:**
- Produces: working venv at `backend/.venv` (or repo-root `.venv` per README) with `jazzmin` installed and importable; `INSTALLED_APPS` containing `'jazzmin'` immediately before the admin entry.

- [ ] **Step 1: Create/activate a venv and install current requirements**

```bash
cd /Users/yosefel-mesalamy/business-only/nutridoc-website-design/.worktrees/django-blog-backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
```

Expected: install succeeds, no errors.

- [ ] **Step 2: Run the existing test suite to confirm a clean baseline**

```bash
cd backend
python manage.py test
```

Expected: all tests PASS (this is the pre-change baseline — note the count of tests passing).

- [ ] **Step 3: Add `django-jazzmin` to requirements and install it**

Edit `backend/requirements.txt`:

```
Django>=5.0,<6.0
djangorestframework>=3.15,<4.0
django-cors-headers>=4.3,<5.0
django-jazzmin>=3.0,<4.0
```

```bash
pip install -r backend/requirements.txt
```

Expected: `django-jazzmin` installs without dependency conflicts.

- [ ] **Step 4: Add `jazzmin` to `INSTALLED_APPS`, before the admin app**

In `backend/config/settings.py`, replace:

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

with:

```python
INSTALLED_APPS = [
    'jazzmin',
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

- [ ] **Step 5: Run `manage.py check` and the test suite again**

```bash
python manage.py check
python manage.py test
```

Expected: `check` reports no issues; all tests from Step 2 still PASS (same count, including `AdminSmokeTest.test_admin_login_page_loads`).

- [ ] **Step 6: Commit**

```bash
git add backend/requirements.txt backend/config/settings.py
git commit -m "Add django-jazzmin dependency"
```

---

### Task 2: Configure Jazzmin theme (green/teal branding)

**Files:**
- Modify: `backend/config/settings.py` (append `JAZZMIN_SETTINGS` and `JAZZMIN_UI_TWEAKS` after `REST_FRAMEWORK`)
- Test: `backend/config/tests.py` (add `JazzminThemeTest`)

**Interfaces:**
- Consumes: nothing new from Task 1 beyond the installed `jazzmin` app.
- Produces: `JAZZMIN_SETTINGS` and `JAZZMIN_UI_TWEAKS` dicts in `config.settings`, used implicitly by Jazzmin's template tags when rendering any admin page.

- [ ] **Step 1: Write the failing test**

Append to `backend/config/tests.py`:

```python
from django.conf import settings


class JazzminThemeTest(TestCase):
    def test_jazzmin_settings_configured(self):
        self.assertEqual(settings.JAZZMIN_SETTINGS["site_brand"], "NutriDoc")
        self.assertEqual(settings.JAZZMIN_UI_TWEAKS["accent"], "accent-success")

    def test_admin_login_page_uses_jazzmin_branding(self):
        response = self.client.get('/admin/login/')
        self.assertContains(response, "NutriDoc")
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
python manage.py test config.tests.JazzminThemeTest -v 2
```

Expected: FAIL — `AttributeError: 'Settings' object has no attribute 'JAZZMIN_SETTINGS'`.

- [ ] **Step 3: Add the Jazzmin settings**

Append to the end of `backend/config/settings.py`:

```python
JAZZMIN_SETTINGS = {
    "site_title": "NutriDoc Admin",
    "site_header": "NutriDoc",
    "site_brand": "NutriDoc",
    "welcome_sign": "Welcome to the NutriDoc Admin",
    "copyright": "NutriDoc",
    "search_model": ["blog.BlogPost"],
    "show_sidebar": True,
    "navigation_expanded": True,
    "icons": {
        "auth.User": "fas fa-user",
        "auth.Group": "fas fa-users",
        "blog.BlogPost": "fas fa-book",
        "blog.Category": "fas fa-tags",
        "leads.ContactSubmission": "fas fa-envelope",
        "leads.PlanRequest": "fas fa-clipboard-list",
    },
}

JAZZMIN_UI_TWEAKS = {
    "theme": "flatly",
    "dark_mode_theme": None,
    "navbar": "navbar-success navbar-dark",
    "sidebar": "sidebar-dark-success",
    "accent": "accent-success",
    "brand_colour": "navbar-success",
    "button_classes": {
        "primary": "btn-success",
        "secondary": "btn-secondary",
        "info": "btn-info",
        "warning": "btn-warning",
        "danger": "btn-danger",
        "success": "btn-success",
    },
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
python manage.py test config.tests.JazzminThemeTest -v 2
```

Expected: PASS (both tests).

- [ ] **Step 5: Run the full suite to confirm no regression**

```bash
python manage.py test
```

Expected: all tests PASS.

- [ ] **Step 6: Commit**

```bash
git add backend/config/settings.py backend/config/tests.py
git commit -m "Configure Jazzmin green theme and branding"
```

---

### Task 3: Custom admin site with dashboard stats context

**Files:**
- Create: `backend/config/admin_site.py`
- Create: `backend/config/admin.py`
- Modify: `backend/config/settings.py` (`INSTALLED_APPS`)
- Test: `backend/config/tests.py` (add `AdminDashboardContextTest`)

**Interfaces:**
- Consumes: `blog.models.BlogPost`, `leads.models.ContactSubmission`, `leads.models.PlanRequest` (existing models, fields per `backend/blog/models.py` and `backend/leads/models.py`).
- Produces: `config.admin_site.NutriDocAdminSite` — an `AdminSite` subclass whose `index()` response context includes:
  - `dashboard_stats`: `list[dict]`, each `{"label": str, "value": int, "icon": str}`, in this fixed order: Total Posts, Published Posts, Unread Contacts, New Plan Requests.
  - `dashboard_recent`: `dict` with keys `"posts"`, `"plan_requests"`, `"contacts"`, each a queryset of the 5 most recently created objects (`order_by("-created_at")[:5]`).
- `config.admin.NutriDocAdminConfig` — `AdminConfig` subclass with `default_site = "config.admin_site.NutriDocAdminSite"`, used as the `INSTALLED_APPS` entry replacing `'django.contrib.admin'`.

- [ ] **Step 1: Write the failing test**

Append to `backend/config/tests.py`:

```python
from django.contrib.auth import get_user_model

from blog.models import BlogPost, Category
from leads.models import ContactSubmission, PlanRequest


class AdminDashboardContextTest(TestCase):
    def setUp(self):
        User = get_user_model()
        self.admin_user = User.objects.create_superuser(
            username="admin", email="admin@example.com", password="password123"
        )
        self.client.force_login(self.admin_user)

        category = Category.objects.create(name_en="Diet", name_ar="حمية", slug="diet")
        BlogPost.objects.create(
            title_en="Published Post", title_ar="منشور", slug="published-post",
            category=category, excerpt_en="x", excerpt_ar="x", body_en="x", body_ar="x",
            read_time_minutes=3, is_published=True,
        )
        BlogPost.objects.create(
            title_en="Draft Post", title_ar="مسودة", slug="draft-post",
            category=category, excerpt_en="x", excerpt_ar="x", body_en="x", body_ar="x",
            read_time_minutes=3, is_published=False,
        )
        ContactSubmission.objects.create(name="Jane", email="jane@example.com", message="hi", is_read=False)
        ContactSubmission.objects.create(name="Joe", email="joe@example.com", message="hi", is_read=True)
        PlanRequest.objects.create(name="Sam", email="sam@example.com", plan="pro", status="new")
        PlanRequest.objects.create(name="Lee", email="lee@example.com", plan="basic", status="closed")

    def test_dashboard_stats_in_context(self):
        response = self.client.get("/admin/")
        stats = {s["label"]: s["value"] for s in response.context["dashboard_stats"]}
        self.assertEqual(stats["Total Posts"], 2)
        self.assertEqual(stats["Published Posts"], 1)
        self.assertEqual(stats["Unread Contacts"], 1)
        self.assertEqual(stats["New Plan Requests"], 1)

    def test_dashboard_recent_in_context(self):
        response = self.client.get("/admin/")
        recent = response.context["dashboard_recent"]
        self.assertEqual(list(recent["posts"]), list(BlogPost.objects.order_by("-created_at")[:5]))
        self.assertEqual(list(recent["plan_requests"]), list(PlanRequest.objects.order_by("-created_at")[:5]))
        self.assertEqual(list(recent["contacts"]), list(ContactSubmission.objects.order_by("-created_at")[:5]))
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
python manage.py test config.tests.AdminDashboardContextTest -v 2
```

Expected: FAIL — `KeyError: 'dashboard_stats'` (the default admin index has no such context key).

- [ ] **Step 3: Create `backend/config/admin_site.py`**

```python
from django.contrib import admin

from blog.models import BlogPost
from leads.models import ContactSubmission, PlanRequest


class NutriDocAdminSite(admin.AdminSite):
    def index(self, request, extra_context=None):
        extra_context = extra_context or {}
        extra_context["dashboard_stats"] = [
            {
                "label": "Total Posts",
                "value": BlogPost.objects.count(),
                "icon": "fas fa-book",
            },
            {
                "label": "Published Posts",
                "value": BlogPost.objects.filter(is_published=True).count(),
                "icon": "fas fa-check-circle",
            },
            {
                "label": "Unread Contacts",
                "value": ContactSubmission.objects.filter(is_read=False).count(),
                "icon": "fas fa-envelope",
            },
            {
                "label": "New Plan Requests",
                "value": PlanRequest.objects.filter(status="new").count(),
                "icon": "fas fa-clipboard-list",
            },
        ]
        extra_context["dashboard_recent"] = {
            "posts": BlogPost.objects.order_by("-created_at")[:5],
            "plan_requests": PlanRequest.objects.order_by("-created_at")[:5],
            "contacts": ContactSubmission.objects.order_by("-created_at")[:5],
        }
        return super().index(request, extra_context)
```

- [ ] **Step 4: Create `backend/config/admin.py`**

```python
from django.contrib.admin.apps import AdminConfig


class NutriDocAdminConfig(AdminConfig):
    default_site = "config.admin_site.NutriDocAdminSite"
```

- [ ] **Step 5: Swap the admin app in `INSTALLED_APPS`**

In `backend/config/settings.py`, replace `'django.contrib.admin'` with `'config.admin.NutriDocAdminConfig'`:

```python
INSTALLED_APPS = [
    'jazzmin',
    'config.admin.NutriDocAdminConfig',
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

- [ ] **Step 6: Run the test to verify it passes**

```bash
python manage.py test config.tests.AdminDashboardContextTest -v 2
```

Expected: PASS (both tests).

- [ ] **Step 7: Run the full suite to confirm no regression**

```bash
python manage.py test
```

Expected: all tests PASS, including `blog/admin.py` and `leads/admin.py` registrations still functioning (covered indirectly by `AdminSmokeTest` and Django's app-loading check).

- [ ] **Step 8: Commit**

```bash
git add backend/config/admin.py backend/config/admin_site.py backend/config/settings.py backend/config/tests.py
git commit -m "Add custom admin site with dashboard stats context"
```

---

### Task 4: Dashboard template (stat cards + recent-activity lists)

**Files:**
- Create: `backend/templates/admin/index.html`
- Modify: `backend/config/settings.py` (`TEMPLATES[0]['DIRS']`)
- Test: `backend/config/tests.py` (add `AdminDashboardTemplateTest`)

**Interfaces:**
- Consumes: `dashboard_stats` and `dashboard_recent` context keys produced by `NutriDocAdminSite.index()` (Task 3). Uses `BlogPost.title_en`, `PlanRequest.name`/`get_plan_display`, `ContactSubmission.name`/`get_subject_display` (all existing model fields/methods — see `backend/blog/models.py:17` and `backend/leads/models.py`).
- Produces: rendered HTML for `/admin/` containing stat card labels/values and recent-item titles, consumed only by the browser (no other task depends on this template's internals).

- [ ] **Step 1: Write the failing test**

Append to `backend/config/tests.py`:

```python
class AdminDashboardTemplateTest(TestCase):
    def setUp(self):
        User = get_user_model()
        self.admin_user = User.objects.create_superuser(
            username="admin2", email="admin2@example.com", password="password123"
        )
        self.client.force_login(self.admin_user)
        category = Category.objects.create(name_en="Hydration", name_ar="ترطيب", slug="hydration")
        BlogPost.objects.create(
            title_en="Stay Hydrated", title_ar="ترطيب", slug="stay-hydrated",
            category=category, excerpt_en="x", excerpt_ar="x", body_en="x", body_ar="x",
            read_time_minutes=2, is_published=True,
        )

    def test_dashboard_renders_stat_cards_and_recent_post(self):
        response = self.client.get("/admin/")
        self.assertContains(response, "Total Posts")
        self.assertContains(response, "Published Posts")
        self.assertContains(response, "Unread Contacts")
        self.assertContains(response, "New Plan Requests")
        self.assertContains(response, "Stay Hydrated")
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
python manage.py test config.tests.AdminDashboardTemplateTest -v 2
```

Expected: FAIL — response body does not contain "Total Posts" (no custom template yet, Jazzmin's stock index doesn't render these labels).

- [ ] **Step 3: Point `TEMPLATES` at a project-level templates directory**

In `backend/config/settings.py`, update the `TEMPLATES` setting's `DIRS`:

```python
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]
```

- [ ] **Step 4: Create `backend/templates/admin/index.html`**

```html
{% extends "admin/index.html" %}

{% block content %}
<div class="row">
  {% for stat in dashboard_stats %}
  <div class="col-lg-3 col-6">
    <div class="small-box bg-success">
      <div class="inner">
        <h3>{{ stat.value }}</h3>
        <p>{{ stat.label }}</p>
      </div>
      <div class="icon">
        <i class="{{ stat.icon }}"></i>
      </div>
    </div>
  </div>
  {% endfor %}
</div>

<div class="row">
  <div class="col-md-4">
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Recent Posts</h3>
      </div>
      <div class="card-body p-0">
        <ul class="list-group list-group-flush">
          {% for post in dashboard_recent.posts %}
          <li class="list-group-item">{{ post.title_en }}</li>
          {% empty %}
          <li class="list-group-item text-muted">No posts yet</li>
          {% endfor %}
        </ul>
      </div>
    </div>
  </div>
  <div class="col-md-4">
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Recent Plan Requests</h3>
      </div>
      <div class="card-body p-0">
        <ul class="list-group list-group-flush">
          {% for plan_request in dashboard_recent.plan_requests %}
          <li class="list-group-item">{{ plan_request.name }} &mdash; {{ plan_request.get_plan_display }}</li>
          {% empty %}
          <li class="list-group-item text-muted">No plan requests yet</li>
          {% endfor %}
        </ul>
      </div>
    </div>
  </div>
  <div class="col-md-4">
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Recent Contact Submissions</h3>
      </div>
      <div class="card-body p-0">
        <ul class="list-group list-group-flush">
          {% for contact in dashboard_recent.contacts %}
          <li class="list-group-item">{{ contact.name }} &mdash; {{ contact.get_subject_display }}</li>
          {% empty %}
          <li class="list-group-item text-muted">No contact submissions yet</li>
          {% endfor %}
        </ul>
      </div>
    </div>
  </div>
</div>

{{ block.super }}
{% endblock %}
```

- [ ] **Step 5: Run the test to verify it passes**

```bash
python manage.py test config.tests.AdminDashboardTemplateTest -v 2
```

Expected: PASS.

- [ ] **Step 6: Run the full test suite**

```bash
python manage.py test
```

Expected: all tests PASS (this includes every test from Tasks 1-4).

- [ ] **Step 7: Manual smoke test in the browser**

```bash
python manage.py runserver
```

Visit `http://localhost:8000/admin/`, log in with the superuser created via `python manage.py createsuperuser` (or reuse a test user if one was left in the dev DB), and confirm:
- Sidebar/navbar render in green (Jazzmin "success" accent).
- Stat cards show real counts matching the DB.
- Recent Posts / Plan Requests / Contact Submissions lists show real rows (or "No ... yet" if empty).
- Existing model admin pages (`/admin/blog/blogpost/`, `/admin/leads/contactsubmission/`, etc.) still load and list/filter/search as before.

- [ ] **Step 8: Commit**

```bash
git add backend/config/settings.py backend/config/tests.py backend/templates/admin/index.html
git commit -m "Add admin dashboard template with stat cards and recent activity"
```

---

## Self-Review Notes

- **Spec coverage:** Jazzmin dependency/theming → Tasks 1-2. Custom `AdminSite`/`AdminConfig` swap → Task 3. Dashboard stats (4 cards) and recent activity (3 lists of 5) → Tasks 3-4. No charts, no model/migration changes, no `blog/admin.py`/`leads/admin.py` edits — confirmed absent from all tasks, matching the spec's "Out of scope" section.
- **Type consistency:** `dashboard_stats` is consistently a `list[dict]` with `label`/`value`/`icon` keys across Task 3 (producer) and Task 4 (template consumer). `dashboard_recent` keys (`posts`, `plan_requests`, `contacts`) match between Task 3 and the template's `dashboard_recent.posts` / `.plan_requests` / `.contacts` references in Task 4.
- **No placeholders:** every step has complete, runnable code or exact commands with expected output.
