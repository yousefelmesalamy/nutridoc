# Admin dashboard activity charts — design

## Goal

Add three time-series charts to the custom Django admin dashboard (`NutriDocAdminSite.index`, rendered by `templates/admin/index.html`):

1. Blog posts created over time
2. Contact submissions over time
3. Plan requests over time

Each chart lets the admin switch the displayed range via chip-style buttons: `7D / 30D / 90D / 12M`, with no page reload or extra network request.

## Data

For each of the three models (`BlogPost`, `ContactSubmission`, `PlanRequest`), `NutriDocAdminSite.index` computes two zero-filled series keyed off `created_at`:

- **Daily**: one count per day for the last 90 days (90 points)
- **Monthly**: one count per month for the last 12 months (12 points)

Counts are produced with `TruncDate`/`TruncMonth` + `annotate(Count(...))`, then merged into a zero-filled list in Python so days/months with no rows still appear as `0` (avoids gaps in the chart).

Each series is a list of `{"label": "<ISO date or YYYY-MM>", "value": <int>}` dicts, added to `extra_context` as three keys: `posts_chart`, `contacts_chart`, `plan_requests_chart` — each holding `{"daily": [...], "monthly": [...]}`.

## Template / rendering

In `templates/admin/index.html`, add a new row of 3 panels (reusing the existing `.nd-panel` look) below the "Recent" row. Each panel contains:

- A chip group (`7D`, `30D`, `90D`, `12M`) — plain buttons, one marked active by default (`30D`)
- A `<canvas>` for a Chart.js line chart
- The chart's full data embedded via Django's `{{ x|json_script:"id" }}` (auto-escaped, no manual `|safe`)

## Client-side behavior

New file `static/admin/js/dashboard-charts.js`:

- On load, reads the three embedded JSON blobs, initializes 3 Chart.js line charts (using the `30D` slice of the daily series as the initial dataset)
- Chart.js is loaded from `cdn.jsdelivr.net/npm/chart.js` (no existing bundling for it; Jazzmin doesn't ship it)
- Clicking a chip:
  - `7D`/`30D`/`90D` → slice the last N entries of the `daily` array and update the chart in place (`chart.data.labels`, `chart.data.datasets[0].data`, `chart.update()`)
  - `12M` → swap to the `monthly` array entirely
  - Toggles the `active` class on the clicked chip within its group

## Styling

Extend `static/admin/css/dashboard.css` with `.nd-chip-group` / `.nd-chip` / `.nd-chip.active` styles consistent with the existing `.nd-badge` palette (muted default, green/primary when active).

## Out of scope

- No new admin/API endpoints — everything is computed once per dashboard page load.
- No persistence of the admin's chosen range (resets to `30D` on reload).
