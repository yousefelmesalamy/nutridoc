# Jazzmin admin theme + custom dashboard

## Goal

Restyle the Django admin with `django-jazzmin` using a green/teal nutrition-brand theme, and add a custom admin homepage dashboard showing key stats and recent activity across the `blog` and `leads` apps.

## Architecture

Use Django's documented mechanism for replacing the default admin site (`AdminConfig.default_site`) instead of monkeypatching, so existing `@admin.register(...)` calls in `blog/admin.py` and `leads/admin.py` keep working unchanged.

### Components

- **`requirements.txt`** — add `django-jazzmin`.
- **`config/admin_site.py`** — `NutriDocAdminSite(admin.AdminSite)`, overrides `index()` to compute and inject dashboard stats/recent-activity into `extra_context`.
- **`config/admin.py`** — `NutriDocAdminConfig(AdminConfig)` with `default_site = "config.admin_site.NutriDocAdminSite"`.
- **`config/settings.py`**:
  - Add `'jazzmin'` to `INSTALLED_APPS`, placed immediately before the admin app entry (Jazzmin requirement).
  - Replace `'django.contrib.admin'` with `'config.admin.NutriDocAdminConfig'`.
  - Add `TEMPLATES[0]['DIRS'] = [BASE_DIR / 'templates']`.
  - Add `JAZZMIN_SETTINGS` and `JAZZMIN_UI_TWEAKS` dicts.
- **`templates/admin/index.html`** — extends Jazzmin's overridden `admin/index.html`, injects dashboard cards + recent-activity tables above the default app list.

### Data flow

`NutriDocAdminSite.index()` runs on every `/admin/` GET:
1. Calls `super().index()` to get the base context (app list, etc.) — actually overrides by accepting `extra_context`, building a dict, and passing to `super().index(request, extra_context)`.
2. Queries:
   - `BlogPost.objects.count()`, `BlogPost.objects.filter(is_published=True).count()`
   - `ContactSubmission.objects.filter(is_read=False).count()`
   - `PlanRequest.objects.filter(status="new").count()`
   - `BlogPost.objects.order_by("-created_at")[:5]`
   - `PlanRequest.objects.order_by("-created_at")[:5]`
   - `ContactSubmission.objects.order_by("-created_at")[:5]`
3. Adds these under keys: `dashboard_stats` (list of `{label, value, icon}` dicts) and `dashboard_recent` (dict of the three querysets).

### Theming

`JAZZMIN_SETTINGS`:
- `site_title`: "NutriDoc Admin"
- `site_header` / `site_brand`: "NutriDoc"
- `welcome_sign`: "Welcome to the NutriDoc Admin"
- `icons` mapped per model (`blog.BlogPost`, `blog.Category`, `leads.ContactSubmission`, `leads.PlanRequest`) using FontAwesome icons (book, tags, envelope, clipboard-list).
- `show_sidebar`: true, `navigation_expanded`: true, `search_model`: blog posts.

`JAZZMIN_UI_TWEAKS`:
- `theme`: a Bootswatch theme with a green palette (`"flatly"` base overridden with green navbar/sidebar via `navbar`, `sidebar`, `accent` keys set to `navbar-success` / `sidebar-dark-success` / `accent-success`).
- `brand_colour`: `navbar-success`
- No dark-mode toggle.

### Dashboard template

`templates/admin/index.html`:
```
{% extends "admin/index.html" %}
{% block content %}
  <!-- AdminLTE small-box stat cards, one per dashboard_stats entry -->
  <!-- Three recent-activity tables: Recent Posts, Recent Plan Requests, Recent Contact Submissions -->
  {{ block.super }}
{% endblock %}
```
Cards use AdminLTE's `small-box` component (already available via Jazzmin's AdminLTE base) so no extra CSS/JS dependency is introduced.

## Testing

- `manage.py test` must still pass unchanged (no model/migration changes).
- Manual check: `runserver` + `curl http://localhost:8000/admin/` (after login) renders without template errors; stat numbers match DB fixture counts.
- Confirm `blog/admin.py` and `leads/admin.py` need zero changes — registrations still work against the swapped default site.

## Out of scope

- No new models, migrations, or API changes.
- No charts/graphs (deferred per design discussion — stats + recent items only).
- No changes to `blog/admin.py` / `leads/admin.py` list_display/filters beyond what's already there.
