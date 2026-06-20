# NutriDoc Angular Port — Design

## Context

`project/` contains a Claude Design handoff bundle: 7 pages (Home, About, Services,
Subscription, Contact, Blog, BlogPost) plus shared Nav/Footer, built as `.dc.html`
prototypes using a custom React-like runtime (`{{ expr }}` interpolation, `<sc-for>`,
`<sc-if>`, `<dc-import>`, and a `class Component extends DCLogic { renderVals() }`
logic block per file). All content is bilingual (EN/AR) with RTL layout flips driven
by a `lang` prop, and a `<dc-import>` graph wires Nav/Footer into every page.

`backend/` is an existing Django project with REST endpoints already built and ready
to serve this site:
- `GET /api/categories/` — blog categories (`name_en`, `name_ar`, `slug`)
- `GET /api/posts/?category=&q=` — published posts, filterable by category slug and
  free-text search across title/excerpt (en+ar)
- `GET /api/posts/:slug/` — post detail, includes `body_en`/`body_ar` (CKEditor HTML)
  and up to 3 `related` posts from the same category
- `POST /api/contact/` — `{name, email, phone, subject, message}`
- `POST /api/plan-requests/` — `{name, email, phone, plan, message}`

The prototype's Blog/BlogPost pages currently use 6 hardcoded mock posts and the
Contact/Subscription forms don't submit anywhere — this port wires all of that to
the real backend instead of replicating the mocks.

Goal: build a new Angular app that recreates these 7 pages pixel-for-pixel (visual
output, not prototype internals), wired to the real Django API.

## Architecture

A new `frontend/` Angular 19 app (standalone components, signals, `@if`/`@for`
control flow — no NgModules) talking to the Django REST API over HTTP via
`HttpClient`. `backend/` and `project/` are untouched; `project/` remains as the
visual reference until the port is verified, then can be removed in a follow-up.

Routing (`provideRouter`):
- `/` → Home
- `/about` → About
- `/services` → Services
- `/subscription` → Subscription
- `/contact` → Contact
- `/blog` → Blog (list, category filter, search, pagination)
- `/blog/:slug` → BlogPost (detail, related posts)

`environment.ts` / `environment.development.ts` hold `apiBaseUrl` (dev:
`http://localhost:8000/api`). Django's `corsheaders` middleware (already installed)
will need the Angular dev origin added to `CORS_ALLOWED_ORIGINS` — a one-line
backend settings change, not a schema/API change.

## Structure

```
frontend/src/app/
  core/
    lang.service.ts       // signal<'en'|'ar'>, toggle(), persists localStorage('nutridoc-lang'), sets document.dir
    blog.service.ts       // categories(), posts(filters), post(slug) — HttpClient wrappers over /api
    leads.service.ts      // submitContact(payload), submitPlanRequest(payload)
  shared/
    nav/                  // ported from NutriDocNav.dc.html — standalone component
    footer/                // ported from NutriDocFooter.dc.html
    models/                // Category, BlogPost, BlogPostDetail, ContactPayload, PlanRequestPayload interfaces
  pages/
    home/, about/, services/, subscription/, contact/, blog/, blog-post/
```

Each page is one standalone component (`.ts`/`.html`/`.scss`) with no further
decomposition unless a section is reused across pages (only Nav/Footer qualify).

## i18n

`LangService` is the single source of truth: a signal holding `'en' | 'ar'`,
initialized from `localStorage('nutridoc-lang')` (default `'en'`), toggled by the nav
language button, with an effect that sets `document.documentElement.dir` /
`lang` attributes on change.

Each page component derives its own bilingual copy as a `computed()` keyed off
`langService.lang()`, mirroring the prototype's `renderVals()` branching — content is
page-specific prose, not a reusable UI string table, so there is no global
translation-key dictionary.

## Styling

Per-component SCSS reproducing the prototype's exact values (colors, spacing, the
three font families — `Plus Jakarta Sans` / `Tajawal` / `Newsreader` — and the green
palette). A shared `frontend/src/styles/_tokens.scss` holds repeated values (colors,
breakpoints: 1024px / 860px / 640px matching the prototype's media queries).

Static layout lives in SCSS. Genuinely dynamic styling (nav background/shadow on
scroll, hover-driven colors via `:hover` where SCSS suffices, RTL-dependent
left/right flips) uses `[style.x]` / `[class.x]` bindings driven by signals.

## Backend integration

**Blog** (`pages/blog`): calls `blog.service.ts` → `GET /api/categories/` and
`GET /api/posts/?category=&q=`. Category filter buttons and the search box both
re-trigger the list query; pagination is client-side over the fetched page (no
backend pagination params currently exposed, so this fetches the filtered set and
paginates 6-per-page client-side, matching the prototype's page size).

**BlogPost** (`pages/blog-post`): route param `:slug` → `GET /api/posts/:slug/`.
Renders `body_en`/`body_ar` (CKEditor HTML) via Angular's `[innerHTML]` (relies on
Angular's built-in sanitizer — no `bypassSecurityTrustHtml`, since this is
editor-authored content under our own control but still passes through sanitization
for defense in depth). Related posts come from the `related` field already returned
by the detail endpoint.

**Contact** (`pages/contact`): Reactive form (name, email, phone, subject select,
message) with validators matching the prototype (name/email required, email format,
message required) → `leads.service.submitContact()` → `POST /api/contact/`. Shows
sent/error state inline, matching the prototype's UX.

**Subscription** (`pages/subscription`): 3-step reactive form (plan select →
personal/body stats → medical history/agree), validators matching the prototype
(step 1: name/email/phone/age required, email format, age ≥ 18; step 2:
height/currentWeight/targetWeight required; step 3: agree checkbox required).
`name`, `email`, `phone`, `plan` map directly onto `PlanRequestPayload`; the
remaining fields (age, gender, height, currentWeight, targetWeight, goal, activity,
medical, allergies, medications) are formatted into a readable text block and sent
as `message` — no backend schema change. On success, shows the WhatsApp deep-link
CTA (`https://wa.me/966549930730?text=...`) as in the prototype.

**About / Services / Home**: fully static bilingual content, ported as-is from the
prototype's hardcoded `renderVals()` text — no API calls.

## Out of scope

- No Django model/schema/admin changes
- No authentication
- No deployment/CI config
- Removing `project/` (left as reference until the port is verified)
