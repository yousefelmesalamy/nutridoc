# NutriDoc Django Backend — Design

## Context

NutriDoc is being rebuilt from a Claude Design HTML/CSS/JS prototype (`project/*.dc.html`) into a real product. The full project is split into three independently-deliverable sub-projects:

1. **Django backend** (this spec) — blog content storage + admin + REST API, plus contact/plan-request lead capture.
2. Angular frontend — multi-page bilingual (EN/AR) site consuming this API. Built after this backend exists, per user preference, so it has real data to call instead of mocks.
3. Deployment — Angular → Vercel, Django → Railway (with managed Postgres).

This document covers only sub-project 1.

## Goals

- Let Dr. Karim manage blog posts (write, edit, publish/unpublish) through Django admin, no code changes required.
- Serve blog content to the frontend via a JSON API, bilingual (English/Arabic) per field.
- Capture leads from the site's Contact form and Subscription/plan-request form into the database, visible in the same admin.

## Non-goals

- Building the Angular frontend (separate sub-project).
- Image hosting/CDN — cover images are a plain URL field for now.
- Email notifications on form submission.
- Authentication/rate-limiting beyond Django's defaults (no public user accounts; admin is staff-only).
- Payments — plan requests are leads only, no checkout/billing.

## Stack

- Django + Django REST Framework.
- SQLite for local development; Postgres (Railway-managed) in production.
- `django-cors-headers` to allow the Angular app's origin to call the API.
- Django's built-in admin site at `/admin/` — no custom admin UI.

## Data models

### Category
- `name_en` (CharField)
- `name_ar` (CharField)
- `slug` (SlugField, unique)

Admin-manageable so new topics (e.g. "Sports Nutrition") can be added without a deploy. Replaces the prototype's hardcoded category list.

### BlogPost
- `title_en`, `title_ar` (CharField)
- `slug` (SlugField, unique)
- `category` (ForeignKey → Category)
- `excerpt_en`, `excerpt_ar` (TextField) — short summary shown on cards
- `body_en`, `body_ar` (TextField, Markdown-formatted) — full article content. A single Markdown body per language, not the prototype's rigid lede/h2a/p1/quote/h3a/bullets field-per-section structure, since that layout was hand-built for one demo article and won't generalize to posts Dr. Karim writes himself.
- `author` (CharField, default "Dr. Karim Eltaher") — editable in case of guest authors later
- `cover_image_url` (URLField, optional)
- `read_time_minutes` (PositiveIntegerField) — rendered as "X min read" / "X دقائق" by the frontend
- `published_at` (DateTimeField, optional/null until published)
- `is_published` (BooleanField, default False) — draft/publish toggle
- `created_at`, `updated_at` (auto timestamps)

### ContactSubmission
- `name`, `email`, `phone` (CharField, phone optional)
- `subject` (CharField, choices: general / consult / media / partnership)
- `message` (TextField)
- `created_at` (auto timestamp)
- `is_read` (BooleanField, default False)

### PlanRequest
- `name`, `email`, `phone` (CharField, phone optional)
- `plan` (CharField, choices: basic / pro / premium)
- `message` (TextField, optional)
- `created_at` (auto timestamp)
- `status` (CharField, choices: new / contacted / closed; default new)

## API surface

All under `/api/`:

- `GET /api/categories/` — list categories
- `GET /api/posts/` — list published posts, paginated; supports `?category=<slug>` and `?q=<search>` (matches title/excerpt in both languages)
- `GET /api/posts/<slug>/` — single post detail, includes up to 3 related posts (same category, excluding itself)
- `POST /api/contact/` — create a ContactSubmission (validates required fields: name, email, message)
- `POST /api/plan-requests/` — create a PlanRequest (validates required fields: name, email, plan)

Read endpoints are public/unauthenticated. Write endpoints are public POST (no auth required to submit a lead, matching the current site's open contact form) but only return a success/failure response — no submission data is read back via the API.

## Admin

All four models registered in Django admin:

- **Category**: list view shows name_en, name_ar, slug.
- **BlogPost**: list view shows title_en, category, is_published, published_at; filterable by category and is_published; searchable by title/excerpt (both languages).
- **ContactSubmission**: list view shows name, email, subject, created_at, is_read; filterable by subject and is_read; read-only created_at.
- **PlanRequest**: list view shows name, email, plan, status, created_at; filterable by plan and status; read-only created_at.

Dr. Karim authenticates as a Django superuser to access `/admin/`.

## Testing approach

- Model tests: field defaults, `is_published`/`published_at` behavior.
- API tests: each endpoint returns expected shape/status; filtering and search on `/api/posts/`; validation errors on the two POST endpoints (e.g. missing email).
- Admin: smoke-tested manually (registered models are visible and editable) rather than automated, consistent with typical Django admin testing practice.
