# Admin Dashboard Activity Charts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add three time-series line charts (posts, contacts, plan requests) to the Django admin dashboard, each switchable between 7D/30D/90D/12M ranges entirely client-side.

**Architecture:** `NutriDocAdminSite.index` (`config/admin_site.py`) computes zero-filled daily (90 pts) and monthly (12 pts) count series per model and adds them to `extra_context`. `templates/admin/index.html` embeds these as `json_script` blobs and renders 3 chart panels with chip controls. `static/admin/js/dashboard-charts.js` (loaded via Jazzmin's `custom_js` setting, after Chart.js from CDN) reads the JSON and renders/updates 3 Chart.js line charts on chip click — no network requests after page load.

**Tech Stack:** Django 5.2 (`django.db.models.functions.TruncDate`, `TruncMonth`), Jazzmin admin theme, Chart.js (CDN, no npm/build step in this repo), vanilla JS.

## Global Constraints

- No new admin/API endpoints — all three series are computed once per dashboard page load (per spec "Out of scope").
- Chip-selected range is not persisted across reloads; always resets to `30D` (per spec).
- Days/months with zero rows must appear as `0`, not be skipped (per spec "Data").
- Use `json_script` for embedding chart data into the template — never `|safe` (per spec "Template / rendering").

---

### Task 1: Backend — zero-filled time series helper + context

**Files:**
- Modify: `backend/config/admin_site.py`
- Test: `backend/blog/tests/test_models.py` (extend `AdminDashboardContextTest`)

**Interfaces:**
- Produces: a module-level function `_activity_series(queryset, date_field="created_at")` in `config/admin_site.py` returning `{"daily": [{"label": "2026-05-24", "value": 3}, ...], "monthly": [{"label": "2025-07", "value": 12}, ...]}`. `daily` always has exactly 90 entries (oldest first, ending today), `monthly` always has exactly 12 entries (oldest first, ending with the current month).
- Consumes: nothing new — only Django ORM (`TruncDate`, `TruncMonth`, `Count`) and the existing `BlogPost`, `ContactSubmission`, `PlanRequest` imports already in that file.
- `extra_context["posts_chart"]`, `extra_context["contacts_chart"]`, `extra_context["plan_requests_chart"]` each hold the dict returned by `_activity_series(...)` for the respective model's full (unfiltered) queryset.

- [ ] **Step 1: Write the failing test**

Add to `backend/blog/tests/test_models.py`, inside `AdminDashboardContextTest` (it already has `setUp` creating 2 posts, 2 contacts, 2 plan requests):

```python
    def test_dashboard_chart_series_in_context(self):
        response = self.client.get("/admin/")
        for key in ("posts_chart", "contacts_chart", "plan_requests_chart"):
            chart = response.context[key]
            self.assertIn("daily", chart)
            self.assertIn("monthly", chart)
            self.assertEqual(len(chart["daily"]), 90)
            self.assertEqual(len(chart["monthly"]), 12)
            # every entry created in setUp() happened today
            self.assertEqual(chart["daily"][-1]["value"], 2)
            self.assertEqual(chart["monthly"][-1]["value"], 2)
            # labels are zero-filled, oldest first
            self.assertTrue(chart["daily"][0]["label"] < chart["daily"][-1]["label"])
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && .venv/bin/python manage.py test blog.tests.test_models.AdminDashboardContextTest.test_dashboard_chart_series_in_context -v 2`
Expected: FAIL with `KeyError: 'posts_chart'` (context key doesn't exist yet)

- [ ] **Step 3: Write minimal implementation**

Replace the full contents of `backend/config/admin_site.py` with:

```python
from datetime import date, timedelta

from django.contrib import admin
from django.db.models import Count
from django.db.models.functions import TruncDate, TruncMonth

from blog.models import BlogPost
from leads.models import ContactSubmission, PlanRequest

DAILY_WINDOW_DAYS = 90
MONTHLY_WINDOW_MONTHS = 12


def _activity_series(queryset, date_field="created_at"):
    today = date.today()

    daily_start = today - timedelta(days=DAILY_WINDOW_DAYS - 1)
    daily_counts = dict(
        queryset.filter(**{f"{date_field}__date__gte": daily_start})
        .annotate(day=TruncDate(date_field))
        .values("day")
        .annotate(count=Count("id"))
        .values_list("day", "count")
    )
    daily = []
    for offset in range(DAILY_WINDOW_DAYS):
        day = daily_start + timedelta(days=offset)
        daily.append({"label": day.isoformat(), "value": daily_counts.get(day, 0)})

    month_keys = []
    year, month = today.year, today.month
    for _ in range(MONTHLY_WINDOW_MONTHS):
        month_keys.append((year, month))
        month -= 1
        if month == 0:
            month = 12
            year -= 1
    month_keys.reverse()
    monthly_start = date(month_keys[0][0], month_keys[0][1], 1)

    monthly_counts = dict(
        queryset.filter(**{f"{date_field}__date__gte": monthly_start})
        .annotate(month=TruncMonth(date_field))
        .values("month")
        .annotate(count=Count("id"))
        .values_list("month", "count")
    )
    monthly_counts = {(d.year, d.month): c for d, c in monthly_counts.items()}
    monthly = [
        {"label": f"{y:04d}-{m:02d}", "value": monthly_counts.get((y, m), 0)}
        for (y, m) in month_keys
    ]

    return {"daily": daily, "monthly": monthly}


class NutriDocAdminSite(admin.AdminSite):
    def index(self, request, extra_context=None):
        extra_context = extra_context or {}
        unread_contacts = ContactSubmission.objects.filter(is_read=False).count()
        new_plan_requests = PlanRequest.objects.filter(status="new").count()
        extra_context["dashboard_stats"] = [
            {
                "label": "Total Posts",
                "value": BlogPost.objects.count(),
                "icon": "fas fa-book",
                "color": "primary",
                "url": "admin:blog_blogpost_changelist",
            },
            {
                "label": "Published Posts",
                "value": BlogPost.objects.filter(is_published=True).count(),
                "icon": "fas fa-check-circle",
                "color": "success",
                "url": "admin:blog_blogpost_changelist",
            },
            {
                "label": "Unread Contacts",
                "value": unread_contacts,
                "icon": "fas fa-envelope",
                "color": "danger" if unread_contacts else "secondary",
                "url": "admin:leads_contactsubmission_changelist",
            },
            {
                "label": "New Plan Requests",
                "value": new_plan_requests,
                "icon": "fas fa-clipboard-list",
                "color": "warning" if new_plan_requests else "secondary",
                "url": "admin:leads_planrequest_changelist",
            },
        ]
        extra_context["dashboard_recent"] = {
            "posts": BlogPost.objects.order_by("-created_at")[:5],
            "plan_requests": PlanRequest.objects.order_by("-created_at")[:5],
            "contacts": ContactSubmission.objects.order_by("-created_at")[:5],
        }
        extra_context["posts_chart"] = _activity_series(BlogPost.objects.all())
        extra_context["contacts_chart"] = _activity_series(ContactSubmission.objects.all())
        extra_context["plan_requests_chart"] = _activity_series(PlanRequest.objects.all())
        return super().index(request, extra_context)
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && .venv/bin/python manage.py test blog.tests.test_models.AdminDashboardContextTest -v 2`
Expected: all tests in `AdminDashboardContextTest` PASS (4 tests including the new one)

- [ ] **Step 5: Commit**

```bash
cd backend && git add config/admin_site.py blog/tests/test_models.py
git commit -m "Add zero-filled activity series to admin dashboard context"
```

---

### Task 2: Template — chart panels + embedded JSON

**Files:**
- Modify: `backend/templates/admin/index.html`
- Test: `backend/blog/tests/test_models.py` (extend `AdminDashboardTemplateTest`)

**Interfaces:**
- Consumes: `posts_chart`, `contacts_chart`, `plan_requests_chart` context keys produced in Task 1 (each `{"daily": [...], "monthly": [...]}`).
- Produces: three `<canvas id="chart-posts">`, `<canvas id="chart-contacts">`, `<canvas id="chart-plan-requests">` elements, and three `json_script` blobs with ids `posts-chart-data`, `contacts-chart-data`, `plan-requests-chart-data`, plus chip groups with `data-target="chart-posts"` etc. and `data-range="7|30|90|12m"` attributes. Task 3's JS depends on these exact ids and `data-*` attribute names.

- [ ] **Step 1: Write the failing test**

Add to `backend/blog/tests/test_models.py`, inside `AdminDashboardTemplateTest`:

```python
    def test_dashboard_renders_chart_panels(self):
        response = self.client.get("/admin/")
        self.assertContains(response, 'id="chart-posts"')
        self.assertContains(response, 'id="chart-contacts"')
        self.assertContains(response, 'id="chart-plan-requests"')
        self.assertContains(response, 'id="posts-chart-data"')
        self.assertContains(response, 'data-range="7"')
        self.assertContains(response, 'data-range="12m"')
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && .venv/bin/python manage.py test blog.tests.test_models.AdminDashboardTemplateTest.test_dashboard_renders_chart_panels -v 2`
Expected: FAIL — `chart-posts` not found in response content

- [ ] **Step 3: Write minimal implementation**

In `backend/templates/admin/index.html`, insert a new row right before the final `<div class="row">{{ block.super }}</div>` (i.e. after the existing "Recent" row's closing `</div>` on line 121):

```html
<div class="row">
  <div class="col-lg-4 mb-4">
    <div class="nd-panel">
      <div class="nd-panel-header">
        <h3><i class="fas fa-book mr-1 text-muted"></i> {% trans "Posts Over Time" %}</h3>
        <div class="nd-chip-group" data-target="chart-posts">
          <button type="button" class="nd-chip" data-range="7">7D</button>
          <button type="button" class="nd-chip active" data-range="30">30D</button>
          <button type="button" class="nd-chip" data-range="90">90D</button>
          <button type="button" class="nd-chip" data-range="12m">12M</button>
        </div>
      </div>
      <div class="nd-panel-body nd-chart-body">
        <canvas id="chart-posts"></canvas>
      </div>
    </div>
  </div>

  <div class="col-lg-4 mb-4">
    <div class="nd-panel">
      <div class="nd-panel-header">
        <h3><i class="fas fa-envelope mr-1 text-muted"></i> {% trans "Contacts Over Time" %}</h3>
        <div class="nd-chip-group" data-target="chart-contacts">
          <button type="button" class="nd-chip" data-range="7">7D</button>
          <button type="button" class="nd-chip active" data-range="30">30D</button>
          <button type="button" class="nd-chip" data-range="90">90D</button>
          <button type="button" class="nd-chip" data-range="12m">12M</button>
        </div>
      </div>
      <div class="nd-panel-body nd-chart-body">
        <canvas id="chart-contacts"></canvas>
      </div>
    </div>
  </div>

  <div class="col-lg-4 mb-4">
    <div class="nd-panel">
      <div class="nd-panel-header">
        <h3><i class="fas fa-clipboard-list mr-1 text-muted"></i> {% trans "Plan Requests Over Time" %}</h3>
        <div class="nd-chip-group" data-target="chart-plan-requests">
          <button type="button" class="nd-chip" data-range="7">7D</button>
          <button type="button" class="nd-chip active" data-range="30">30D</button>
          <button type="button" class="nd-chip" data-range="90">90D</button>
          <button type="button" class="nd-chip" data-range="12m">12M</button>
        </div>
      </div>
      <div class="nd-panel-body nd-chart-body">
        <canvas id="chart-plan-requests"></canvas>
      </div>
    </div>
  </div>
</div>

{{ posts_chart|json_script:"posts-chart-data" }}
{{ contacts_chart|json_script:"contacts-chart-data" }}
{{ plan_requests_chart|json_script:"plan-requests-chart-data" }}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && .venv/bin/python manage.py test blog.tests.test_models.AdminDashboardTemplateTest -v 2`
Expected: all tests in `AdminDashboardTemplateTest` PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
cd backend && git add templates/admin/index.html blog/tests/test_models.py
git commit -m "Add chart panels and embedded chart data to admin dashboard template"
```

---

### Task 3: Chart.js wiring — CDN script, custom JS, chip switching

**Files:**
- Modify: `backend/config/settings.py` (`JAZZMIN_SETTINGS`)
- Modify: `backend/templates/admin/index.html` (add Chart.js CDN `<script>`)
- Create: `backend/static/admin/js/dashboard-charts.js`
- Test: `backend/blog/tests/test_models.py` (extend `AdminDashboardTemplateTest`)

**Interfaces:**
- Consumes: the `<canvas>` ids and `json_script` ids from Task 2, and the `{"daily": [{"label", "value"}, ...90], "monthly": [...12]}` shape from Task 1.
- Produces: nothing consumed by later tasks (this is the last task).

This task is JS-only behavior plus a static asset reference, so it's tested by asserting the template includes the Chart.js CDN tag and the `dashboard-charts.js` reference (full browser behavior isn't exercised by Django's test client, which doesn't run JS — that's an accepted limitation of this stack, matching how `dashboard.css` itself is untested beyond "is it referenced").

- [ ] **Step 1: Write the failing test**

Add to `backend/blog/tests/test_models.py`, inside `AdminDashboardTemplateTest`:

```python
    def test_dashboard_includes_chartjs_and_custom_script(self):
        response = self.client.get("/admin/")
        self.assertContains(response, "chart.js")
        self.assertContains(response, "dashboard-charts.js")
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && .venv/bin/python manage.py test blog.tests.test_models.AdminDashboardTemplateTest.test_dashboard_includes_chartjs_and_custom_script -v 2`
Expected: FAIL — neither string present in response content

- [ ] **Step 3: Write minimal implementation**

In `backend/config/settings.py`, add `custom_js` next to the existing `custom_css` key (around line 219):

```python
    "custom_css": "admin/css/dashboard.css",
    "custom_js": "admin/js/dashboard-charts.js",
```

In `backend/templates/admin/index.html`, add a `block extrahead` near the top (right after the `{% load i18n %}` line) to pull in Chart.js before Jazzmin's `custom_js` runs:

```html
{% block extrahead %}
  {{ block.super }}
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js"></script>
{% endblock %}
```

Create `backend/static/admin/js/dashboard-charts.js`:

```js
(function () {
  function readSeries(elementId) {
    var el = document.getElementById(elementId);
    if (!el) return null;
    return JSON.parse(el.textContent);
  }

  var CHARTS = [
    { canvasId: "chart-posts", dataId: "posts-chart-data" },
    { canvasId: "chart-contacts", dataId: "contacts-chart-data" },
    { canvasId: "chart-plan-requests", dataId: "plan-requests-chart-data" },
  ];

  function sliceDaily(daily, rangeDays) {
    return daily.slice(daily.length - rangeDays);
  }

  function applyRange(state, range) {
    var series = range === "12m" ? state.series.monthly : sliceDaily(state.series.daily, parseInt(range, 10));
    state.chart.data.labels = series.map(function (point) { return point.label; });
    state.chart.data.datasets[0].data = series.map(function (point) { return point.value; });
    state.chart.update();
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (typeof Chart === "undefined") return;

    CHARTS.forEach(function (config) {
      var canvas = document.getElementById(config.canvasId);
      var series = readSeries(config.dataId);
      if (!canvas || !series) return;

      var initial = sliceDaily(series.daily, 30);
      var chart = new Chart(canvas, {
        type: "line",
        data: {
          labels: initial.map(function (point) { return point.label; }),
          datasets: [{
            data: initial.map(function (point) { return point.value; }),
            borderColor: "#2e8b57",
            backgroundColor: "rgba(46, 139, 87, 0.1)",
            tension: 0.3,
            fill: true,
            pointRadius: 0,
          }],
        },
        options: {
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
        },
      });

      var state = { chart: chart, series: series };
      var chipGroup = document.querySelector('.nd-chip-group[data-target="' + config.canvasId + '"]');
      if (!chipGroup) return;

      chipGroup.querySelectorAll(".nd-chip").forEach(function (chip) {
        chip.addEventListener("click", function () {
          chipGroup.querySelectorAll(".nd-chip").forEach(function (c) { c.classList.remove("active"); });
          chip.classList.add("active");
          applyRange(state, chip.getAttribute("data-range"));
        });
      });
    });
  });
})();
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && .venv/bin/python manage.py test blog.tests.test_models.AdminDashboardTemplateTest -v 2`
Expected: all tests in `AdminDashboardTemplateTest` PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
cd backend && git add config/settings.py templates/admin/index.html static/admin/js/dashboard-charts.js blog/tests/test_models.py
git commit -m "Wire up Chart.js and chip-based range switching on admin dashboard"
```

---

### Task 4: Chip and chart panel styling

**Files:**
- Modify: `backend/static/admin/css/dashboard.css`

**Interfaces:**
- Consumes: `.nd-chip-group`, `.nd-chip`, `.nd-chip.active`, `.nd-chart-body` class names used in Task 2's template markup.
- Produces: nothing consumed by later tasks (this is the last task).

This task is pure CSS with no testable backend/template behavior (the classes already render fine unstyled per Task 2's passing tests) — verify visually instead of via an automated test.

- [ ] **Step 1: Add styles**

Append to `backend/static/admin/css/dashboard.css`:

```css
.nd-chip-group {
  display: flex;
  gap: .35rem;
}

.nd-chip {
  border: 1px solid #e9edf0;
  background: #f8fafa;
  color: #6c7a78;
  font-size: .72rem;
  font-weight: 700;
  letter-spacing: .02em;
  padding: .2rem .55rem;
  border-radius: 1rem;
  cursor: pointer;
  transition: background .15s ease, color .15s ease, border-color .15s ease;
}

.nd-chip:hover {
  background: #eef1f3;
}

.nd-chip.active {
  background: #2e8b57;
  border-color: #2e8b57;
  color: #fff;
}

.nd-chart-body {
  padding: 1rem 1.1rem;
  height: 220px;
  position: relative;
}

.nd-chart-body canvas {
  width: 100% !important;
  height: 100% !important;
}
```

- [ ] **Step 2: Verify manually**

Run: `cd backend && .venv/bin/python manage.py runserver`, log into `/admin/` as a superuser, confirm the three chart panels render with chips, the `30D` chip is active by default, and clicking `7D`/`90D`/`12M` updates each chart without a page reload.

- [ ] **Step 3: Commit**

```bash
cd backend && git add static/admin/css/dashboard.css
git commit -m "Style chip controls and chart panels on admin dashboard"
```

---

## Plan Self-Review Notes

- **Spec coverage:** Daily/monthly zero-filled series (Task 1), chip UI + embedded JSON (Task 2), Chart.js CDN + client-side range switching (Task 3), chip/panel styling (Task 4) — all spec sections covered. No new endpoints introduced anywhere (matches "Out of scope").
- **Type consistency:** `_activity_series` return shape (`{"daily": [{"label","value"}], "monthly": [...]}`) is identical across Task 1 (producer), Task 2 (`json_script` ids), and Task 3 (JS consumer `readSeries`/`sliceDaily`). Canvas ids and chip `data-target`/`data-range` attributes match exactly between Task 2's HTML and Task 3's JS selectors.
- **No placeholders:** every step contains complete, runnable code.
