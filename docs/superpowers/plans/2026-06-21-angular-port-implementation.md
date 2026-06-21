# NutriDoc Angular Port Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a new Angular 21 standalone app (`frontend/`) that recreates the 7 pages of the `project/` Claude-Design bundle pixel-for-pixel, wired to the existing Django REST API in `backend/`.

**Architecture:** One standalone Angular app, no NgModules, signals for all state. `LangService` is the single source of truth for `en`/`ar` + RTL. Shared `Nav`/`Footer` components inject `LangService` directly. Each page is one standalone component with its own bilingual content as `computed()` signals and its own SCSS. `BlogService`/`LeadsService` wrap `HttpClient` calls to the Django API. `backend/` and `project/` are untouched.

**Tech Stack:** Angular 21 (CLI confirmed installed: `ng version` → Angular CLI 21.2.9), TypeScript, SCSS, RxJS via `HttpClient`, Karma/Jasmine (default Angular test runner) for unit tests, Django REST Framework backend already running on `http://localhost:8000`.

## Global Constraints

- Standalone components only — no NgModules, no `CommonModule` imports needed (Angular 21 templates use built-in control flow).
- Use `@if` / `@for` template control flow, not `*ngIf` / `*ngFor`.
- Use signals (`signal()`, `computed()`, `effect()`) for all component state — no RxJS `BehaviorSubject` for UI state.
- Bilingual copy (`en`/`ar`) is page-specific prose ported verbatim from the corresponding `project/*.dc.html` file — do not invent new copy.
- `django REST_FRAMEWORK` config in `backend/config/settings.py:164-167` uses `PageNumberPagination` with `PAGE_SIZE: 9` — every list endpoint (`/api/posts/`, `/api/categories/`) returns `{count, next, previous, results}`, NOT a bare array. All services and components must unwrap `.results`.
- `backend/config/settings.py:160-162` already has `CORS_ALLOWED_ORIGINS = ["http://localhost:4200"]` — no backend changes needed for CORS.
- Dev API base URL: `http://localhost:8000/api`.
- Colors/fonts/breakpoints must match the prototype exactly: green palette `#1B5E20` / `#2E7D32` / `#66BB6A` / `#A5D6A7` / `#0F2417` / `#0A1F10`, fonts `'Plus Jakarta Sans'` (body), `'Newsreader'` (serif headings), `'Tajawal'` (Arabic fallback), breakpoints `1024px` / `880px` / `860px` / `640px` / `560px` / `520px` depending on page (see each task).
- All `project/*.dc.html` files are the canonical visual spec — read the relevant file's lines (cited per task) before writing each component's template/SCSS.

---

## Task 1: Scaffold Angular app, environments, global tokens

**Files:**
- Create: `frontend/` (via `ng new`)
- Create: `frontend/src/environments/environment.ts`
- Create: `frontend/src/environments/environment.development.ts`
- Create: `frontend/src/styles/_tokens.scss`
- Modify: `frontend/src/styles.scss`
- Modify: `frontend/angular.json` (file replacements for environments)

**Interfaces:**
- Produces: `environment.apiBaseUrl: string` consumed by every service in Task 2.
- Produces: SCSS variables in `_tokens.scss` (`$nd-green-deepest`, `$nd-green-dark`, `$nd-green`, `$nd-green-light`, `$nd-bg-dark`, `$nd-bg-darkest`, `$nd-cream`, `$nd-text`, `$nd-text-muted`, `$font-body`, `$font-serif`, breakpoint mixins) consumed by every page/shared component SCSS in later tasks.

- [ ] **Step 1: Scaffold the app**

Run from the repo root:

```bash
cd /Users/yosefel-mesalamy/business-only/nutridoc-website-design
ng new frontend --standalone --routing --style=scss --skip-git --ssr=false
```

When prompted, accept defaults (no SSR, no zoneless toggle needed either way — Angular 21 standalone defaults are fine).

- [ ] **Step 2: Verify it builds and serves**

```bash
cd frontend
npm start
```

Expected: dev server starts on `http://localhost:4200` with the default Angular welcome page. Stop it with Ctrl+C.

- [ ] **Step 3: Create environment files**

Create `frontend/src/environments/environment.ts`:

```ts
export const environment = {
  production: true,
  apiBaseUrl: '/api',
};
```

Create `frontend/src/environments/environment.development.ts`:

```ts
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:8000/api',
};
```

- [ ] **Step 4: Wire file replacement for dev builds**

In `frontend/angular.json`, find the `projects.frontend.architect.build.configurations.development` block and add a `fileReplacements` array so `ng serve` (which defaults to the `development` configuration) picks up `environment.development.ts`:

```json
"development": {
  "fileReplacements": [
    {
      "replace": "src/environments/environment.ts",
      "with": "src/environments/environment.development.ts"
    }
  ],
  "optimization": false,
  "extractLicenses": false,
  "sourceMap": true
}
```

(Keep any existing keys already present in that block — only add `fileReplacements`.)

- [ ] **Step 5: Create design tokens**

Create `frontend/src/styles/_tokens.scss`:

```scss
// Greens (from project/*.dc.html)
$nd-green-deepest: #0A1F10;
$nd-green-darkest: #0F2417;
$nd-green-dark:    #1B5E20;
$nd-green:         #2E7D32;
$nd-green-mid:     #66BB6A;
$nd-green-light:   #A5D6A7;

$nd-bg:            #FAFCFA;
$nd-bg-soft:       #F7FAF7;
$nd-white:         #ffffff;

$nd-text:          #0F2417;
$nd-text-soft:     #445249;
$nd-text-muted:    #5C6E61;
$nd-text-faint:    #7A8A7E;

$nd-border:        #E2EBE3;
$nd-border-soft:   #E8F0E9;
$nd-border-green:  #D7E8D9;

$font-body: 'Plus Jakarta Sans', 'Tajawal', sans-serif;
$font-serif: 'Newsreader', serif;

@mixin bp-1024 { @media (max-width: 1024px) { @content; } }
@mixin bp-920  { @media (max-width: 920px)  { @content; } }
@mixin bp-880  { @media (max-width: 880px)  { @content; } }
@mixin bp-860  { @media (max-width: 860px)  { @content; } }
@mixin bp-640  { @media (max-width: 640px)  { @content; } }
@mixin bp-560  { @media (max-width: 560px)  { @content; } }
@mixin bp-520  { @media (max-width: 520px)  { @content; } }
```

- [ ] **Step 6: Set global styles and fonts**

Replace `frontend/src/styles.scss` with:

```scss
@import 'styles/tokens';

* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { margin: 0; padding: 0; scroll-behavior: smooth; }
body { font-family: $font-body; color: $nd-text; background: $nd-bg; }

@keyframes ndOrb1 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(60px,-40px) scale(1.12)} 66%{transform:translate(-30px,50px) scale(.94)} }
@keyframes ndOrb2 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(-50px,30px) scale(1.08)} 66%{transform:translate(40px,-60px) scale(.96)} }
@keyframes ndOrb3 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(20px,30px)} }
@keyframes ndPulse { 0%,100%{opacity:.6} 50%{opacity:1} }

.nd-card-hover {
  transition: transform .25s cubic-bezier(.22,.68,0,1.2), box-shadow .25s, border-color .25s;
  &:hover { transform: translateY(-6px); box-shadow: 0 24px 60px rgba(15,36,23,.14); }
}
```

In `frontend/src/index.html`, inside `<head>`, add the Google Fonts links (ported from every page's `<helmet>`):

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,300;0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,300;1,6..72,400&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Tajawal:wght@400;500;700;800&display=swap" rel="stylesheet">
```

- [ ] **Step 7: Commit**

```bash
git add frontend
git commit -m "Scaffold Angular frontend with environments and design tokens"
```

---

## Task 2: Core services — LangService, models, BlogService, LeadsService

**Files:**
- Create: `frontend/src/app/shared/models/blog.models.ts`
- Create: `frontend/src/app/shared/models/leads.models.ts`
- Create: `frontend/src/app/core/lang.service.ts`
- Create: `frontend/src/app/core/lang.service.spec.ts`
- Create: `frontend/src/app/core/blog.service.ts`
- Create: `frontend/src/app/core/blog.service.spec.ts`
- Create: `frontend/src/app/core/leads.service.ts`
- Create: `frontend/src/app/core/leads.service.spec.ts`
- Modify: `frontend/src/app/app.config.ts` (add `provideHttpClient`)

**Interfaces:**
- Produces: `Category { id, name_en, name_ar, slug }`, `BlogPostSummary { id, title_en, title_ar, slug, category: Category, excerpt_en, excerpt_ar, author, cover_image_url, read_time_minutes, published_at }`, `BlogPostDetail extends BlogPostSummary { body_en, body_ar, related: BlogPostSummary[] }`, `Paginated<T> { count, next: string|null, previous: string|null, results: T[] }`.
- Produces: `ContactPayload { name, email, phone, subject, message }`, `PlanRequestPayload { name, email, phone, plan, message }`.
- Produces: `LangService.lang: Signal<'en'|'ar'>`, `LangService.toggle(): void`.
- Produces: `BlogService.categories(): Observable<Category[]>`, `BlogService.posts(filters: { category?: string; q?: string }): Observable<BlogPostSummary[]>`, `BlogService.post(slug: string): Observable<BlogPostDetail>`.
- Produces: `LeadsService.submitContact(payload: ContactPayload): Observable<ContactPayload>`, `LeadsService.submitPlanRequest(payload: PlanRequestPayload): Observable<PlanRequestPayload>`.
- Consumes: `environment.apiBaseUrl` from Task 1.

- [ ] **Step 1: Write the models**

Create `frontend/src/app/shared/models/blog.models.ts`:

```ts
export interface Category {
  id: number;
  name_en: string;
  name_ar: string;
  slug: string;
}

export interface BlogPostSummary {
  id: number;
  title_en: string;
  title_ar: string;
  slug: string;
  category: Category;
  excerpt_en: string;
  excerpt_ar: string;
  author: string;
  cover_image_url: string;
  read_time_minutes: number;
  published_at: string;
}

export interface BlogPostDetail extends BlogPostSummary {
  body_en: string;
  body_ar: string;
  related: BlogPostSummary[];
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
```

Create `frontend/src/app/shared/models/leads.models.ts`:

```ts
export interface ContactPayload {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

export interface PlanRequestPayload {
  name: string;
  email: string;
  phone: string;
  plan: string;
  message: string;
}
```

- [ ] **Step 2: Write LangService**

Create `frontend/src/app/core/lang.service.ts`:

```ts
import { effect, Injectable, signal } from '@angular/core';

export type Lang = 'en' | 'ar';
const STORAGE_KEY = 'nutridoc-lang';

@Injectable({ providedIn: 'root' })
export class LangService {
  readonly lang = signal<Lang>(this.readInitial());

  constructor() {
    effect(() => {
      const l = this.lang();
      document.documentElement.lang = l;
      document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr';
      try {
        localStorage.setItem(STORAGE_KEY, l);
      } catch {
        /* storage unavailable */
      }
    });
  }

  toggle(): void {
    this.lang.set(this.lang() === 'ar' ? 'en' : 'ar');
  }

  private readInitial(): Lang {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored === 'ar' ? 'ar' : 'en';
    } catch {
      return 'en';
    }
  }
}
```

- [ ] **Step 3: Write LangService test**

Create `frontend/src/app/core/lang.service.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { LangService } from './lang.service';

describe('LangService', () => {
  beforeEach(() => localStorage.clear());

  it('defaults to en', () => {
    const service = TestBed.configureTestingModule({}).inject(LangService);
    expect(service.lang()).toBe('en');
  });

  it('toggle flips between en and ar', () => {
    const service = TestBed.configureTestingModule({}).inject(LangService);
    service.toggle();
    expect(service.lang()).toBe('ar');
    service.toggle();
    expect(service.lang()).toBe('en');
  });

  it('sets document dir to rtl when ar', () => {
    const service = TestBed.configureTestingModule({}).inject(LangService);
    service.toggle();
    expect(document.documentElement.dir).toBe('rtl');
    expect(document.documentElement.lang).toBe('ar');
  });
});
```

- [ ] **Step 4: Run the LangService test**

```bash
cd frontend
npx ng test --watch=false --browsers=ChromeHeadless
```

Expected: 3 passing specs for `LangService` (plus default app spec).

- [ ] **Step 5: Add provideHttpClient to app config**

Read `frontend/src/app/app.config.ts` first, then add `provideHttpClient()` to the `providers` array, importing it from `@angular/common/http`:

```ts
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
  ],
};
```

(Keep whatever `provideZoneChangeDetection` call `ng new` already generated — just add the `provideHttpClient()` line and its import.)

- [ ] **Step 6: Write BlogService**

Create `frontend/src/app/core/blog.service.ts`:

```ts
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../environments/environment';
import { BlogPostDetail, BlogPostSummary, Category, Paginated } from '../shared/models/blog.models';

@Injectable({ providedIn: 'root' })
export class BlogService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  categories(): Observable<Category[]> {
    return this.http
      .get<Paginated<Category>>(`${this.base}/categories/`)
      .pipe(map((res) => res.results));
  }

  posts(filters: { category?: string; q?: string } = {}): Observable<BlogPostSummary[]> {
    let params = new HttpParams();
    if (filters.category && filters.category !== 'all') {
      params = params.set('category', filters.category);
    }
    if (filters.q) {
      params = params.set('q', filters.q);
    }
    return this.http
      .get<Paginated<BlogPostSummary>>(`${this.base}/posts/`, { params })
      .pipe(map((res) => res.results));
  }

  post(slug: string): Observable<BlogPostDetail> {
    return this.http.get<BlogPostDetail>(`${this.base}/posts/${slug}/`);
  }
}
```

- [ ] **Step 7: Write BlogService test**

Create `frontend/src/app/core/blog.service.spec.ts`:

```ts
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../environments/environment';
import { BlogService } from './blog.service';
import { BlogPostSummary, Category, Paginated } from '../shared/models/blog.models';

describe('BlogService', () => {
  let service: BlogService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(BlogService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('categories() unwraps the paginated results array', () => {
    const page: Paginated<Category> = {
      count: 1, next: null, previous: null,
      results: [{ id: 1, name_en: 'Weight', name_ar: 'الوزن', slug: 'weight' }],
    };
    service.categories().subscribe((cats) => {
      expect(cats).toEqual(page.results);
    });
    const req = httpMock.expectOne(`${environment.apiBaseUrl}/categories/`);
    req.flush(page);
  });

  it('posts() sends category and q as query params and unwraps results', () => {
    const page: Paginated<BlogPostSummary> = { count: 0, next: null, previous: null, results: [] };
    service.posts({ category: 'weight', q: 'protein' }).subscribe();
    const req = httpMock.expectOne(
      (r) => r.url === `${environment.apiBaseUrl}/posts/` &&
        r.params.get('category') === 'weight' &&
        r.params.get('q') === 'protein'
    );
    req.flush(page);
  });

  it('posts() omits category param when category is "all"', () => {
    const page: Paginated<BlogPostSummary> = { count: 0, next: null, previous: null, results: [] };
    service.posts({ category: 'all' }).subscribe();
    const req = httpMock.expectOne(
      (r) => r.url === `${environment.apiBaseUrl}/posts/` && !r.params.has('category')
    );
    req.flush(page);
  });

  it('post(slug) calls the detail endpoint', () => {
    service.post('protein-timing').subscribe();
    httpMock.expectOne(`${environment.apiBaseUrl}/posts/protein-timing/`).flush({});
  });
});
```

- [ ] **Step 8: Write LeadsService**

Create `frontend/src/app/core/leads.service.ts`:

```ts
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { ContactPayload, PlanRequestPayload } from '../shared/models/leads.models';

@Injectable({ providedIn: 'root' })
export class LeadsService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  submitContact(payload: ContactPayload): Observable<ContactPayload> {
    return this.http.post<ContactPayload>(`${this.base}/contact/`, payload);
  }

  submitPlanRequest(payload: PlanRequestPayload): Observable<PlanRequestPayload> {
    return this.http.post<PlanRequestPayload>(`${this.base}/plan-requests/`, payload);
  }
}
```

- [ ] **Step 9: Write LeadsService test**

Create `frontend/src/app/core/leads.service.spec.ts`:

```ts
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../environments/environment';
import { LeadsService } from './leads.service';

describe('LeadsService', () => {
  let service: LeadsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(LeadsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('submitContact() POSTs to /contact/', () => {
    const payload = { name: 'A', email: 'a@b.com', phone: '', subject: 'general', message: 'hi' };
    service.submitContact(payload).subscribe();
    const req = httpMock.expectOne(`${environment.apiBaseUrl}/contact/`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(payload);
  });

  it('submitPlanRequest() POSTs to /plan-requests/', () => {
    const payload = { name: 'A', email: 'a@b.com', phone: '', plan: 'pro', message: 'details' };
    service.submitPlanRequest(payload).subscribe();
    const req = httpMock.expectOne(`${environment.apiBaseUrl}/plan-requests/`);
    expect(req.request.method).toBe('POST');
    req.flush(payload);
  });
});
```

- [ ] **Step 10: Run all tests**

```bash
cd frontend
npx ng test --watch=false --browsers=ChromeHeadless
```

Expected: all `LangService`, `BlogService`, `LeadsService` specs pass.

- [ ] **Step 11: Commit**

```bash
git add frontend/src/app/core frontend/src/app/shared/models frontend/src/app/app.config.ts
git commit -m "Add LangService, BlogService, LeadsService and shared models"
```

---

## Task 3: Shared Nav component

**Source:** `project/NutriDocNav.dc.html` (full file, 106 lines) — read it again before starting if needed.

**Files:**
- Create: `frontend/src/app/shared/nav/nav.component.ts`
- Create: `frontend/src/app/shared/nav/nav.component.html`
- Create: `frontend/src/app/shared/nav/nav.component.scss`
- Create: `frontend/src/app/shared/nav/nav.component.spec.ts`

**Interfaces:**
- Consumes: `LangService` (Task 2) injected directly — no `lang`/`onToggleLang` props, unlike the prototype's `dc-import` pattern, since Angular DI removes the need for prop drilling.
- Produces: `<app-nav active="home|about|services|blog|contact" />` — an `@Input() active` selector consumed by every page component in Tasks 6–12.

- [ ] **Step 1: Write the component class**

Create `frontend/src/app/shared/nav/nav.component.ts`:

```ts
import { Component, HostListener, Input, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { LangService } from '../../core/lang.service';

interface NavLink {
  key: string;
  href: string;
  label: string;
}

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './nav.component.html',
  styleUrl: './nav.component.scss',
})
export class NavComponent {
  @Input() active: 'home' | 'about' | 'services' | 'blog' | 'contact' = 'home';

  private readonly langService = inject(LangService);
  readonly lang = this.langService.lang;
  readonly ar = computed(() => this.lang() === 'ar');

  readonly scrolled = signal(false);
  readonly menuOpen = signal(false);

  readonly tagline = computed(() => (this.ar() ? 'عِش بصحة' : 'LIVE HEALTHY'));
  readonly ctaLabel = computed(() => (this.ar() ? 'اشترك الآن' : 'Subscribe Now'));
  readonly langLabel = computed(() => (this.ar() ? 'EN' : 'العربية'));
  readonly drawerSide = computed(() => (this.ar() ? 'left' : 'right'));

  readonly links = computed<NavLink[]>(() => {
    const ar = this.ar();
    const defs = [
      { key: 'home', en: 'Home', ar: 'الرئيسية', href: '/' },
      { key: 'about', en: 'About', ar: 'من نحن', href: '/about' },
      { key: 'services', en: 'Services', ar: 'الخدمات', href: '/services' },
      { key: 'blog', en: 'Blog', ar: 'المدونة', href: '/blog' },
      { key: 'contact', en: 'Contact', ar: 'تواصل معنا', href: '/contact' },
    ];
    return defs.map((d) => ({ key: d.key, href: d.href, label: ar ? d.ar : d.en }));
  });

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled.set(window.scrollY > 8);
  }

  toggleLang(): void {
    this.langService.toggle();
  }

  toggleMenu(): void {
    this.menuOpen.set(!this.menuOpen());
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }
}
```

- [ ] **Step 2: Write the template**

Create `frontend/src/app/shared/nav/nav.component.html` (structure ported from `project/NutriDocNav.dc.html:18-58`):

```html
<nav class="nd-nav" [class.scrolled]="scrolled()">
  <div class="nd-nav__bar">
    <div class="nd-nav__inner">
      <a routerLink="/" class="nd-nav__brand">
        <img src="assets/nutridoc-logo.png" alt="NutriDoc logo" width="42" height="42" />
        <span class="nd-nav__brand-text">
          <span class="nd-nav__name">NutriDoc</span>
          <span class="nd-nav__tagline">{{ tagline() }}</span>
        </span>
      </a>

      <div class="nd-nav__links nd-desktop-nav">
        @for (link of links(); track link.key) {
          <a [routerLink]="link.href" class="nd-nav__link" [class.active]="link.key === active">{{ link.label }}</a>
        }
      </div>

      <div class="nd-nav__actions">
        <button type="button" class="nd-nav__lang" (click)="toggleLang()" aria-label="Toggle language">
          {{ langLabel() }}
        </button>
        <a routerLink="/subscription" class="nd-nav__cta nd-desktop-nav">{{ ctaLabel() }}</a>
        <button type="button" class="nd-nav__burger nd-mobile-burger" (click)="toggleMenu()" aria-label="Menu">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
      </div>
    </div>
  </div>

  @if (menuOpen()) {
    <div class="nd-nav__scrim" (click)="closeMenu()"></div>
    <div class="nd-nav__drawer" [class.left]="drawerSide() === 'left'" [class.right]="drawerSide() === 'right'">
      <div class="nd-nav__drawer-head">
        <span class="nd-nav__name">NutriDoc</span>
        <button type="button" (click)="closeMenu()" aria-label="Close" class="nd-nav__drawer-close">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>
        </button>
      </div>
      @for (link of links(); track link.key) {
        <a [routerLink]="link.href" class="nd-nav__drawer-link" (click)="closeMenu()">{{ link.label }}</a>
      }
      <a routerLink="/subscription" class="nd-nav__drawer-cta" (click)="closeMenu()">{{ ctaLabel() }}</a>
    </div>
  }
</nav>
```

- [ ] **Step 3: Write the SCSS** (values ported from `project/NutriDocNav.dc.html:12-19,21-57`)

Create `frontend/src/app/shared/nav/nav.component.scss`:

```scss
@import '../../../styles/tokens';

:host { display: block; }

.nd-nav {
  position: sticky;
  top: 0;
  z-index: 100;
  font-family: $font-body;
}

.nd-nav__bar {
  background: rgba(255,255,255,.7);
  backdrop-filter: saturate(150%) blur(12px);
  -webkit-backdrop-filter: saturate(150%) blur(12px);
  border-bottom: 1px solid transparent;
  box-shadow: none;
  transition: box-shadow .25s, border-color .25s, background .25s;
}
.nd-nav.scrolled .nd-nav__bar {
  background: rgba(255,255,255,.88);
  border-bottom-color: #E2EBE3;
  box-shadow: 0 6px 24px rgba(15,36,23,.07);
}

.nd-nav__inner {
  max-width: 1240px;
  margin: 0 auto;
  padding: 0 28px;
  height: 74px;
  display: flex;
  align-items: center;
  gap: 28px;
}

.nd-nav__brand {
  display: flex;
  align-items: center;
  gap: 11px;
  text-decoration: none;
  flex: none;
  img { display: block; width: 42px; height: 42px; object-fit: contain; }
}
.nd-nav__brand-text { display: flex; flex-direction: column; line-height: 1; }
.nd-nav__name { font-family: $font-serif; font-weight: 600; font-size: 21px; color: $nd-green-dark; letter-spacing: -.01em; }
.nd-nav__tagline { font-size: 9.5px; font-weight: 600; letter-spacing: .18em; text-transform: uppercase; color: $nd-green-mid; margin-top: 2px; }

.nd-nav__links {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}
.nd-nav__link {
  text-decoration: none;
  font-weight: 600;
  font-size: 15px;
  padding: 9px 15px;
  border-radius: 999px;
  transition: .18s;
  white-space: nowrap;
  color: #3C4A40;
  &:hover { color: $nd-green-dark; background: #EAF4EA; }
  &.active { color: $nd-green-dark; background: #EAF4EA; }
}

.nd-nav__actions { display: flex; align-items: center; gap: 12px; flex: none; }
.nd-nav__lang {
  border: 1px solid $nd-border-green;
  background: #fff;
  color: $nd-green-dark;
  font-family: inherit;
  font-weight: 700;
  font-size: 13px;
  border-radius: 999px;
  padding: 8px 14px;
  cursor: pointer;
  &:hover { background: #EAF4EA; }
}
.nd-nav__cta {
  background: $nd-green-dark;
  color: #fff;
  text-decoration: none;
  font-weight: 700;
  font-size: 14px;
  padding: 11px 20px;
  border-radius: 999px;
  box-shadow: 0 6px 16px rgba(27,94,32,.22);
  &:hover { background: $nd-green; }
}
.nd-nav__burger { display: none; border: none; background: none; cursor: pointer; padding: 8px; color: $nd-green-dark; }

@include bp-860 {
  .nd-desktop-nav { display: none !important; }
  .nd-mobile-burger { display: flex !important; }
}

.nd-nav__scrim { position: fixed; inset: 0; background: rgba(15,36,23,.45); z-index: 200; }
.nd-nav__drawer {
  position: fixed;
  top: 0;
  height: 100%;
  width: min(82vw, 340px);
  background: #fff;
  z-index: 201;
  box-shadow: 0 0 50px rgba(0,0,0,.25);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  &.right { right: 0; }
  &.left { left: 0; }
}
.nd-nav__drawer-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
.nd-nav__drawer-close { border: none; background: none; cursor: pointer; color: $nd-green-dark; }
.nd-nav__drawer-link {
  text-decoration: none;
  color: $nd-text;
  font-weight: 600;
  font-size: 17px;
  padding: 13px 12px;
  border-radius: 10px;
  &:hover { background: #EAF4EA; }
}
.nd-nav__drawer-cta {
  margin-top: 14px;
  background: $nd-green-dark;
  color: #fff;
  text-decoration: none;
  text-align: center;
  font-weight: 700;
  font-size: 16px;
  padding: 14px;
  border-radius: 12px;
}
```

- [ ] **Step 4: Write a smoke test**

Create `frontend/src/app/shared/nav/nav.component.spec.ts`:

```ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NavComponent } from './nav.component';

describe('NavComponent', () => {
  let fixture: ComponentFixture<NavComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(NavComponent);
    fixture.componentInstance.active = 'home';
    fixture.detectChanges();
  });

  it('creates and renders English links by default', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Home');
    expect(text).toContain('Subscribe Now');
  });

  it('toggling lang switches to Arabic copy', () => {
    fixture.componentInstance.toggleLang();
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('الرئيسية');
  });

  it('toggleMenu opens and closeMenu closes the drawer', () => {
    expect(fixture.componentInstance.menuOpen()).toBe(false);
    fixture.componentInstance.toggleMenu();
    expect(fixture.componentInstance.menuOpen()).toBe(true);
    fixture.componentInstance.closeMenu();
    expect(fixture.componentInstance.menuOpen()).toBe(false);
  });
});
```

- [ ] **Step 5: Run the test**

```bash
cd frontend
npx ng test --watch=false --browsers=ChromeHeadless
```

Expected: all `NavComponent` specs pass.

- [ ] **Step 6: Copy logo assets**

```bash
cp "../project/assets/nutridoc-logo.png" frontend/src/assets/nutridoc-logo.png
```

(Run from `frontend/` directory, or adjust the relative path to point at `project/assets/nutridoc-logo.png` from wherever the shell is.)

- [ ] **Step 7: Commit**

```bash
git add frontend/src/app/shared/nav frontend/src/assets/nutridoc-logo.png
git commit -m "Add shared Nav component"
```

---

## Task 4: Shared Footer component

**Source:** `project/NutriDocFooter.dc.html` (full file, 106 lines).

**Files:**
- Create: `frontend/src/app/shared/footer/footer.component.ts`
- Create: `frontend/src/app/shared/footer/footer.component.html`
- Create: `frontend/src/app/shared/footer/footer.component.scss`
- Create: `frontend/src/app/shared/footer/footer.component.spec.ts`

**Interfaces:**
- Consumes: `LangService` (Task 2), injected directly.
- Produces: `<app-footer />` consumed by every page in Tasks 6–12.

- [ ] **Step 1: Write the component class**

Create `frontend/src/app/shared/footer/footer.component.ts`:

```ts
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { LangService } from '../../core/lang.service';

interface FooterLink { label: string; href: string; external?: boolean; }
interface Social { name: string; href: string; icon: 'instagram' | 'tiktok' | 'youtube' | 'facebook'; }

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent {
  private readonly langService = inject(LangService);
  readonly lang = this.langService.lang;
  readonly ar = computed(() => this.lang() === 'ar');

  readonly blurb = computed(() => this.ar()
    ? 'خطط تغذية مبنية على العلم يصممها د. كريم الطاهر، صيدلي إكلينيكي وخبير تغذية معتمد.'
    : 'Science-backed, personalized nutrition plans crafted by Dr. Karim Eltaher — Clinical Pharmacist & Certified Nutrition Expert.');

  readonly navTitle = computed(() => (this.ar() ? 'تصفح' : 'Navigate'));
  readonly moreTitle = computed(() => (this.ar() ? 'المزيد' : 'More'));
  readonly contactTitle = computed(() => (this.ar() ? 'تواصل' : 'Get in touch'));
  readonly locationLabel = computed(() => (this.ar() ? 'الرياض، العليا، السعودية' : 'Riyadh, Olaya, KSA'));

  readonly links = computed<FooterLink[]>(() => {
    const ar = this.ar();
    return [
      { label: ar ? 'الرئيسية' : 'Home', href: '/' },
      { label: ar ? 'من نحن' : 'About', href: '/about' },
      { label: ar ? 'الخدمات' : 'Services', href: '/services' },
      { label: ar ? 'المدونة' : 'Blog', href: '/blog' },
      { label: ar ? 'تواصل معنا' : 'Contact', href: '/contact' },
    ];
  });

  readonly moreLinks = computed<FooterLink[]>(() => {
    const ar = this.ar();
    return [
      { label: ar ? 'اشترك في خطة' : 'Get a Plan', href: '/subscription' },
      { label: ar ? 'سياسة الخصوصية' : 'Privacy Policy', href: '#' },
      { label: ar ? 'الشروط والأحكام' : 'Terms', href: '#' },
    ];
  });

  readonly socials: Social[] = [
    { name: 'Instagram', href: 'https://instagram.com/dr.karimeltaher', icon: 'instagram' },
    { name: 'TikTok', href: 'https://tiktok.com/@dr.karimeltaher', icon: 'tiktok' },
    { name: 'YouTube', href: 'https://youtube.com/@nutridoc', icon: 'youtube' },
    { name: 'Facebook', href: 'https://facebook.com/nutridoc', icon: 'facebook' },
  ];

  readonly copyright = computed(() => {
    const year = new Date().getFullYear();
    return this.ar()
      ? `© ${year} نوتري دوك. جميع الحقوق محفوظة.`
      : `© ${year} NutriDoc. All rights reserved.`;
  });

  readonly madeWith = computed(() => (this.ar() ? 'صُمم بعناية من أجل صحتك' : 'Designed with care for your health'));
}
```

- [ ] **Step 2: Write the template** (structure ported from `project/NutriDocFooter.dc.html:16-65`; social icons reproduced as inline SVGs from lines 71-74)

Create `frontend/src/app/shared/footer/footer.component.html`:

```html
<footer class="nd-footer">
  <div class="nd-footer__inner">
    <div class="nd-footer__grid">
      <div>
        <div class="nd-footer__brand">
          <img src="assets/nutridoc-logo.png" alt="NutriDoc logo" width="46" height="46" />
          <span class="nd-footer__name">NutriDoc</span>
        </div>
        <p class="nd-footer__blurb">{{ blurb() }}</p>
        <div class="nd-footer__socials">
          @for (s of socials; track s.name) {
            <a [href]="s.href" [attr.aria-label]="s.name" target="_blank" rel="noopener" class="nd-footer__social">
              @switch (s.icon) {
                @case ('instagram') {
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>
                }
                @case ('tiktok') {
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 3c.4 2.3 1.9 4 4.2 4.3v3c-1.6 0-3-.5-4.2-1.3v6.4c0 3.6-2.8 6.1-6.1 6.1A6 6 0 0 1 4.4 15c0-3.4 2.9-6 6.4-5.6v3.1c-.4-.1-.8-.2-1.2-.2A2.6 2.6 0 0 0 7.4 15c0 1.5 1.2 2.6 2.7 2.6 1.5 0 2.7-1.1 2.7-2.8V3h3.7z"/></svg>
                }
                @case ('youtube') {
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M23 7.5a3 3 0 0 0-2.1-2.1C19 4.9 12 4.9 12 4.9s-7 0-8.9.5A3 3 0 0 0 1 7.5C.5 9.4.5 12 .5 12s0 2.6.5 4.5a3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1c.5-1.9.5-4.5.5-4.5s0-2.6-.5-4.5zM9.8 15.3V8.7l5.7 3.3-5.7 3.3z"/></svg>
                }
                @case ('facebook') {
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor"><path d="M14 9V7c0-1 .3-1.5 1.6-1.5H17V2.2C16.6 2.1 15.5 2 14.3 2 11.6 2 10 3.6 10 6.5V9H7.5v3.5H10V22h4v-9.5h2.7l.4-3.5H14z"/></svg>
                }
              }
            </a>
          }
        </div>
      </div>

      <div>
        <h4 class="nd-footer__heading">{{ navTitle() }}</h4>
        <ul class="nd-footer__list">
          @for (l of links(); track l.href) {
            <li><a [routerLink]="l.href" class="nd-footer__link">{{ l.label }}</a></li>
          }
        </ul>
      </div>

      <div>
        <h4 class="nd-footer__heading">{{ moreTitle() }}</h4>
        <ul class="nd-footer__list">
          @for (l of moreLinks(); track l.href) {
            <li><a [routerLink]="l.href" class="nd-footer__link">{{ l.label }}</a></li>
          }
        </ul>
      </div>

      <div>
        <h4 class="nd-footer__heading">{{ contactTitle() }}</h4>
        <ul class="nd-footer__list nd-footer__list--contact">
          <li class="nd-footer__contact-row"><span class="nd-footer__glyph">✉</span><a href="mailto:karimeltaher640@gmail.com" class="nd-footer__link nd-footer__link--break">karimeltaher640@gmail.com</a></li>
          <li class="nd-footer__contact-row"><span class="nd-footer__glyph">☎</span><a href="tel:+966549930730" dir="ltr" class="nd-footer__link">+966 54 993 0730</a></li>
          <li class="nd-footer__contact-row"><span class="nd-footer__glyph">⚲</span><span class="nd-footer__static">{{ locationLabel() }}</span></li>
        </ul>
      </div>
    </div>

    <div class="nd-footer__bottom">
      <span class="nd-footer__copyright">{{ copyright() }}</span>
      <span class="nd-footer__madewith">{{ madeWith() }}</span>
    </div>
  </div>
</footer>
```

- [ ] **Step 3: Write the SCSS** (values ported from `project/NutriDocFooter.dc.html:12-65`)

Create `frontend/src/app/shared/footer/footer.component.scss`:

```scss
@import '../../../styles/tokens';

.nd-footer {
  background: $nd-green-darkest;
  color: #CADCCD;
  font-family: $font-body;
  padding: 72px 28px 32px;
}
.nd-footer__inner { max-width: 1240px; margin: 0 auto; }

.nd-footer__grid {
  display: grid;
  grid-template-columns: 1.6fr 1fr 1fr 1.4fr;
  gap: 44px;
  align-items: start;

  @include bp-860 { grid-template-columns: 1fr 1fr; gap: 32px; }
  @include bp-520 { grid-template-columns: 1fr; }
}

.nd-footer__brand { display: flex; align-items: center; gap: 11px; margin-bottom: 18px; img { width: 46px; height: 46px; object-fit: contain; } }
.nd-footer__name { font-family: $font-serif; font-weight: 600; font-size: 23px; color: #fff; }
.nd-footer__blurb { margin: 0 0 20px; font-size: 15px; line-height: 1.7; color: #9DB6A2; max-width: 300px; }
.nd-footer__socials { display: flex; gap: 10px; }
.nd-footer__social {
  width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;
  border-radius: 10px; background: rgba(255,255,255,.07); color: #A5D6A7; transition: .18s;
  &:hover { background: $nd-green; color: #fff; }
}

.nd-footer__heading { margin: 0 0 16px; font-size: 13px; letter-spacing: .12em; text-transform: uppercase; color: #fff; font-weight: 700; }
.nd-footer__list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 11px; }
.nd-footer__list--contact { gap: 13px; font-size: 15px; }
.nd-footer__link { color: #9DB6A2; text-decoration: none; font-size: 15px; transition: .15s; &:hover { color: #A5D6A7; } }
.nd-footer__link--break { word-break: break-all; }
.nd-footer__contact-row { display: flex; gap: 10px; align-items: center; }
.nd-footer__glyph { color: $nd-green-mid; flex: none; }
.nd-footer__static { color: #9DB6A2; }

.nd-footer__bottom {
  margin-top: 52px;
  padding-top: 24px;
  border-top: 1px solid rgba(255,255,255,.1);
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: space-between;
  align-items: center;
}
.nd-footer__copyright { font-size: 13.5px; color: #7E9784; }
.nd-footer__madewith { font-size: 13.5px; color: #5E7A65; font-style: italic; }
```

- [ ] **Step 4: Write a smoke test**

Create `frontend/src/app/shared/footer/footer.component.spec.ts`:

```ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { FooterComponent } from './footer.component';

describe('FooterComponent', () => {
  let fixture: ComponentFixture<FooterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FooterComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(FooterComponent);
    fixture.detectChanges();
  });

  it('renders the English nav title and email link by default', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Navigate');
    expect(text).toContain('karimeltaher640@gmail.com');
  });

  it('current year appears in the copyright line', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain(String(new Date().getFullYear()));
  });
});
```

- [ ] **Step 5: Run the test**

```bash
cd frontend
npx ng test --watch=false --browsers=ChromeHeadless
```

Expected: all `FooterComponent` specs pass.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/app/shared/footer
git commit -m "Add shared Footer component"
```

---

## Task 5: App shell and routing

**Files:**
- Modify: `frontend/src/app/app.component.ts`
- Modify: `frontend/src/app/app.component.html`
- Modify: `frontend/src/app/app.routes.ts`
- Delete: `frontend/src/app/app.component.spec.ts` default content (replace with a minimal smoke test)

**Interfaces:**
- Produces: routes `/`, `/about`, `/services`, `/subscription`, `/contact`, `/blog`, `/blog/:slug` — `RouterOutlet` is the only content of `AppComponent`; each page component (Tasks 6–12) renders its own `<app-nav>`/`<app-footer>` so there is no shared layout wrapper.

- [ ] **Step 1: Simplify AppComponent to a pure router outlet**

Read `frontend/src/app/app.component.ts` first. Replace its contents with:

```ts
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {}
```

Replace `frontend/src/app/app.component.html` with:

```html
<router-outlet></router-outlet>
```

Clear `frontend/src/app/app.component.scss` to an empty file (no host-level styling needed — each page handles its own).

- [ ] **Step 2: Define routes (components are stubbed in this task, built out in Tasks 6–12)**

This task only wires the route table; the actual page components are created in their own tasks. Define `frontend/src/app/app.routes.ts` now with lazy-loaded standalone components, anticipating the file paths Tasks 6–12 will create:

```ts
import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent) },
  { path: 'about', loadComponent: () => import('./pages/about/about.component').then((m) => m.AboutComponent) },
  { path: 'services', loadComponent: () => import('./pages/services/services.component').then((m) => m.ServicesComponent) },
  { path: 'subscription', loadComponent: () => import('./pages/subscription/subscription.component').then((m) => m.SubscriptionComponent) },
  { path: 'contact', loadComponent: () => import('./pages/contact/contact.component').then((m) => m.ContactComponent) },
  { path: 'blog', loadComponent: () => import('./pages/blog/blog.component').then((m) => m.BlogComponent) },
  { path: 'blog/:slug', loadComponent: () => import('./pages/blog-post/blog-post.component').then((m) => m.BlogPostComponent) },
];
```

This will not compile until Tasks 6–12 create those files — that is expected. Each subsequent task creates exactly the file the corresponding `loadComponent` import points to, so the app starts compiling correctly once Task 6 (Home) lands, and fully once Task 12 (BlogPost) lands.

- [ ] **Step 3: Update the app smoke test**

Replace `frontend/src/app/app.component.spec.ts` with:

```ts
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('creates the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/app.component.ts frontend/src/app/app.component.html frontend/src/app/app.component.scss frontend/src/app/app.component.spec.ts frontend/src/app/app.routes.ts
git commit -m "Wire app shell and route table for all 7 pages"
```

(The build will fail to compile until Task 6 lands a real `HomeComponent` — that's fine, this is an internal checkpoint commit. If your workflow requires a green build per commit, do Task 5's Step 4 commit together with Task 6 instead of separately.)

---

## Task 6: Home page

**Source:** `project/Home.dc.html` (full file, 452 lines) — read it again before starting; this task ports every section between `<main>` (line 56) and `</main>` (line 295), plus the `renderVals()` data block (lines 300-449).

**Files:**
- Create: `frontend/src/app/pages/home/home.component.ts`
- Create: `frontend/src/app/pages/home/home.component.html`
- Create: `frontend/src/app/pages/home/home.component.scss`
- Create: `frontend/src/app/pages/home/home.component.spec.ts`

**Interfaces:**
- Consumes: `LangService` (Task 2), `NavComponent`/`FooterComponent` (Tasks 3-4).
- Produces: route `''` per Task 5.

- [ ] **Step 1: Write the component class** (data ported verbatim from `project/Home.dc.html:335-447`)

Create `frontend/src/app/pages/home/home.component.ts`:

```ts
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { LangService } from '../../core/lang.service';
import { NavComponent } from '../../shared/nav/nav.component';
import { FooterComponent } from '../../shared/footer/footer.component';

interface TrustPoint { icon: 'pill' | 'book' | 'shield' | 'free'; title: string; desc: string; }
interface HubPost { cat: string; title: string; excerpt?: string; read: string; bg?: string; }
interface Topic { icon: 'scale' | 'myth' | 'clinic' | 'supp' | 'gut' | 'sport'; title: string; desc: string; count: string; }
interface Myth { claim: string; fact: string; }
interface Social { glyph: string; platform: string; handle: string; href: string; }

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, NavComponent, FooterComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  private readonly langService = inject(LangService);
  readonly lang = this.langService.lang;
  readonly ar = computed(() => this.lang() === 'ar');

  readonly openMyths = new Set<number>();

  toggleMyth(i: number): void {
    if (this.openMyths.has(i)) {
      this.openMyths.delete(i);
    } else {
      this.openMyths.add(i);
    }
    this.mythVersion.set(this.mythVersion() + 1);
  }
  readonly mythVersion = (() => {
    const { signal } = require('@angular/core');
    return signal(0);
  })();

  // Hero
  readonly heroEyebrow = computed(() => (this.ar() ? 'تغذية مبنية على الأدلة' : 'Evidence-based nutrition'));
  readonly heroH1a = computed(() => (this.ar() ? 'معلومات صحية' : 'Nutrition advice you can'));
  readonly heroH1b = computed(() => (this.ar() ? 'تثق بها' : 'actually'));
  readonly heroH1c = computed(() => (this.ar() ? 'فعلاً' : 'trust.'));
  readonly heroSub = computed(() => this.ar()
    ? 'مقالات واضحة ومبنية على العلم يكتبها ويراجعها صيدلي إكلينيكي مرخّص. بلا موضات، بلا تهويل — فقط ما تقوله الأدلة.'
    : 'Clear, science-backed articles written and reviewed by a licensed Clinical Pharmacist. No fads, no hype — just what the evidence says.');
  readonly heroCta1 = computed(() => (this.ar() ? 'تصفّح المقالات' : 'Explore the Articles'));
  readonly heroCta2 = computed(() => (this.ar() ? 'تعرّف على د. كريم' : 'Meet Dr. Karim'));
  readonly heroReassure = computed(() => (this.ar() ? 'كل محتوى مُراجَع طبياً · مجاني للجميع' : 'Every article medically reviewed · Free for everyone'));
  readonly heroCardTag = computed(() => (this.ar() ? 'الأكثر قراءة' : 'Most read'));
  readonly heroCardTitle = computed(() => (this.ar() ? 'هل تحتاج فعلاً إلى الفيتامينات المتعددة؟' : 'Do You Actually Need a Multivitamin?'));
  readonly heroCardExcerpt = computed(() => this.ar()
    ? 'نظرة هادئة على ما تقوله الأبحاث — ومتى تكون المكملات مضيعة للمال.'
    : 'A calm look at what the research says — and when supplements are a waste of money.');
  readonly heroCardAuthor = computed(() => (this.ar() ? 'د. كريم الطاهر' : 'Dr. Karim Eltaher'));
  readonly heroCardVerified = computed(() => (this.ar() ? 'مُراجَع' : 'Reviewed'));
  readonly scrollLabel = computed(() => (this.ar() ? 'اكتشف' : 'Scroll'));

  // Trust
  readonly trustEyebrow = computed(() => (this.ar() ? 'لماذا تثق بنا' : 'Why trust us'));
  readonly trustH2 = computed(() => (this.ar() ? 'لأن المعلومة الصحية يجب أن تكون آمنة' : 'Because health information should be safe to act on'));
  readonly trustPoints = computed<TrustPoint[]>(() => {
    const ar = this.ar();
    return [
      { icon: 'pill', title: ar ? 'بقلم صيدلي إكلينيكي' : 'Written by a Pharmacist', desc: ar ? 'كل مقال يكتبه ويراجعه صيدلي إكلينيكي مرخّص.' : 'Every article is written and reviewed by a licensed clinical pharmacist.' },
      { icon: 'book', title: ar ? 'مبني على الأدلة' : 'Backed by Evidence', desc: ar ? 'معلومات من الأبحاث المحكّمة، لا من الموضات العابرة.' : 'Sourced from peer-reviewed research — not passing trends.' },
      { icon: 'shield', title: ar ? 'آمن مع أدويتك' : 'Safe With Your Meds', desc: ar ? 'نراعي تفاعلات الدواء والغذاء التي يغفلها الآخرون.' : "We account for the drug–food interactions others overlook." },
      { icon: 'free', title: ar ? 'مجاني ومتاح' : 'Free & Accessible', desc: ar ? 'معرفة صحية موثوقة، متاحة للجميع دون مقابل.' : 'Trustworthy health knowledge, available to everyone at no cost.' },
    ];
  });

  // Knowledge hub
  readonly hubEyebrow = computed(() => (this.ar() ? 'مركز المعرفة' : 'Knowledge hub'));
  readonly hubH2 = computed(() => (this.ar() ? 'اقرأ. افهم. قرّر بثقة.' : 'Read. Understand. Decide with confidence.'));
  readonly hubSub = computed(() => this.ar()
    ? 'مقالات جديدة كل أسبوع تفكّك المواضيع الصحية المعقدة إلى معرفة عملية.'
    : 'New articles every week that break complex health topics into knowledge you can use.');
  readonly blogAll = computed(() => (this.ar() ? 'كل المقالات' : 'All articles'));
  readonly readMore = computed(() => (this.ar() ? 'اقرأ المقال' : 'Read article'));

  readonly featuredPost = computed<HubPost>(() => {
    const ar = this.ar();
    return {
      cat: ar ? 'تغذية إكلينيكية' : 'Clinical Nutrition',
      title: ar ? 'الحقيقة حول توقيت البروتين — ماذا يقول العلم فعلاً' : 'The Truth About Protein Timing — What the Science Actually Says',
      excerpt: ar
        ? 'النافذة البنائية ومشروبات التمرين، ولماذا الكمية اليومية أهم بكثير من التوقيت.'
        : 'The anabolic window, post-workout shakes, and why your total daily intake matters far more than the clock.',
      read: ar ? '٦ دقائق' : '6 min read',
    };
  });

  readonly restPosts = computed<HubPost[]>(() => {
    const ar = this.ar();
    return [
      { bg: 'linear-gradient(140deg,#1B5E20,#66BB6A)', cat: ar ? 'حقائق وخرافات' : 'Myths & Facts', title: ar ? '٥ خرافات غذائية يكشفها صيدلي' : '5 Food Myths Debunked by a Clinical Pharmacist', read: ar ? '٥ دقائق' : '5 min read' },
      { bg: 'linear-gradient(140deg,#2E7D32,#A5D6A7)', cat: ar ? 'إدارة الوزن' : 'Weight Management', title: ar ? 'لماذا تفشل الحميات القاسية' : 'Why Crash Diets Always Fail', read: ar ? '٧ دقائق' : '7 min read' },
      { bg: 'linear-gradient(140deg,#66BB6A,#1B5E20)', cat: ar ? 'مكملات' : 'Supplements', title: ar ? 'هل تحتاج فعلاً إلى الفيتامينات المتعددة؟' : 'Do You Actually Need a Multivitamin?', read: ar ? '٤ دقائق' : '4 min read' },
    ];
  });

  // Topics
  readonly topicsEyebrow = computed(() => (this.ar() ? 'تصفّح حسب الموضوع' : 'Browse by topic'));
  readonly topicsH2 = computed(() => (this.ar() ? 'ابحث عمّا يهمّك' : 'Find What Matters to You'));
  readonly topics = computed<Topic[]>(() => {
    const ar = this.ar();
    return [
      { icon: 'scale', title: ar ? 'إدارة الوزن' : 'Weight Management', desc: ar ? 'فقدان مستدام بلا حميات قاسية.' : 'Sustainable loss without crash diets.', count: ar ? '٨ مقالات' : '8 articles' },
      { icon: 'myth', title: ar ? 'حقائق وخرافات' : 'Myths & Facts', desc: ar ? 'ادعاءات شائعة تحت مجهر العلم.' : 'Popular claims under the microscope.', count: ar ? '٦ مقالات' : '6 articles' },
      { icon: 'clinic', title: ar ? 'تغذية إكلينيكية' : 'Clinical Nutrition', desc: ar ? 'تغذية لمرضى الحالات المزمنة.' : 'Nutrition for chronic conditions.', count: ar ? '٥ مقالات' : '5 articles' },
      { icon: 'supp', title: ar ? 'المكملات' : 'Supplements', desc: ar ? 'ما يستحق المال وما لا يستحق.' : "What's worth it, what isn't.", count: ar ? '٤ مقالات' : '4 articles' },
      { icon: 'gut', title: ar ? 'صحة الأمعاء' : 'Gut Health', desc: ar ? 'الميكروبيوم والشهية والطاقة.' : 'Microbiome, appetite & energy.', count: ar ? '٣ مقالات' : '3 articles' },
      { icon: 'sport', title: ar ? 'تغذية رياضية' : 'Sports Nutrition', desc: ar ? 'الأداء والتعافي بذكاء.' : 'Smarter performance & recovery.', count: ar ? '٣ مقالات' : '3 articles' },
    ];
  });

  // Myth vs fact
  readonly mythEyebrow = computed(() => (this.ar() ? 'حقيقة أم خرافة' : 'Myth vs Fact'));
  readonly mythH2 = computed(() => (this.ar() ? 'تحقّق بنفسك الآن' : 'Check It for Yourself, Right Now'));
  readonly mythSub = computed(() => this.ar()
    ? 'ادعاءات صحية شائعة، تحت مجهر الأدلة. اضغط لكشف الحقيقة.'
    : 'Common health claims, checked against the evidence. Tap to reveal the truth.');
  readonly mythTag = computed(() => (this.ar() ? 'خرافة' : 'Myth'));
  readonly factTag = computed(() => (this.ar() ? 'الحقيقة' : 'Fact'));
  readonly myths = computed<Myth[]>(() => {
    const ar = this.ar();
    return [
      { claim: ar ? 'الأكل بعد الثامنة مساءً يزيد الوزن.' : 'Eating after 8pm makes you gain weight.', fact: ar ? 'تغيّر الوزن يعتمد على إجمالي سعراتك اليومية، لا على الساعة. الأكل المتأخر يضر فقط إن دفعك لتناول المزيد أو أفسد نومك.' : 'Weight change depends on your total calories over the day — not the clock. Late eating only matters if it leads you to eat more overall or disrupts your sleep.' },
      { claim: ar ? 'الكربوهيدرات عدو فقدان الوزن.' : 'Carbs are the enemy of weight loss.', fact: ar ? 'لا يوجد عنصر غذائي واحد يسبب زيادة الوزن. الكربوهيدرات الكاملة كالشوفان والفاكهة والبقوليات ترتبط بتحكم أفضل بالوزن وصحة أمعاء أفضل.' : 'No single nutrient causes weight gain. Whole-food carbs like oats, fruit, and legumes are linked to better long-term weight control and gut health.' },
      { claim: ar ? 'شاي «الديتوكس» ينظّف جسمك.' : '"Detox" teas cleanse your body.', fact: ar ? 'كبدك وكليتاك ينظّفان جسمك على مدار الساعة. معظم أنواع شاي الديتوكس مجرد ملينات أو مدرّات للبول — والوزن المفقود ماء يعود سريعاً.' : 'Your liver and kidneys already detox your body 24/7. Most detox teas are mild laxatives or diuretics — the lost weight is water, and it returns.' },
      { claim: ar ? 'المكملات تغني عن النظام المتوازن.' : 'Supplements can replace a balanced diet.', fact: ar ? 'المكملات تسدّ نقصاً محدداً، لكنها لا تعوّض ألياف ومضادات أكسدة وتكامل الأطعمة الكاملة. معظم الأصحّاء يحصلون على حاجتهم من الطعام.' : "Supplements fill specific gaps — they can't replicate the fiber, antioxidants, and synergy of whole foods. Most healthy people get what they need from food." },
    ];
  });

  // About teaser
  readonly aboutEyebrow = computed(() => (this.ar() ? 'الخبير وراء المحتوى' : 'The expert behind the content'));
  readonly aboutH2 = computed(() => (this.ar() ? 'لماذا د. كريم؟' : 'Why Dr. Karim?'));
  readonly aboutBio = computed(() => this.ar()
    ? 'بصفته صيدلياً إكلينيكياً مرخّصاً وخبير تغذية معتمداً، يجمع د. كريم الطاهر بين فهم عميق للأدوية وعلم التغذية الحديث — وهو مزيج نادر يجعل نصيحته آمنة ودقيقة، خاصة لمن يتناولون أدوية مزمنة.'
    : 'As a licensed Clinical Pharmacist and Certified Nutrition Expert, Dr. Karim Eltaher combines a deep understanding of medications with modern nutrition science — a rare pairing that makes his guidance both safe and precise, especially for anyone on long-term medication.');
  readonly credentials = computed<string[]>(() => this.ar()
    ? ['مرخّص من الهيئة السعودية', 'خبير تغذية معتمد (UK)', 'صيدلي إكلينيكي']
    : ['SCFHS Licensed', 'Certified Nutrition Expert (UK)', 'Clinical Pharmacist']);
  readonly aboutCta = computed(() => (this.ar() ? 'اقرأ قصته الكاملة' : 'Read His Full Story'));
  readonly credBadgeLabel = computed(() => (this.ar() ? 'مرخّص رسمياً' : 'Officially Licensed'));
  readonly credBadgeText = computed(() => (this.ar() ? 'الهيئة السعودية للتخصصات الصحية' : 'SCFHS · Saudi Arabia'));

  // Follow
  readonly followEyebrow = computed(() => (this.ar() ? 'ابقَ على اطلاع' : 'Stay informed'));
  readonly followH2 = computed(() => (this.ar() ? 'نصائح صحية مجانية كل يوم' : 'Free Health Tips, Every Day'));
  readonly followSub = computed(() => this.ar()
    ? 'انضم لعشرات الآلاف الذين يتعلمون التغذية الصحيحة عبر منصاتنا.'
    : 'Join the tens of thousands learning real nutrition across our channels.');
  readonly socials: Social[] = [
    { glyph: '⊚', platform: 'Instagram', handle: '@dr.karimeltaher', href: 'https://instagram.com/dr.karimeltaher' },
    { glyph: '♪', platform: 'TikTok', handle: '@dr.karimeltaher', href: 'https://tiktok.com/@dr.karimeltaher' },
    { glyph: '▶', platform: 'YouTube', handle: 'NutriDoc', href: 'https://youtube.com/@nutridoc' },
    { glyph: 'f', platform: 'Facebook', handle: 'NutriDoc', href: 'https://facebook.com/nutridoc' },
  ];

  // Soft plan CTA
  readonly planEyebrow = computed(() => (this.ar() ? 'عندما تكون مستعداً' : "When you're ready"));
  readonly planH2 = computed(() => (this.ar() ? 'تريد إرشاداً مصمماً لك أنت؟' : 'Want guidance made just for you?'));
  readonly planSub = computed(() => this.ar()
    ? 'إذا أردت أن تتحول المعرفة إلى خطة شخصية تراعي جسمك وأدويتك، يمكن لـ د. كريم تصميمها لك.'
    : "If you'd like to turn this knowledge into a personal plan that accounts for your body and your medications, Dr. Karim can build one for you.");
  readonly planBtn = computed(() => (this.ar() ? 'استكشف الخطط الشخصية' : 'Explore Personal Plans'));
  readonly planNote = computed(() => (this.ar() ? 'لا ضغط — المحتوى يبقى مجانياً دائماً.' : 'No pressure — the content stays free, always.'));

  isMythOpen(i: number): boolean {
    return this.openMyths.has(i);
  }
}
```

**Note on `toggleMyth`:** the `require('@angular/core')` trick above is invalid in a browser ES build — use a proper top-level `signal` import instead. Rewrite that block as:

```ts
import { Component, computed, inject, signal } from '@angular/core';
// ...
export class HomeComponent {
  // ...
  private readonly openMythsSet = new Set<number>();
  readonly mythVersion = signal(0);

  toggleMyth(i: number): void {
    if (this.openMythsSet.has(i)) {
      this.openMythsSet.delete(i);
    } else {
      this.openMythsSet.add(i);
    }
    this.mythVersion.set(this.mythVersion() + 1);
  }

  isMythOpen(i: number): boolean {
    this.mythVersion(); // read for reactivity
    return this.openMythsSet.has(i);
  }
}
```

Use this corrected version in the actual file — delete the `require(...)` snippet, it was illustrative only.

- [ ] **Step 2: Write the template** (sections ported from `project/Home.dc.html:58-293`)

Create `frontend/src/app/pages/home/home.component.html`:

```html
<div class="nd-page">
  <app-nav active="home" />

  <main>
    <!-- HERO -->
    <section class="nd-hero">
      <div class="nd-hero__orbs">
        <div class="nd-hero__orb nd-hero__orb--1"></div>
        <div class="nd-hero__orb nd-hero__orb--2"></div>
        <div class="nd-hero__orb nd-hero__orb--3"></div>
      </div>
      <div class="nd-hero__grid">
        <div class="nd-hero__left">
          <div class="nd-hero__eyebrow"><span class="nd-hero__dot"></span><span>{{ heroEyebrow() }}</span></div>
          <h1 class="nd-hero__h1">{{ heroH1a() }} <em>{{ heroH1b() }}</em> {{ heroH1c() }}</h1>
          <p class="nd-hero__sub">{{ heroSub() }}</p>
          <div class="nd-hero__ctas">
            <a routerLink="/blog" class="nd-hero__cta-primary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
              {{ heroCta1() }}
            </a>
            <a routerLink="/about" class="nd-hero__cta-secondary">
              {{ heroCta2() }}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
          </div>
          <p class="nd-hero__reassure">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#66BB6A" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
            {{ heroReassure() }}
          </p>
        </div>
        <div class="nd-hero__right">
          <div class="nd-hero__card-wrap">
            <div class="nd-hero__card-shadow"></div>
            <div class="nd-hero__card">
              <span class="nd-hero__card-tag">{{ heroCardTag() }}</span>
              <h3 class="nd-hero__card-title">{{ heroCardTitle() }}</h3>
              <p class="nd-hero__card-excerpt">{{ heroCardExcerpt() }}</p>
              <div class="nd-hero__card-foot">
                <span class="nd-hero__card-avatar">K</span>
                <span class="nd-hero__card-author">{{ heroCardAuthor() }}</span>
                <span class="nd-hero__card-verified">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                  {{ heroCardVerified() }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="nd-hero__scroll">
        <span>{{ scrollLabel() }}</span>
        <div class="nd-hero__scroll-line"></div>
      </div>
    </section>

    <!-- TRUST -->
    <section class="nd-trust">
      <div class="nd-sec">
        <div class="nd-trust__head">
          <span class="nd-eyebrow">{{ trustEyebrow() }}</span>
          <h2 class="nd-trust__h2">{{ trustH2() }}</h2>
        </div>
        <div class="nd-trust__grid">
          @for (t of trustPoints(); track t.title) {
            <div class="nd-trust__item">
              <div class="nd-trust__icon">
                @switch (t.icon) {
                  @case ('pill') { <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="9" width="18" height="6" rx="3" transform="rotate(45 12 12)"/><path d="M9 9l6 6"/></svg> }
                  @case ('book') { <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> }
                  @case ('shield') { <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg> }
                  @case ('free') { <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><path d="M9 9h6M9 12h6M9 15h3"/></svg> }
                }
              </div>
              <h3 class="nd-trust__title">{{ t.title }}</h3>
              <p class="nd-trust__desc">{{ t.desc }}</p>
            </div>
          }
        </div>
      </div>
    </section>

    <!-- KNOWLEDGE HUB -->
    <section class="nd-hub">
      <div class="nd-sec">
        <div class="nd-hub__head">
          <div>
            <span class="nd-eyebrow nd-eyebrow--light">{{ hubEyebrow() }}</span>
            <h2 class="nd-hub__h2">{{ hubH2() }}</h2>
            <p class="nd-hub__sub">{{ hubSub() }}</p>
          </div>
          <a routerLink="/blog" class="nd-hub__all">{{ blogAll() }} <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></a>
        </div>
        <div class="nd-hub__grid">
          <a routerLink="/blog" class="nd-hub__featured">
            <div class="nd-hub__featured-img">
              <span class="nd-hub__featured-cat">{{ featuredPost().cat }}</span>
              <span class="nd-hub__featured-read">{{ featuredPost().read }}</span>
            </div>
            <div class="nd-hub__featured-body">
              <h3>{{ featuredPost().title }}</h3>
              <p>{{ featuredPost().excerpt }}</p>
              <span class="nd-hub__featured-cta">{{ readMore() }} <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></span>
            </div>
          </a>
          <div class="nd-hub__rest">
            @for (post of restPosts(); track post.title) {
              <a routerLink="/blog" class="nd-hub__rest-item">
                <div class="nd-hub__rest-thumb" [style.background]="post.bg"></div>
                <div>
                  <span class="nd-hub__rest-cat">{{ post.cat }}</span>
                  <h3 class="nd-hub__rest-title">{{ post.title }}</h3>
                  <span class="nd-hub__rest-read">{{ post.read }}</span>
                </div>
              </a>
            }
          </div>
        </div>
      </div>
    </section>

    <!-- TOPICS -->
    <section class="nd-topics">
      <div class="nd-sec">
        <div class="nd-topics__head">
          <span class="nd-eyebrow">{{ topicsEyebrow() }}</span>
          <h2 class="nd-topics__h2">{{ topicsH2() }}</h2>
        </div>
        <div class="nd-topics__grid">
          @for (t of topics(); track t.title) {
            <a routerLink="/blog" class="nd-card-hover nd-topics__card">
              <div class="nd-topics__icon">
                @switch (t.icon) {
                  @case ('scale') { <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 3a9 9 0 1 0 9 9"/><path d="M21 3l-9 9"/></svg> }
                  @case ('myth') { <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.7-2.5 2-2.5 3.5M12 17h.01"/></svg> }
                  @case ('clinic') { <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 2l8 4v6c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V6z"/><path d="M12 8v6M9 11h6"/></svg> }
                  @case ('supp') { <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M10 3 3 10a4.95 4.95 0 0 0 7 7l7-7a4.95 4.95 0 0 0-7-7z"/><path d="M6.5 6.5 17.5 17.5"/></svg> }
                  @case ('gut') { <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 2a5 5 0 0 0-5 5c0 2 1 3 1 5s-2 2-2 4a3 3 0 0 0 6 0c0-2 1-3 3-3s3 1 3-1-2-2-2-5a5 5 0 0 0-2-7"/></svg> }
                  @case ('sport') { <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M6.5 6.5l11 11M4 9l2-2M9 4l-2 2M15 20l2-2M20 15l-2 2"/></svg> }
                }
              </div>
              <div>
                <h3>{{ t.title }}</h3>
                <p>{{ t.desc }}</p>
              </div>
              <span class="nd-topics__count">{{ t.count }} <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></span>
            </a>
          }
        </div>
      </div>
    </section>

    <!-- MYTH VS FACT -->
    <section class="nd-myth">
      <div class="nd-myth__glow"></div>
      <div class="nd-sec nd-myth__inner">
        <div class="nd-myth__head">
          <span class="nd-eyebrow nd-eyebrow--light">{{ mythEyebrow() }}</span>
          <h2 class="nd-myth__h2">{{ mythH2() }}</h2>
          <p class="nd-myth__sub">{{ mythSub() }}</p>
        </div>
        <div class="nd-myth__list">
          @for (m of myths(); track m.claim; let i = $index) {
            <div class="nd-myth__item" [class.open]="isMythOpen(i)" (click)="toggleMyth(i)">
              <div class="nd-myth__row">
                <span class="nd-myth__tag">{{ mythTag() }}</span>
                <span class="nd-myth__claim">{{ m.claim }}</span>
                <span class="nd-myth__toggle" [class.rotated]="isMythOpen(i)">+</span>
              </div>
              @if (isMythOpen(i)) {
                <div class="nd-myth__answer">
                  <span class="nd-myth__fact-tag">{{ factTag() }}</span>
                  <p>{{ m.fact }}</p>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </section>

    <!-- MEET THE EXPERT -->
    <section class="nd-about-teaser">
      <div class="nd-sec nd-about-teaser__grid">
        <div class="nd-about-teaser__photo-wrap">
          <div class="nd-about-teaser__photo">
            <svg width="120" height="120" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8.5" r="5" stroke="#66BB6A" stroke-width="1"/><path d="M3 22c0-5 3.8-8 9-8s9 3 9 8" stroke="#66BB6A" stroke-width="1"/></svg>
          </div>
          <div class="nd-about-teaser__badge">
            <div class="nd-about-teaser__badge-label">{{ credBadgeLabel() }}</div>
            <div class="nd-about-teaser__badge-text">{{ credBadgeText() }}</div>
          </div>
        </div>
        <div>
          <span class="nd-eyebrow">{{ aboutEyebrow() }}</span>
          <h2 class="nd-about-teaser__h2">{{ aboutH2() }}</h2>
          <p class="nd-about-teaser__bio">{{ aboutBio() }}</p>
          <div class="nd-about-teaser__creds">
            @for (c of credentials(); track c) {
              <span class="nd-about-teaser__cred"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>{{ c }}</span>
            }
          </div>
          <a routerLink="/about" class="nd-about-teaser__cta">{{ aboutCta() }} <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></a>
        </div>
      </div>
    </section>

    <!-- FOLLOW -->
    <section class="nd-follow">
      <div class="nd-sec nd-follow__inner">
        <span class="nd-eyebrow">{{ followEyebrow() }}</span>
        <h2 class="nd-follow__h2">{{ followH2() }}</h2>
        <p class="nd-follow__sub">{{ followSub() }}</p>
        <div class="nd-follow__grid">
          @for (s of socials; track s.platform) {
            <a [href]="s.href" target="_blank" rel="noopener" class="nd-card-hover nd-follow__item">
              <span class="nd-follow__glyph">{{ s.glyph }}</span>
              <span><span class="nd-follow__platform">{{ s.platform }}</span><span class="nd-follow__handle">{{ s.handle }}</span></span>
            </a>
          }
        </div>
      </div>
    </section>

    <!-- SOFT CTA -->
    <section class="nd-plan-cta">
      <div class="nd-plan-cta__line"></div>
      <div class="nd-sec nd-plan-cta__grid">
        <div>
          <span class="nd-eyebrow nd-eyebrow--light">{{ planEyebrow() }}</span>
          <h2 class="nd-plan-cta__h2">{{ planH2() }}</h2>
          <p class="nd-plan-cta__sub">{{ planSub() }}</p>
        </div>
        <div class="nd-plan-cta__action">
          <a routerLink="/subscription" class="nd-plan-cta__btn">{{ planBtn() }} <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></a>
          <span class="nd-plan-cta__note">{{ planNote() }}</span>
        </div>
      </div>
    </section>
  </main>

  <app-footer />
</div>
```

- [ ] **Step 3: Write the SCSS** (every value below ported from `project/Home.dc.html:24-49,59-293`)

Create `frontend/src/app/pages/home/home.component.scss`:

```scss
@import '../../../styles/tokens';

.nd-page { font-family: $font-body; color: $nd-text; background: $nd-bg; overflow-x: hidden; }
.nd-sec { @include bp-640 { padding-left: 20px; padding-right: 20px; } }
.nd-eyebrow { font-size: 12px; font-weight: 700; letter-spacing: .18em; text-transform: uppercase; color: $nd-green; }
.nd-eyebrow--light { color: $nd-green-mid; }

// HERO
.nd-hero { position: relative; background: $nd-green-deepest; overflow: hidden; }
.nd-hero__orbs { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
.nd-hero__orb--1 { position: absolute; top: -10%; left: -5%; width: 640px; height: 640px; border-radius: 50%; background: radial-gradient(circle, rgba(46,125,50,.5) 0%, transparent 70%); animation: ndOrb1 18s ease-in-out infinite; }
.nd-hero__orb--2 { position: absolute; bottom: -15%; right: -8%; width: 540px; height: 540px; border-radius: 50%; background: radial-gradient(circle, rgba(27,94,32,.42) 0%, transparent 70%); animation: ndOrb2 22s ease-in-out infinite; }
.nd-hero__orb--3 { position: absolute; top: 40%; left: 45%; width: 300px; height: 300px; border-radius: 50%; background: radial-gradient(circle, rgba(102,187,106,.18) 0%, transparent 70%); animation: ndOrb3 14s ease-in-out infinite; }

.nd-hero__grid {
  display: grid; grid-template-columns: 1fr 400px; max-width: 1320px; margin: 0 auto; padding: 0 48px;
  align-items: center; min-height: 88vh; position: relative;
  @include bp-1024 { grid-template-columns: 1fr; }
  @include bp-640 { padding-left: 20px; padding-right: 20px; }
}
.nd-hero__left { padding: 100px 60px 100px 0; @include bp-1024 { padding: 80px 0; } }
.nd-hero__eyebrow {
  display: inline-flex; align-items: center; gap: 9px; background: rgba(102,187,106,.14);
  border: 1px solid rgba(102,187,106,.28); border-radius: 999px; padding: 8px 16px; margin-bottom: 30px;
  span:last-child { font-size: 12.5px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: $nd-green-light; }
}
.nd-hero__dot { width: 7px; height: 7px; border-radius: 50%; background: $nd-green-mid; flex: none; }
.nd-hero__h1 {
  font-family: $font-serif; font-weight: 300; font-size: 70px; line-height: 1.03; color: #fff;
  letter-spacing: -.03em; max-width: 15ch;
  em { font-style: italic; color: $nd-green-mid; }
  @include bp-640 { font-size: 42px; line-height: 1.08; }
}
.nd-hero__sub { margin-top: 26px; font-size: 18.5px; line-height: 1.7; color: rgba(214,232,216,.82); max-width: 50ch; }
.nd-hero__ctas { margin-top: 38px; display: flex; gap: 14px; flex-wrap: wrap; align-items: center; }
.nd-hero__cta-primary {
  display: inline-flex; align-items: center; gap: 9px; background: linear-gradient(135deg, $nd-green-mid, $nd-green);
  color: #fff; text-decoration: none; font-weight: 700; font-size: 16px; padding: 16px 28px; border-radius: 14px;
  box-shadow: 0 12px 32px rgba(46,125,50,.4); transition: .2s;
  &:hover { transform: translateY(-2px); box-shadow: 0 18px 40px rgba(46,125,50,.5); }
}
.nd-hero__cta-secondary {
  display: inline-flex; align-items: center; gap: 8px; color: $nd-green-light; text-decoration: none;
  font-weight: 600; font-size: 16px; padding: 16px 6px; border-bottom: 1px solid rgba(165,214,167,.35); transition: .2s;
  &:hover { color: #fff; border-color: rgba(255,255,255,.5); }
}
.nd-hero__reassure { margin-top: 30px; font-size: 14px; color: rgba(165,214,167,.6); display: flex; align-items: center; gap: 10px; }

.nd-hero__right { position: relative; display: flex; align-items: center; justify-content: center; @include bp-1024 { display: none; } }
.nd-hero__card-wrap { position: relative; width: 340px; }
.nd-hero__card-shadow { position: absolute; top: 30px; left: 24px; right: -24px; height: 200px; background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.08); border-radius: 20px; transform: rotate(4deg); }
.nd-hero__card { position: relative; background: #fff; border-radius: 20px; padding: 26px; box-shadow: 0 30px 70px rgba(0,0,0,.35); }
.nd-hero__card-tag { display: inline-block; background: #EAF4EA; color: $nd-green-dark; font-size: 11px; font-weight: 700; padding: 5px 12px; border-radius: 999px; letter-spacing: .05em; margin-bottom: 14px; }
.nd-hero__card-title { font-family: $font-serif; font-size: 23px; font-weight: 500; line-height: 1.25; color: $nd-text; margin-bottom: 12px; }
.nd-hero__card-excerpt { font-size: 13.5px; line-height: 1.6; color: $nd-text-muted; margin-bottom: 18px; }
.nd-hero__card-foot { display: flex; align-items: center; gap: 9px; padding-top: 14px; border-top: 1px solid #EEF4EE; }
.nd-hero__card-avatar { width: 30px; height: 30px; border-radius: 50%; background: linear-gradient(140deg, $nd-green-mid, $nd-green); display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 12px; }
.nd-hero__card-author { font-size: 12.5px; font-weight: 600; color: #445249; }
.nd-hero__card-verified { margin-inline-start: auto; font-size: 11.5px; color: $nd-green; font-weight: 700; display: flex; align-items: center; gap: 4px; }

.nd-hero__scroll { position: absolute; bottom: 28px; left: 50%; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; gap: 8px; color: rgba(165,214,167,.5); font-size: 11px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; }
.nd-hero__scroll-line { width: 1px; height: 36px; background: linear-gradient(to bottom, rgba(165,214,167,.4), transparent); animation: ndPulse 2s ease-in-out infinite; }

// TRUST
.nd-trust { background: #fff; border-bottom: 1px solid #EEF4EE; padding: 72px 0; }
.nd-trust__head { text-align: center; margin-bottom: 48px; }
.nd-trust__h2 { font-family: $font-serif; font-weight: 400; font-size: 38px; line-height: 1.12; letter-spacing: -.02em; color: $nd-text; margin-top: 12px; max-width: 24ch; margin-inline: auto; }
.nd-trust__grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 28px; max-width: 1280px; margin: 0 auto; padding: 0 48px; @include bp-1024 { grid-template-columns: 1fr 1fr; } }
.nd-trust__item { text-align: center; padding: 0 8px; }
.nd-trust__icon { width: 56px; height: 56px; border-radius: 16px; background: #EAF4EA; display: flex; align-items: center; justify-content: center; margin: 0 auto 18px; color: $nd-green; }
.nd-trust__title { font-size: 16.5px; font-weight: 700; color: $nd-text; margin-bottom: 8px; }
.nd-trust__desc { font-size: 14px; line-height: 1.6; color: $nd-text-muted; }

// HUB
.nd-hub { background: $nd-green-deepest; padding: 110px 0; overflow: hidden; }
.nd-hub__head { display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 20px; margin-bottom: 56px; max-width: 1280px; margin-inline: auto; padding: 0 48px; }
.nd-hub__h2 { font-family: $font-serif; font-weight: 300; font-size: 54px; line-height: 1.04; letter-spacing: -.025em; color: #fff; }
.nd-hub__sub { margin-top: 14px; font-size: 17px; color: rgba(165,214,167,.7); max-width: 48ch; }
.nd-hub__all { display: inline-flex; align-items: center; gap: 8px; color: $nd-green-light; text-decoration: none; font-weight: 700; font-size: 15px; border: 1px solid rgba(165,214,167,.25); padding: 13px 22px; border-radius: 12px; transition: .18s; &:hover { background: rgba(165,214,167,.08); } }
.nd-hub__grid { display: grid; grid-template-columns: 1fr 360px; gap: 20px; align-items: start; max-width: 1280px; margin-inline: auto; padding: 0 48px; @include bp-1024 { grid-template-columns: 1fr; } }
.nd-hub__featured {
  text-decoration: none; display: block; border-radius: 24px; overflow: hidden; background: rgba(255,255,255,.04);
  border: 1px solid rgba(255,255,255,.08); transition: .25s; min-height: 440px;
  &:hover { border-color: rgba(102,187,106,.4); transform: translateY(-3px); }
}
.nd-hub__featured-img { height: 260px; background: linear-gradient(140deg, $nd-green-dark, $nd-green, $nd-green-mid); position: relative; display: flex; align-items: flex-end; gap: 12px; padding: 0 28px 20px; }
.nd-hub__featured-cat { background: rgba(15,36,23,.7); backdrop-filter: blur(8px); color: $nd-green-light; font-size: 12px; font-weight: 700; padding: 6px 14px; border-radius: 999px; letter-spacing: .06em; }
.nd-hub__featured-read { color: rgba(165,214,167,.6); font-size: 13px; font-weight: 600; }
.nd-hub__featured-body { padding: 30px 30px 34px; h3 { font-family: $font-serif; font-size: 27px; font-weight: 500; line-height: 1.26; color: #fff; margin-bottom: 12px; letter-spacing: -.01em; } p { font-size: 15px; line-height: 1.65; color: #7A9A80; margin-bottom: 20px; } }
.nd-hub__featured-cta { color: $nd-green-mid; font-weight: 700; font-size: 14.5px; display: inline-flex; align-items: center; gap: 6px; }
.nd-hub__rest { display: flex; flex-direction: column; gap: 18px; }
.nd-hub__rest-item {
  text-decoration: none; display: flex; gap: 16px; background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08);
  border-radius: 18px; padding: 20px; transition: .22s; align-items: flex-start;
  &:hover { border-color: rgba(102,187,106,.35); background: rgba(255,255,255,.06); }
}
.nd-hub__rest-thumb { width: 62px; height: 62px; border-radius: 14px; flex: none; }
.nd-hub__rest-cat { font-size: 11px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: $nd-green-mid; display: block; margin-bottom: 6px; }
.nd-hub__rest-title { font-size: 15.5px; font-weight: 700; line-height: 1.34; color: #fff; margin-bottom: 6px; }
.nd-hub__rest-read { font-size: 12.5px; color: #5A7860; }

// TOPICS
.nd-topics { background: $nd-bg; padding: 104px 0; }
.nd-topics__head { text-align: center; margin-bottom: 52px; }
.nd-topics__h2 { font-family: $font-serif; font-weight: 300; font-size: 50px; line-height: 1.06; letter-spacing: -.025em; color: $nd-text; }
.nd-topics__grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; max-width: 1280px; margin-inline: auto; padding: 0 48px; @include bp-1024 { grid-template-columns: 1fr 1fr; } @include bp-640 { grid-template-columns: 1fr; } }
.nd-topics__card { text-decoration: none; background: #fff; border: 1px solid #EEF4EE; border-radius: 20px; padding: 30px; display: flex; flex-direction: column; gap: 14px; box-shadow: 0 4px 18px rgba(15,36,23,.04); color: $nd-text; h3 { font-size: 18px; font-weight: 700; color: $nd-text; margin-bottom: 6px; } p { font-size: 14px; line-height: 1.55; color: $nd-text-muted; } }
.nd-topics__icon { width: 50px; height: 50px; border-radius: 13px; background: #EAF4EA; display: flex; align-items: center; justify-content: center; color: $nd-green; }
.nd-topics__count { margin-top: auto; color: $nd-green; font-weight: 700; font-size: 13.5px; display: inline-flex; align-items: center; gap: 6px; }

// MYTH
.nd-myth { background: $nd-green-darkest; color: #fff; padding: 110px 0; overflow: hidden; position: relative; }
.nd-myth__glow { position: absolute; top: -80px; right: -80px; width: 380px; height: 380px; border-radius: 50%; background: radial-gradient(circle, rgba(46,125,50,.3) 0%, transparent 70%); }
.nd-myth__inner { max-width: 980px; margin: 0 auto; padding: 0 48px; position: relative; }
.nd-myth__head { text-align: center; margin-bottom: 52px; }
.nd-myth__h2 { font-family: $font-serif; font-weight: 300; font-size: 50px; line-height: 1.06; letter-spacing: -.025em; }
.nd-myth__sub { margin-top: 14px; font-size: 16.5px; color: rgba(165,214,167,.7); max-width: 50ch; margin-inline: auto; }
.nd-myth__list { display: flex; flex-direction: column; gap: 14px; }
.nd-myth__item { background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08); border-radius: 18px; padding: 24px 26px; cursor: pointer; transition: .22s; &:hover { background: rgba(255,255,255,.07); } &.open { border-color: rgba(102,187,106,.35); } }
.nd-myth__row { display: flex; align-items: center; gap: 16px; }
.nd-myth__tag { font-size: 11px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; color: #E88; background: rgba(220,80,80,.14); padding: 5px 11px; border-radius: 7px; flex: none; }
.nd-myth__claim { font-size: 17.5px; font-weight: 600; color: #fff; flex: 1; line-height: 1.4; }
.nd-myth__toggle { width: 30px; height: 30px; border-radius: 50%; border: 1px solid rgba(102,187,106,.4); display: flex; align-items: center; justify-content: center; color: $nd-green-mid; flex: none; font-size: 18px; transition: .2s; &.rotated { transform: rotate(45deg); } }
.nd-myth__answer { margin-top: 18px; padding-top: 18px; border-top: 1px solid rgba(255,255,255,.1); display: flex; gap: 14px; align-items: flex-start; p { font-size: 15.5px; line-height: 1.72; color: #D0E4D2; margin: 0; } }
.nd-myth__fact-tag { font-size: 11px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; color: $nd-green-light; background: rgba(102,187,106,.16); padding: 5px 11px; border-radius: 7px; flex: none; margin-top: 2px; }

// ABOUT TEASER
.nd-about-teaser { background: #fff; padding: 104px 0; overflow: hidden; }
.nd-about-teaser__grid { max-width: 1180px; margin: 0 auto; padding: 0 48px; display: grid; grid-template-columns: 380px 1fr; gap: 64px; align-items: center; @include bp-1024 { grid-template-columns: 1fr; } }
.nd-about-teaser__photo-wrap { position: relative; display: flex; justify-content: center; }
.nd-about-teaser__photo { width: 300px; height: 360px; border-radius: 24px; background: linear-gradient(150deg, #E8F4E9, #CDE7CF); display: flex; align-items: center; justify-content: center; overflow: hidden; box-shadow: 0 30px 70px rgba(27,94,32,.16); }
.nd-about-teaser__badge { position: absolute; bottom: 24px; right: -16px; background: $nd-green-darkest; color: #fff; border-radius: 16px; padding: 14px 18px; box-shadow: 0 18px 44px rgba(0,0,0,.22); }
.nd-about-teaser__badge-label { font-size: 10.5px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: $nd-green-mid; margin-bottom: 4px; }
.nd-about-teaser__badge-text { font-size: 13.5px; font-weight: 600; }
.nd-about-teaser__h2 { font-family: $font-serif; font-weight: 400; font-size: 42px; line-height: 1.1; letter-spacing: -.02em; color: $nd-text; margin-bottom: 20px; }
.nd-about-teaser__bio { font-size: 17px; line-height: 1.78; color: #445249; margin-bottom: 28px; max-width: 54ch; }
.nd-about-teaser__creds { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 32px; }
.nd-about-teaser__cred { display: inline-flex; align-items: center; gap: 8px; border: 1px solid $nd-border-green; background: $nd-bg; color: $nd-green-dark; font-size: 13.5px; font-weight: 600; padding: 10px 16px; border-radius: 999px; }
.nd-about-teaser__cta { display: inline-flex; align-items: center; gap: 10px; color: $nd-text; font-weight: 700; font-size: 16px; text-decoration: none; padding: 14px 26px; border: 2px solid $nd-text; border-radius: 14px; transition: .2s; &:hover { background: $nd-text; color: #fff; } }

// FOLLOW
.nd-follow { background: $nd-bg; padding: 90px 0; border-top: 1px solid #EEF4EE; }
.nd-follow__inner { max-width: 1080px; margin: 0 auto; padding: 0 48px; text-align: center; }
.nd-follow__h2 { font-family: $font-serif; font-weight: 300; font-size: 46px; line-height: 1.08; letter-spacing: -.025em; color: $nd-text; max-width: 18ch; margin: 0 auto 14px; }
.nd-follow__sub { font-size: 17px; color: $nd-text-muted; max-width: 50ch; margin: 0 auto 36px; }
.nd-follow__grid { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; }
.nd-follow__item { text-decoration: none; display: flex; align-items: center; gap: 11px; background: #fff; border: 1px solid $nd-border; border-radius: 14px; padding: 16px 22px; box-shadow: 0 4px 16px rgba(15,36,23,.04); color: $nd-text; }
.nd-follow__glyph { width: 38px; height: 38px; border-radius: 10px; background: #EAF4EA; color: $nd-green; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 17px; }
.nd-follow__platform { display: block; font-size: 11px; color: #8A9A8E; font-weight: 600; text-align: start; }
.nd-follow__handle { display: block; font-size: 14.5px; font-weight: 700; color: $nd-text; text-align: start; }

// PLAN CTA
.nd-plan-cta { background: $nd-green-deepest; overflow: hidden; position: relative; }
.nd-plan-cta__line { position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(102,187,106,.4), transparent); }
.nd-plan-cta__grid { max-width: 1180px; margin: 0 auto; padding: 72px 48px; display: grid; grid-template-columns: 1fr auto; gap: 40px; align-items: center; @include bp-1024 { grid-template-columns: 1fr; } }
.nd-plan-cta__h2 { font-family: $font-serif; font-weight: 300; font-size: 40px; line-height: 1.12; color: #fff; letter-spacing: -.02em; max-width: 20ch; }
.nd-plan-cta__sub { margin-top: 14px; font-size: 16.5px; color: rgba(165,214,167,.7); max-width: 52ch; line-height: 1.65; }
.nd-plan-cta__action { display: flex; flex-direction: column; gap: 12px; align-items: flex-start; }
.nd-plan-cta__btn { display: inline-flex; align-items: center; gap: 10px; background: rgba(255,255,255,.08); border: 1px solid rgba(165,214,167,.3); color: #fff; text-decoration: none; font-weight: 700; font-size: 16px; padding: 16px 30px; border-radius: 14px; white-space: nowrap; transition: .2s; &:hover { background: rgba(102,187,106,.16); border-color: $nd-green-mid; } }
.nd-plan-cta__note { font-size: 13px; color: rgba(122,154,128,.8); padding-inline-start: 4px; }
```

- [ ] **Step 4: Write a behavior test (myth accordion + lang switch)**

Create `frontend/src/app/pages/home/home.component.spec.ts`:

```ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  let fixture: ComponentFixture<HomeComponent>;
  let component: HomeComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders the English hero heading by default', () => {
    expect(fixture.nativeElement.textContent).toContain('Nutrition advice you can');
  });

  it('myths start closed and toggle open on click', () => {
    expect(component.isMythOpen(0)).toBe(false);
    component.toggleMyth(0);
    expect(component.isMythOpen(0)).toBe(true);
    component.toggleMyth(0);
    expect(component.isMythOpen(0)).toBe(false);
  });

  it('switching language updates hero copy to Arabic', () => {
    component['langService'].toggle();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('معلومات صحية');
  });
});
```

- [ ] **Step 5: Run the build and tests**

```bash
cd frontend
npx ng build
npx ng test --watch=false --browsers=ChromeHeadless
```

Expected: build succeeds (this is the first route in `app.routes.ts`, so the app now compiles end-to-end), and all `HomeComponent` specs pass.

- [ ] **Step 6: Manually verify in the browser**

```bash
npx ng serve
```

Open `http://localhost:4200/` — confirm hero, trust grid, knowledge hub, topics, myth accordion (click to expand), about teaser, follow grid, and plan CTA all render; click the nav's language button and confirm the whole page flips to Arabic/RTL.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/app/pages/home frontend/src/app/app.routes.ts
git commit -m "Add Home page"
```

---

## Task 7: About page

**Source:** `project/About.dc.html` (full file, 189 lines).

**Files:**
- Create: `frontend/src/app/pages/about/about.component.ts`
- Create: `frontend/src/app/pages/about/about.component.html`
- Create: `frontend/src/app/pages/about/about.component.scss`
- Create: `frontend/src/app/pages/about/about.component.spec.ts`

**Interfaces:**
- Consumes: `LangService`, `NavComponent`, `FooterComponent`.
- Produces: route `'about'` per Task 5.

- [ ] **Step 1: Write the component class** (data ported verbatim from `project/About.dc.html:144-184`)

Create `frontend/src/app/pages/about/about.component.ts`:

```ts
import { Component, computed, inject } from '@angular/core';
import { NavComponent } from '../../shared/nav/nav.component';
import { FooterComponent } from '../../shared/footer/footer.component';
import { LangService } from '../../core/lang.service';

interface Achievement { stat: string; text: string; }
interface Education { years: string; title: string; detail: string; }
interface Experience { period: string; role: string; org: string; }
interface Social { glyph: string; handle: string; href: string; }

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [NavComponent, FooterComponent],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss',
})
export class AboutComponent {
  private readonly langService = inject(LangService);
  readonly lang = this.langService.lang;
  readonly ar = computed(() => this.lang() === 'ar');

  readonly heroEyebrow = computed(() => (this.ar() ? 'تعرّف على خبيرك' : 'Meet your expert'));
  readonly name = computed(() => (this.ar() ? 'د. كريم الطاهر' : 'Dr. Karim Eltaher'));
  readonly title = computed(() => (this.ar() ? 'صيدلي إكلينيكي وخبير تغذية معتمد' : 'Clinical Pharmacist & Certified Nutrition Expert'));
  readonly credentials = computed<string[]>(() => this.ar()
    ? ['مرخّص من الهيئة السعودية (SCFHS)', 'خبير تغذية معتمد (المملكة المتحدة)', 'صيدلي إكلينيكي']
    : ['SCFHS Licensed', 'Certified Nutrition Expert (UK)', 'Clinical Pharmacist']);

  readonly summaryEyebrow = computed(() => (this.ar() ? 'نبذة' : 'Professional summary'));
  readonly summaryH2 = computed(() => (this.ar() ? 'علمٌ دقيق، رعايةٌ دافئة' : 'Precision Science, Warm Care'));
  readonly summary = computed(() => this.ar()
    ? 'يجمع د. كريم الطاهر بين خمس سنوات من الخبرة الإكلينيكية في الصيدلة وشهادة معتمدة في التغذية وإدارة السمنة من المملكة المتحدة. بصفته مؤسس نوتري دوك، يبني خططاً غذائية مبنية على الأدلة تأخذ في الاعتبار أدويتك وحالتك الصحية ونمط حياتك — لا حلولاً عامة، بل خططاً مصممة لك أنت.'
    : 'Dr. Karim Eltaher combines five years of clinical pharmacy experience with a certified qualification in Nutrition & Obesity Management from the UK. As the founder of NutriDoc, he builds evidence-based nutrition plans that account for your medications, medical conditions, and lifestyle — not generic templates, but plans designed for you.');

  readonly achH2 = computed(() => (this.ar() ? 'إنجازات رئيسية' : 'Key Achievements'));
  readonly achievements = computed<Achievement[]>(() => {
    const ar = this.ar();
    return [
      { stat: '20k+', text: ar ? 'مجتمع متنامٍ على تيك توك يثق بمحتواه التوعوي.' : 'A growing TikTok community trusting his educational content.' },
      { stat: '300k+', text: ar ? 'مشاهدة على يوتيوب لمحتوى تغذوي مبني على العلم.' : 'YouTube views on science-based nutrition content.' },
      { stat: '5+', text: ar ? 'سنوات من الخبرة الإكلينيكية بين الصيدلة والتغذية.' : 'Years of clinical experience across pharmacy and nutrition.' },
      { stat: '100s', text: ar ? 'من العملاء حققوا أهدافهم الصحية بخطط مخصصة.' : 'Of clients who reached their health goals with custom plans.' },
    ];
  });

  readonly eduEyebrow = computed(() => (this.ar() ? 'المؤهلات' : 'Credentials'));
  readonly eduH2 = computed(() => (this.ar() ? 'التعليم والشهادات' : 'Education & Certifications'));
  readonly education = computed<Education[]>(() => {
    const ar = this.ar();
    return [
      { years: '2015 – 2020', title: ar ? 'بكالوريوس الصيدلة الإكلينيكية' : 'Bachelor of Clinical Pharmacy', detail: ar ? 'جامعة القاهرة' : 'Cairo University' },
      { years: ar ? 'منذ نوفمبر ٢٠٢٢' : 'Since Nov 2022', title: ar ? 'ترخيص الهيئة السعودية للتخصصات الصحية' : 'SCFHS License', detail: 'No. 1401469300' },
      { years: ar ? 'منذ نوفمبر ٢٠٢٠' : 'Since Nov 2020', title: ar ? 'ترخيص وزارة الصحة المصرية' : 'MOH Egypt License', detail: 'No. 272226' },
      { years: '120 CH', title: ar ? 'التغذية وإدارة السمنة' : 'Nutrition & Obesity Management', detail: ar ? 'كلية ليدز للتدريب (المملكة المتحدة)' : 'Leeds Training College (UK)' },
    ];
  });

  readonly expEyebrow = computed(() => (this.ar() ? 'المسيرة المهنية' : 'Career'));
  readonly expH2 = computed(() => (this.ar() ? 'الخبرات العملية' : 'Work Experience'));
  readonly experience = computed<Experience[]>(() => {
    const ar = this.ar();
    return [
      { period: ar ? 'نوفمبر ٢٠٢٢ – الآن' : 'Nov 2022 – Present', role: ar ? 'صيدلي إكلينيكي' : 'Clinical Pharmacist', org: ar ? 'شركة ليمون الطبية' : 'Lemon Medical Company' },
      { period: ar ? 'يناير ٢٠٢١ – أكتوبر ٢٠٢٢' : 'Jan 2021 – Oct 2022', role: ar ? 'صيدلي' : 'Pharmacist', org: ar ? 'سلسلة صيدليات د. أسامة الطيبي' : 'Dr. Osama Altaieby Pharmacy Chain' },
      { period: ar ? '٢٠٢٠ – الآن' : '2020 – Present', role: ar ? 'المؤسس وخبير التغذية' : 'Founder & Nutrition Expert', org: 'NutriDoc' },
    ];
  });

  readonly skillsEyebrow = computed(() => (this.ar() ? 'المهارات' : 'Expertise'));
  readonly skillsH2 = computed(() => (this.ar() ? 'مجالات الخبرة' : 'Skills & Expertise'));
  readonly skills = computed<string[]>(() => this.ar()
    ? ['الصيدلة الإكلينيكية', 'تخطيط التغذية', 'إدارة الوزن', 'تفاعلات الدواء والغذاء', 'التغذية لمرضى الأمراض المزمنة', 'إدارة السمنة', 'التواصل والتثقيف', 'صناعة المحتوى', 'المتابعة والتحفيز']
    : ['Clinical Pharmacy', 'Nutrition Planning', 'Weight Management', 'Drug–Food Interactions', 'Disease-Specific Nutrition', 'Obesity Management', 'Patient Education', 'Content Creation', 'Coaching & Motivation']);

  readonly followH2 = computed(() => (this.ar() ? 'تابع نوتري دوك' : 'Follow NutriDoc'));
  readonly followSub = computed(() => (this.ar() ? 'نصائح يومية مبنية على العلم عبر منصاتك المفضلة.' : 'Daily science-based tips across your favorite platforms.'));
  readonly socials: Social[] = [
    { glyph: '⊚', handle: 'Instagram', href: 'https://instagram.com/dr.karimeltaher' },
    { glyph: '♪', handle: 'TikTok', href: 'https://tiktok.com/@dr.karimeltaher' },
    { glyph: '▶', handle: 'YouTube', href: 'https://youtube.com/@nutridoc' },
    { glyph: 'f', handle: 'Facebook', href: 'https://facebook.com/nutridoc' },
  ];
}
```

- [ ] **Step 2: Write the template** (structure ported from `project/About.dc.html:30-128`)

Create `frontend/src/app/pages/about/about.component.html`:

```html
<div class="nd-page">
  <app-nav active="about" />
  <main>
    <section class="nd-hero">
      <div class="nd-hero__grid">
        <div class="nd-hero__photo-wrap">
          <div class="nd-hero__photo">
            <svg width="110" height="110" viewBox="0 0 24 24" fill="#66BB6A"><circle cx="12" cy="8" r="4.2"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7z"/></svg>
          </div>
        </div>
        <div>
          <span class="nd-eyebrow">{{ heroEyebrow() }}</span>
          <h1 class="nd-h1">{{ name() }}</h1>
          <p class="nd-hero__role">{{ title() }}</p>
          <div class="nd-hero__creds">
            @for (c of credentials(); track c) {
              <span class="nd-hero__cred"><span class="nd-hero__check">✓</span>{{ c }}</span>
            }
          </div>
        </div>
      </div>
    </section>

    <section class="nd-summary">
      <span class="nd-eyebrow">{{ summaryEyebrow() }}</span>
      <h2 class="nd-summary__h2">{{ summaryH2() }}</h2>
      <p class="nd-summary__text">{{ summary() }}</p>
    </section>

    <section class="nd-ach">
      <div class="nd-ach__inner">
        <h2 class="nd-ach__h2">{{ achH2() }}</h2>
        <div class="nd-ach__grid">
          @for (a of achievements(); track a.text) {
            <div class="nd-ach__item">
              <span class="nd-ach__stat">{{ a.stat }}</span>
              <p>{{ a.text }}</p>
            </div>
          }
        </div>
      </div>
    </section>

    <section class="nd-edu">
      <span class="nd-eyebrow">{{ eduEyebrow() }}</span>
      <h2 class="nd-edu__h2">{{ eduH2() }}</h2>
      <div class="nd-edu__grid">
        @for (e of education(); track e.title) {
          <div class="nd-edu__card">
            <div class="nd-edu__years">{{ e.years }}</div>
            <h3>{{ e.title }}</h3>
            <p>{{ e.detail }}</p>
          </div>
        }
      </div>
    </section>

    <section class="nd-exp">
      <div class="nd-exp__inner">
        <span class="nd-eyebrow">{{ expEyebrow() }}</span>
        <h2 class="nd-exp__h2">{{ expH2() }}</h2>
        <div class="nd-exp__timeline">
          @for (x of experience(); track x.role) {
            <div class="nd-exp__item">
              <span class="nd-exp__dot"></span>
              <div class="nd-exp__period">{{ x.period }}</div>
              <h3>{{ x.role }}</h3>
              <div class="nd-exp__org">{{ x.org }}</div>
            </div>
          }
        </div>
      </div>
    </section>

    <section class="nd-skills">
      <span class="nd-eyebrow">{{ skillsEyebrow() }}</span>
      <h2 class="nd-skills__h2">{{ skillsH2() }}</h2>
      <div class="nd-skills__grid">
        @for (s of skills(); track s) {
          <div class="nd-skills__item"><span class="nd-skills__bullet"></span>{{ s }}</div>
        }
      </div>
    </section>

    <section class="nd-social-cta">
      <div class="nd-social-cta__inner">
        <h2>{{ followH2() }}</h2>
        <p>{{ followSub() }}</p>
        <div class="nd-social-cta__grid">
          @for (s of socials; track s.handle) {
            <a [href]="s.href" target="_blank" rel="noopener" class="nd-social-cta__item"><span>{{ s.glyph }}</span>{{ s.handle }}</a>
          }
        </div>
      </div>
    </section>
  </main>
  <app-footer />
</div>
```

- [ ] **Step 3: Write the SCSS** (values ported from `project/About.dc.html:20-24,31-128`)

Create `frontend/src/app/pages/about/about.component.scss`:

```scss
@import '../../../styles/tokens';

.nd-page { font-family: $font-body; color: $nd-text; background: #fff; overflow-x: hidden; }
.nd-eyebrow { font-size: 13px; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; color: $nd-green; }
.nd-h1 { font-family: $font-serif; font-weight: 500; font-size: 50px; line-height: 1.08; margin: 12px 0 8px; letter-spacing: -.02em; @include bp-880 { font-size: 42px; } @include bp-560 { font-size: 34px; } }

.nd-hero { background: $nd-bg-soft; border-bottom: 1px solid $nd-border-soft; }
.nd-hero__grid {
  max-width: 1100px; margin: 0 auto; padding: 80px 28px; display: grid; grid-template-columns: 300px 1fr; gap: 56px; align-items: center;
  @include bp-880 { grid-template-columns: 1fr; text-align: center; }
}
.nd-hero__photo-wrap { display: flex; justify-content: center; }
.nd-hero__photo { width: 260px; height: 260px; border-radius: 50%; border: 6px solid $nd-green-light; background: linear-gradient(150deg, #E8F4E9, #CDE7CF); display: flex; align-items: center; justify-content: center; box-shadow: 0 20px 50px rgba(27,94,32,.16); }
.nd-hero__role { font-size: 19px; color: $nd-green; font-weight: 600; margin: 0 0 22px; }
.nd-hero__creds { display: flex; flex-wrap: wrap; gap: 10px; @include bp-880 { justify-content: center; } }
.nd-hero__cred { display: inline-flex; align-items: center; gap: 7px; background: #fff; border: 1px solid $nd-border-green; color: $nd-green-dark; font-size: 13.5px; font-weight: 600; padding: 9px 15px; border-radius: 999px; }
.nd-hero__check { color: $nd-green; }

.nd-summary { max-width: 820px; margin: 0 auto; padding: 80px 28px 60px; }
.nd-summary__h2 { font-family: $font-serif; font-weight: 500; font-size: 36px; margin: 12px 0 20px; letter-spacing: -.02em; }
.nd-summary__text { font-size: 18px; line-height: 1.8; color: #445249; margin: 0; }

.nd-ach { background: $nd-green-darkest; color: #fff; }
.nd-ach__inner { max-width: 1100px; margin: 0 auto; padding: 84px 28px; }
.nd-ach__h2 { font-family: $font-serif; font-weight: 500; font-size: 36px; margin: 0 0 44px; letter-spacing: -.02em; }
.nd-ach__grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; @include bp-880 { grid-template-columns: 1fr; } }
.nd-ach__item { display: flex; gap: 18px; align-items: flex-start; background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.09); border-radius: 16px; padding: 24px; }
.nd-ach__stat { font-family: $font-serif; font-size: 30px; color: $nd-green-mid; font-weight: 600; flex: none; line-height: 1; }
.nd-ach__item p { margin: 0; font-size: 15.5px; line-height: 1.6; color: #C7DACA; }

.nd-edu { max-width: 1100px; margin: 0 auto; padding: 84px 28px; }
.nd-edu__h2 { font-family: $font-serif; font-weight: 500; font-size: 36px; margin: 12px 0 36px; letter-spacing: -.02em; }
.nd-edu__grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; @include bp-880 { grid-template-columns: 1fr; } }
.nd-edu__card { border: 1px solid $nd-border; border-radius: 16px; padding: 26px; background: $nd-bg-soft; }
.nd-edu__years { font-size: 13px; color: $nd-text-faint; font-weight: 600; margin-bottom: 6px; }
.nd-edu__card h3 { font-size: 18px; font-weight: 700; margin: 0 0 6px; color: $nd-text; }
.nd-edu__card p { margin: 0; font-size: 14.5px; color: $nd-text-muted; line-height: 1.6; }

.nd-exp { background: $nd-bg-soft; border-top: 1px solid $nd-border-soft; }
.nd-exp__inner { max-width: 820px; margin: 0 auto; padding: 84px 28px; }
.nd-exp__h2 { font-family: $font-serif; font-weight: 500; font-size: 36px; margin: 12px 0 40px; letter-spacing: -.02em; }
.nd-exp__timeline { display: flex; flex-direction: column; border-inline-start: 2px solid $nd-border-green; padding-inline-start: 28px; }
.nd-exp__item { position: relative; padding-bottom: 34px; }
.nd-exp__dot { position: absolute; inset-inline-start: -37px; top: 4px; width: 16px; height: 16px; border-radius: 50%; background: $nd-green; border: 3px solid #fff; box-shadow: 0 0 0 2px $nd-border-green; }
.nd-exp__period { font-size: 13px; color: $nd-green; font-weight: 700; margin-bottom: 4px; }
.nd-exp__item h3 { font-size: 19px; font-weight: 700; margin: 0 0 4px; }
.nd-exp__org { font-size: 15px; color: $nd-text-muted; }

.nd-skills { max-width: 1100px; margin: 0 auto; padding: 84px 28px; }
.nd-skills__h2 { font-family: $font-serif; font-weight: 500; font-size: 36px; margin: 12px 0 32px; letter-spacing: -.02em; }
.nd-skills__grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; @include bp-560 { grid-template-columns: 1fr 1fr; } }
.nd-skills__item { display: flex; align-items: center; gap: 10px; border: 1px solid $nd-border; border-radius: 12px; padding: 16px 18px; font-size: 15px; font-weight: 600; color: #2C3A30; }
.nd-skills__bullet { width: 8px; height: 8px; border-radius: 50%; background: $nd-green-mid; flex: none; }

.nd-social-cta { background: linear-gradient(120deg, $nd-green-dark, $nd-green); }
.nd-social-cta__inner { max-width: 820px; margin: 0 auto; padding: 72px 28px; text-align: center; h2 { font-family: $font-serif; font-weight: 500; font-size: 38px; color: #fff; margin: 0 0 14px; letter-spacing: -.02em; } p { font-size: 17px; color: #D6E8D8; margin: 0 0 28px; } }
.nd-social-cta__grid { display: flex; gap: 20px; justify-content: center; flex-wrap: wrap; }
.nd-social-cta__item { color: #fff; text-decoration: none; font-weight: 700; font-size: 15px; display: flex; flex-direction: column; align-items: center; gap: 6px; span { font-size: 22px; } }
```

- [ ] **Step 4: Write a smoke test**

Create `frontend/src/app/pages/about/about.component.spec.ts`:

```ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AboutComponent } from './about.component';

describe('AboutComponent', () => {
  let fixture: ComponentFixture<AboutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AboutComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(AboutComponent);
    fixture.detectChanges();
  });

  it('renders Dr. Karim\'s name and all four achievement stats', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Dr. Karim Eltaher');
    expect(text).toContain('20k+');
    expect(text).toContain('300k+');
    expect(text).toContain('5+');
    expect(text).toContain('100s');
  });
});
```

- [ ] **Step 5: Run build and tests**

```bash
cd frontend
npx ng build
npx ng test --watch=false --browsers=ChromeHeadless
```

Expected: build succeeds, `AboutComponent` specs pass.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/app/pages/about
git commit -m "Add About page"
```

---

## Task 8: Services page

**Source:** `project/Services.dc.html` (full file, 112 lines).

**Files:**
- Create: `frontend/src/app/pages/services/services.component.ts`
- Create: `frontend/src/app/pages/services/services.component.html`
- Create: `frontend/src/app/pages/services/services.component.scss`
- Create: `frontend/src/app/pages/services/services.component.spec.ts`

**Interfaces:**
- Consumes: `LangService`, `NavComponent`, `FooterComponent`.
- Produces: route `'services'` per Task 5.

- [ ] **Step 1: Write the component class** (data ported verbatim from `project/Services.dc.html:80-106`)

Create `frontend/src/app/pages/services/services.component.ts`:

```ts
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavComponent } from '../../shared/nav/nav.component';
import { FooterComponent } from '../../shared/footer/footer.component';
import { LangService } from '../../core/lang.service';

interface Service {
  key: 'plan' | 'weight' | 'clinical' | 'drug' | 'sport' | 'online';
  featured: boolean;
  title: string;
  desc: string;
}

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [RouterLink, NavComponent, FooterComponent],
  templateUrl: './services.component.html',
  styleUrl: './services.component.scss',
})
export class ServicesComponent {
  private readonly langService = inject(LangService);
  readonly lang = this.langService.lang;
  readonly ar = computed(() => this.lang() === 'ar');

  readonly eyebrow = computed(() => (this.ar() ? 'الخدمات' : 'What we offer'));
  readonly h1 = computed(() => (this.ar() ? 'خدمات تغذية مبنية على العلم' : 'Nutrition Services, Backed by Science'));
  readonly intro = computed(() => this.ar()
    ? 'من الخطط المخصصة إلى مراجعة تفاعل الأدوية مع الغذاء — خدمات تجمع بين خبرة الصيدلة الإكلينيكية وعلم التغذية الحديث.'
    : 'From personalized plans to medication–diet reviews — services that combine clinical-pharmacy expertise with modern nutrition science.');
  readonly uniqueLabel = computed(() => (this.ar() ? 'خدمة فريدة' : 'Unique to NutriDoc'));

  readonly services = computed<Service[]>(() => {
    const ar = this.ar();
    return [
      { key: 'plan', featured: false, title: ar ? 'خطط تغذية مخصصة' : 'Personalized Nutrition Plans', desc: ar ? 'خطط وجبات مخصصة مبنية على جسمك وأهدافك ونمط حياتك — لا حلولاً جاهزة للجميع.' : 'Custom meal plans built around your body, goals, and lifestyle — not a one-size-fits-all template.' },
      { key: 'weight', featured: false, title: ar ? 'برنامج إدارة الوزن' : 'Weight Management Program', desc: ar ? 'بروتوكولات مبنية على الأدلة لفقدان وزن مستدام وبناء عضلات — بلا حميات قاسية.' : 'Evidence-based protocols for sustainable weight loss and lean muscle gain — without crash diets.' },
      { key: 'clinical', featured: false, title: ar ? 'استشارات التغذية الإكلينيكية' : 'Clinical Nutrition Counseling', desc: ar ? 'دعم تغذوي للحالات المزمنة — السكري، الضغط، تكيس المبايض — مدعوم بخبرة صيدلانية.' : 'Nutrition support for chronic conditions — diabetes, hypertension, PCOS — backed by pharmacy expertise.' },
      { key: 'drug', featured: true, title: ar ? 'مراجعة تفاعل الدواء والغذاء' : 'Drug–Nutrition Interaction Review', desc: ar ? 'خدمة فريدة تستخدم خبرة الصيدلة الإكلينيكية لفحص تأثير أدويتك على نظامك الغذائي والعكس.' : 'A unique service using clinical pharmacy expertise to check how your medications affect your diet — and vice versa.' },
      { key: 'sport', featured: false, title: ar ? 'تغذية رياضية' : 'Sports Nutrition', desc: ar ? 'تغذية موجهة للأداء للرياضيين والأشخاص النشطين الراغبين في تدريب وتعافٍ أذكى.' : 'Performance-focused nutrition for athletes and active individuals who want to train and recover smarter.' },
      { key: 'online', featured: false, title: ar ? 'استشارة عن بُعد' : 'Online Consultation', desc: ar ? 'جلسات استشارية مرنة عبر الفيديو أو واتساب — إرشاد متخصص من أي مكان في المملكة.' : 'Flexible video or WhatsApp consultation sessions — get expert guidance from anywhere in the Kingdom.' },
    ];
  });

  readonly ctaH2 = computed(() => (this.ar() ? 'لست متأكداً أي خدمة تناسبك؟' : 'Not Sure Which Service Fits?'));
  readonly ctaSub = computed(() => (this.ar() ? 'ابدأ بخطة، أو تواصل مع د. كريم مباشرة لتحديد ما يناسبك.' : 'Start with a plan, or contact Dr. Karim directly to find your best fit.'));
  readonly ctaBtn1 = computed(() => (this.ar() ? 'استعرض الخطط' : 'View Plans'));
  readonly ctaBtn2 = computed(() => (this.ar() ? 'تواصل معنا' : 'Contact Us'));
}
```

- [ ] **Step 2: Write the template** (structure ported from `project/Services.dc.html:27-59`)

Create `frontend/src/app/pages/services/services.component.html`:

```html
<div class="nd-page">
  <app-nav active="services" />
  <main>
    <section class="nd-hero">
      <div class="nd-hero__inner">
        <span class="nd-eyebrow">{{ eyebrow() }}</span>
        <h1 class="nd-h1">{{ h1() }}</h1>
        <p class="nd-hero__intro">{{ intro() }}</p>
      </div>
    </section>

    <section class="nd-grid-sec">
      <div class="nd-grid">
        @for (s of services(); track s.key) {
          <div class="nd-card" [class.featured]="s.featured">
            @if (s.featured) {
              <span class="nd-card__badge">{{ uniqueLabel() }}</span>
            }
            <div class="nd-card__icon">
              @switch (s.key) {
                @case ('plan') { <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 2h6a2 2 0 0 1 2 2v0H7v0a2 2 0 0 1 2-2z"/><rect x="5" y="4" width="14" height="18" rx="2"/><path d="M9 10h6M9 14h6M9 18h3"/></svg> }
                @case ('weight') { <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3a9 9 0 1 0 9 9"/><path d="M21 3l-9 9"/></svg> }
                @case ('clinical') { <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2l8 4v6c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V6z"/><path d="M12 8v6M9 11h6"/></svg> }
                @case ('drug') { <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="9" width="18" height="6" rx="3" transform="rotate(45 12 12)"/><path d="M9 9l6 6"/></svg> }
                @case ('sport') { <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6.5 6.5l11 11M4 9l2-2M9 4l-2 2M15 20l2-2M20 15l-2 2M7 7l-3 3M17 17l-3 3"/></svg> }
                @case ('online') { <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="4" width="14" height="11" rx="2"/><path d="M16 8l6-3v9l-6-3z"/></svg> }
              }
            </div>
            <h3>{{ s.title }}</h3>
            <p>{{ s.desc }}</p>
          </div>
        }
      </div>
    </section>

    <section class="nd-cta">
      <div class="nd-cta__inner">
        <h2>{{ ctaH2() }}</h2>
        <p>{{ ctaSub() }}</p>
        <div class="nd-cta__actions">
          <a routerLink="/subscription" class="nd-cta__btn1">{{ ctaBtn1() }}</a>
          <a routerLink="/contact" class="nd-cta__btn2">{{ ctaBtn2() }}</a>
        </div>
      </div>
    </section>
  </main>
  <app-footer />
</div>
```

- [ ] **Step 3: Write the SCSS** (values ported from `project/Services.dc.html:19-22,27-59`)

Create `frontend/src/app/pages/services/services.component.scss`:

```scss
@import '../../../styles/tokens';

.nd-page { font-family: $font-body; color: $nd-text; background: #fff; overflow-x: hidden; }
.nd-eyebrow { font-size: 13px; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; color: $nd-green; }
.nd-h1 { font-family: $font-serif; font-weight: 500; font-size: 52px; line-height: 1.08; margin: 14px 0 16px; letter-spacing: -.02em; @include bp-880 { font-size: 42px; } @include bp-560 { font-size: 34px; } }

.nd-hero { background: $nd-bg-soft; border-bottom: 1px solid $nd-border-soft; }
.nd-hero__inner { max-width: 820px; margin: 0 auto; padding: 84px 28px 76px; text-align: center; @include bp-560 { padding-left: 20px; padding-right: 20px; } }
.nd-hero__intro { font-size: 18px; line-height: 1.7; color: $nd-text-muted; margin: 0 auto; max-width: 56ch; }

.nd-grid-sec { max-width: 1180px; margin: 0 auto; padding: 84px 28px; @include bp-560 { padding-left: 20px; padding-right: 20px; } }
.nd-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; @include bp-880 { grid-template-columns: 1fr; } }
.nd-card {
  border: 1px solid $nd-border; border-radius: 20px; padding: 32px 30px; background: #fff;
  box-shadow: 0 4px 18px rgba(15,36,23,.04);
  h3 { font-size: 21px; font-weight: 700; margin: 0 0 10px; color: $nd-text; }
  p { font-size: 15px; line-height: 1.7; margin: 0; color: $nd-text-muted; }
  &.featured {
    border: 2px solid $nd-green; background: $nd-green-darkest;
    h3 { color: #fff; }
    p { color: #9DB6A2; }
  }
}
.nd-card__badge { display: inline-block; background: $nd-green-light; color: $nd-green-dark; font-size: 11px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; padding: 5px 11px; border-radius: 999px; margin-bottom: 16px; }
.nd-card__icon { width: 54px; height: 54px; border-radius: 14px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; background: #EAF4EA; color: $nd-green; }
.nd-card.featured .nd-card__icon { background: rgba(165,214,167,.18); color: $nd-green-light; }

.nd-cta { background: linear-gradient(120deg, $nd-green-dark, $nd-green); }
.nd-cta__inner { max-width: 820px; margin: 0 auto; padding: 80px 28px; text-align: center; h2 { font-family: $font-serif; font-weight: 500; font-size: 42px; color: #fff; margin: 0 0 14px; letter-spacing: -.02em; } p { font-size: 18px; color: #D6E8D8; margin: 0 0 30px; } }
.nd-cta__actions { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; }
.nd-cta__btn1 { background: #fff; color: $nd-green-dark; text-decoration: none; font-weight: 700; font-size: 16px; padding: 16px 30px; border-radius: 999px; &:hover { background: #EAF4EA; } }
.nd-cta__btn2 { border: 1.5px solid rgba(255,255,255,.5); color: #fff; text-decoration: none; font-weight: 700; font-size: 16px; padding: 16px 30px; border-radius: 999px; &:hover { background: rgba(255,255,255,.12); } }
```

- [ ] **Step 4: Write a smoke test**

Create `frontend/src/app/pages/services/services.component.spec.ts`:

```ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ServicesComponent } from './services.component';

describe('ServicesComponent', () => {
  let fixture: ComponentFixture<ServicesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServicesComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(ServicesComponent);
    fixture.detectChanges();
  });

  it('renders all six services with the featured badge on Drug–Nutrition Review', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Personalized Nutrition Plans');
    expect(text).toContain('Drug–Nutrition Interaction Review');
    expect(text).toContain('Unique to NutriDoc');
  });
});
```

- [ ] **Step 5: Run build and tests**

```bash
cd frontend
npx ng build
npx ng test --watch=false --browsers=ChromeHeadless
```

Expected: build succeeds, `ServicesComponent` specs pass.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/app/pages/services
git commit -m "Add Services page"
```

---

## Task 9: Subscription page

**Source:** `project/Subscription.dc.html` (full file, 252 lines).

**Files:**
- Create: `frontend/src/app/pages/subscription/subscription.component.ts`
- Create: `frontend/src/app/pages/subscription/subscription.component.html`
- Create: `frontend/src/app/pages/subscription/subscription.component.scss`
- Create: `frontend/src/app/pages/subscription/subscription.component.spec.ts`

**Interfaces:**
- Consumes: `LangService`, `LeadsService.submitPlanRequest(payload: PlanRequestPayload)` (Task 2), `NavComponent`, `FooterComponent`.
- Produces: route `'subscription'` per Task 5.

This page uses plain signals for form state (mirroring the prototype's `setState` pattern) rather than `ReactiveFormsModule`, since the validation rules are simple per-field checks identical to the prototype's `validateStep()` (`project/Subscription.dc.html:150-167`).

- [ ] **Step 1: Write the component class** (logic ported from `project/Subscription.dc.html:144-247`)

Create `frontend/src/app/pages/subscription/subscription.component.ts`:

```ts
import { Component, computed, inject, signal } from '@angular/core';
import { NavComponent } from '../../shared/nav/nav.component';
import { FooterComponent } from '../../shared/footer/footer.component';
import { LangService } from '../../core/lang.service';
import { LeadsService } from '../../core/leads.service';

interface FormState {
  fullName: string; email: string; phone: string; age: string; gender: string;
  height: string; currentWeight: string; targetWeight: string;
  goal: string; activity: string;
  medical: string; allergies: string; medications: string; agree: boolean;
}

type PlanKey = 'basic' | 'pro' | 'premium';

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

@Component({
  selector: 'app-subscription',
  standalone: true,
  imports: [NavComponent, FooterComponent],
  templateUrl: './subscription.component.html',
  styleUrl: './subscription.component.scss',
})
export class SubscriptionComponent {
  private readonly langService = inject(LangService);
  private readonly leadsService = inject(LeadsService);
  readonly lang = this.langService.lang;
  readonly ar = computed(() => this.lang() === 'ar');

  readonly selected = signal<PlanKey>('pro');
  readonly step = signal<1 | 2 | 3>(1);
  readonly submitted = signal(false);
  readonly submitting = signal(false);
  readonly errors = signal<Record<string, string>>({});
  readonly form = signal<FormState>({
    fullName: '', email: '', phone: '', age: '', gender: '',
    height: '', currentWeight: '', targetWeight: '',
    goal: 'lose_weight', activity: 'moderate',
    medical: '', allergies: '', medications: '', agree: false,
  });

  setField<K extends keyof FormState>(key: K, value: FormState[K]): void {
    this.form.update((f) => ({ ...f, [key]: value }));
    this.errors.update((e) => {
      const next = { ...e };
      delete next[key];
      return next;
    });
  }

  selectPlan(key: PlanKey): void {
    this.selected.set(key);
  }

  private validateStep(): boolean {
    const ar = this.ar();
    const f = this.form();
    const e: Record<string, string> = {};
    const req = ar ? 'هذا الحقل مطلوب' : 'This field is required';

    if (this.step() === 1) {
      if (!f.fullName.trim()) e['fullName'] = req;
      if (!f.email.trim()) e['email'] = req;
      else if (!EMAIL_RE.test(f.email)) e['email'] = ar ? 'بريد إلكتروني غير صحيح' : 'Invalid email address';
      if (!f.phone.trim()) e['phone'] = req;
      if (!String(f.age).trim()) e['age'] = req;
      else if (Number(f.age) < 18) e['age'] = ar ? 'يجب أن يكون العمر ١٨ أو أكثر' : 'Must be 18 or older';
    }
    if (this.step() === 2) {
      if (!String(f.height).trim()) e['height'] = req;
      if (!String(f.currentWeight).trim()) e['currentWeight'] = req;
      if (!String(f.targetWeight).trim()) e['targetWeight'] = req;
    }
    if (this.step() === 3) {
      if (!f.agree) e['agree'] = ar ? 'يجب الموافقة على الشروط للمتابعة' : 'You must agree to the terms to continue';
    }
    this.errors.set(e);
    return Object.keys(e).length === 0;
  }

  goNext(): void {
    if (!this.validateStep()) return;
    if (this.step() < 3) {
      this.step.set((this.step() + 1) as 1 | 2 | 3);
      return;
    }
    this.submitting.set(true);
    const f = this.form();
    const detailLines = [
      `Age: ${f.age}`, `Gender: ${f.gender}`,
      `Height: ${f.height} cm`, `Current weight: ${f.currentWeight} kg`, `Target weight: ${f.targetWeight} kg`,
      `Goal: ${f.goal}`, `Activity: ${f.activity}`,
      `Medical conditions: ${f.medical || '-'}`, `Allergies: ${f.allergies || '-'}`, `Medications: ${f.medications || '-'}`,
    ].join('\n');
    this.leadsService.submitPlanRequest({
      name: f.fullName, email: f.email, phone: f.phone, plan: this.selected(),
      message: detailLines,
    }).subscribe({
      next: () => { this.submitting.set(false); this.submitted.set(true); },
      error: () => { this.submitting.set(false); this.submitted.set(true); },
    });
  }

  goBack(): void {
    this.step.set(Math.max(1, this.step() - 1) as 1 | 2 | 3);
    this.errors.set({});
  }

  readonly planMeta = computed(() => {
    const ar = this.ar();
    return [
      { key: 'basic' as PlanKey, popular: false, accent: 'basic', name: ar ? 'أساسي' : 'Basic', price: ar ? '٩٩' : '99' },
      { key: 'pro' as PlanKey, popular: true, accent: 'pro', name: ar ? 'برو' : 'Pro', price: ar ? '١٩٩' : '199' },
      { key: 'premium' as PlanKey, popular: false, accent: 'premium', name: ar ? 'بريميوم' : 'Premium', price: ar ? '٣٤٩' : '349' },
    ];
  });

  private readonly featDefs = [
    { en: 'Custom meal plan', ar: 'خطة وجبات مخصصة', b: true, p: true, pr: true },
    { en: 'WhatsApp follow-up', ar: 'متابعة عبر واتساب', b: false, p: true, pr: true },
    { en: 'Supplement guide', ar: 'دليل المكملات', b: false, p: true, pr: true },
    { en: 'Monthly check-in call', ar: 'مكالمة متابعة شهرية', b: false, p: false, pr: true },
    { en: 'Drug–nutrition review', ar: 'مراجعة الدواء والغذاء', b: false, p: false, pr: true },
  ];

  features(planKey: PlanKey) {
    const ar = this.ar();
    const fld = planKey === 'basic' ? 'b' : planKey === 'pro' ? 'p' : 'pr';
    return this.featDefs.map((fd) => {
      const inc = (fd as any)[fld] as boolean;
      return { label: ar ? fd.ar : fd.en, included: inc };
    });
  }

  readonly period = computed(() => (this.ar() ? 'ريال/شهر' : 'SAR/mo'));
  readonly popularLabel = computed(() => (this.ar() ? 'الأكثر شيوعاً' : 'MOST POPULAR'));
  readonly selectedPlanName = computed(() => this.planMeta().find((p) => p.key === this.selected())!.name);
  readonly selectedNote = computed(() => (this.ar() ? 'الخطة المختارة: ' : 'Selected plan: ') + this.selectedPlanName());

  readonly eyebrow = computed(() => (this.ar() ? 'الاشتراك' : 'Your plan'));
  readonly h1 = computed(() => (this.ar() ? 'احصل على خطة تغذيتك المخصصة' : 'Get Your Personalized Nutrition Plan'));
  readonly intro = computed(() => this.ar()
    ? 'اختر خطتك، أخبرنا عن جسمك وأهدافك، وسيصمم د. كريم خطة مبنية على العلم خصيصاً لك.'
    : "Choose your plan, tell us about your body and goals, and Dr. Karim will craft a science-backed plan just for you.");

  readonly stepLabels = computed(() => this.ar()
    ? ['البيانات الشخصية', 'الجسم والأهداف', 'الطبية والتأكيد']
    : ['Your details', 'Body & goals', 'Medical & confirm']);

  readonly step1Title = computed(() => (this.ar() ? 'بياناتك الشخصية' : 'Your Details'));
  readonly step2Title = computed(() => (this.ar() ? 'جسمك وأهدافك' : 'Body & Goals'));
  readonly step3Title = computed(() => (this.ar() ? 'معلومات طبية' : 'Medical Information'));
  readonly step3Sub = computed(() => this.ar()
    ? 'خلفية د. كريم في الصيدلة تجعل هذه المعلومات قيّمة جداً لخطتك.'
    : "Dr. Karim's pharmacy background makes this information especially valuable for your plan.");

  readonly L = computed(() => {
    const ar = this.ar();
    return {
      fullName: ar ? 'الاسم الكامل' : 'Full name', email: ar ? 'البريد الإلكتروني' : 'Email', phone: ar ? 'رقم الجوال' : 'Phone', age: ar ? 'العمر' : 'Age', gender: ar ? 'الجنس' : 'Gender',
      height: ar ? 'الطول (سم)' : 'Height (cm)', currentWeight: ar ? 'الوزن الحالي (كجم)' : 'Current weight (kg)', targetWeight: ar ? 'الوزن المستهدف (كجم)' : 'Target weight (kg)',
      goal: ar ? 'الهدف' : 'Goal', activity: ar ? 'مستوى النشاط' : 'Activity level',
      medical: ar ? 'حالات طبية (اختياري)' : 'Medical conditions (optional)', allergies: ar ? 'حساسية غذائية (اختياري)' : 'Allergies (optional)',
      medications: ar ? 'الأدوية الحالية' : 'Current medications', medsHint: ar ? '(موصى به)' : '(recommended)',
      agree: ar ? 'أوافق على شروط الخدمة وسياسة الخصوصية الخاصة بنوتري دوك.' : "I agree to NutriDoc's terms of service and privacy policy.",
    };
  });

  readonly genderOpts = computed(() => {
    const ar = this.ar();
    return [{ v: 'male', label: ar ? 'ذكر' : 'Male' }, { v: 'female', label: ar ? 'أنثى' : 'Female' }];
  });
  readonly goalOpts = computed(() => {
    const ar = this.ar();
    return [
      { v: 'lose_weight', label: ar ? 'فقدان الوزن' : 'Lose weight' },
      { v: 'gain_muscle', label: ar ? 'بناء العضلات' : 'Gain muscle' },
      { v: 'maintain', label: ar ? 'المحافظة' : 'Maintain' },
      { v: 'medical', label: ar ? 'حالة طبية' : 'Medical / condition' },
    ];
  });
  readonly activityOpts = computed(() => {
    const ar = this.ar();
    return [
      { v: 'sedentary', label: ar ? 'خامل' : 'Sedentary' },
      { v: 'light', label: ar ? 'نشاط خفيف' : 'Lightly active' },
      { v: 'moderate', label: ar ? 'نشاط متوسط' : 'Moderately active' },
      { v: 'active', label: ar ? 'نشط' : 'Active' },
      { v: 'very_active', label: ar ? 'نشط جداً' : 'Very active' },
    ];
  });

  readonly nextLabel = computed(() => (this.step() === 3 ? (this.ar() ? 'إرسال الطلب' : 'Submit Request') : (this.ar() ? 'التالي' : 'Next')));
  readonly backLabel = computed(() => (this.ar() ? 'رجوع' : 'Back'));

  readonly successTitle = computed(() => (this.ar() ? 'تم استلام طلبك!' : 'Request Received!'));
  readonly successText = computed(() => this.ar()
    ? 'شكراً لك! سيراجع د. كريم بياناتك ويتواصل معك لتصميم خطتك. يمكنك التواصل معه مباشرة الآن عبر واتساب.'
    : 'Thank you! Dr. Karim will review your details and reach out to craft your plan. You can also message him directly now on WhatsApp.');
  readonly successBtn = computed(() => (this.ar() ? 'تواصل مع د. كريم' : 'Message Dr. Karim'));
  readonly waLink = computed(() => {
    const ar = this.ar();
    const text = ar ? `مرحباً د. كريم، اشتركت في خطة ${this.selectedPlanName()}` : `Hi Dr. Karim, I just subscribed to the ${this.selectedPlanName()} plan`;
    return `https://wa.me/966549930730?text=${encodeURIComponent(text)}`;
  });
}
```

- [ ] **Step 2: Write the template** (structure ported from `project/Subscription.dc.html:27-138`)

Create `frontend/src/app/pages/subscription/subscription.component.html`:

```html
<div class="nd-page">
  <app-nav active="services" />
  <main>
    <section class="nd-hero">
      <div class="nd-hero__inner">
        <span class="nd-eyebrow">{{ eyebrow() }}</span>
        <h1 class="nd-h1">{{ h1() }}</h1>
        <p>{{ intro() }}</p>
      </div>
    </section>

    <section class="nd-plans">
      <div class="nd-plans__grid">
        @for (p of planMeta(); track p.key) {
          <div class="nd-plan-card" [class.selected]="selected() === p.key" [class.popular]="p.popular" (click)="selectPlan(p.key)">
            @if (p.popular) {
              <span class="nd-plan-card__badge">{{ popularLabel() }}</span>
            }
            <div class="nd-plan-card__head">
              <h3 [class]="'nd-plan-card__name nd-plan-card__name--' + p.accent">{{ p.name }}</h3>
              <span class="nd-plan-card__radio" [class.selected]="selected() === p.key">{{ selected() === p.key ? '✓' : '' }}</span>
            </div>
            <div class="nd-plan-card__price"><span>{{ p.price }}</span><span class="nd-plan-card__period">{{ period() }}</span></div>
            <ul class="nd-plan-card__features">
              @for (f of features(p.key); track f.label) {
                <li [class.included]="f.included">
                  <span class="nd-plan-card__mark" [class.included]="f.included">{{ f.included ? '✓' : '—' }}</span>{{ f.label }}
                </li>
              }
            </ul>
          </div>
        }
      </div>
      <p class="nd-plans__note">{{ selectedNote() }}</p>
    </section>

    <section class="nd-form-sec">
      @if (!submitted()) {
        <div class="nd-form-card">
          <div class="nd-stepper">
            @for (lab of stepLabels(); track lab; let i = $index) {
              <div class="nd-stepper__step">
                <div class="nd-stepper__head">
                  <span class="nd-stepper__dot" [class.active]="step() >= i + 1">{{ step() > i + 1 ? '✓' : i + 1 }}</span>
                  <span class="nd-stepper__label" [class.active]="step() >= i + 1">{{ lab }}</span>
                </div>
                @if (i < 2) {
                  <span class="nd-stepper__line" [class.done]="step() > i + 1"></span>
                }
              </div>
            }
          </div>

          @if (step() === 1) {
            <div>
              <h2>{{ step1Title() }}</h2>
              <div class="nd-form-grid">
                <label class="nd-field">
                  <span>{{ L().fullName }}</span>
                  <input [value]="form().fullName" (input)="setField('fullName', ($event.target as HTMLInputElement).value)" />
                  <span class="nd-error">{{ errors()['fullName'] }}</span>
                </label>
                <label class="nd-field">
                  <span>{{ L().email }}</span>
                  <input type="email" [value]="form().email" (input)="setField('email', ($event.target as HTMLInputElement).value)" />
                  <span class="nd-error">{{ errors()['email'] }}</span>
                </label>
                <label class="nd-field">
                  <span>{{ L().phone }}</span>
                  <input [value]="form().phone" (input)="setField('phone', ($event.target as HTMLInputElement).value)" dir="ltr" />
                  <span class="nd-error">{{ errors()['phone'] }}</span>
                </label>
                <label class="nd-field">
                  <span>{{ L().age }}</span>
                  <input type="number" [value]="form().age" (input)="setField('age', ($event.target as HTMLInputElement).value)" />
                  <span class="nd-error">{{ errors()['age'] }}</span>
                </label>
              </div>
              <div class="nd-gender">
                <span class="nd-gender__label">{{ L().gender }}</span>
                <div class="nd-gender__opts">
                  @for (g of genderOpts(); track g.v) {
                    <button type="button" class="nd-gender__btn" [class.selected]="form().gender === g.v" (click)="setField('gender', g.v)">{{ g.label }}</button>
                  }
                </div>
              </div>
            </div>
          }

          @if (step() === 2) {
            <div>
              <h2>{{ step2Title() }}</h2>
              <div class="nd-form-grid nd-form-grid--3">
                <label class="nd-field">
                  <span>{{ L().height }}</span>
                  <input type="number" [value]="form().height" (input)="setField('height', ($event.target as HTMLInputElement).value)" />
                  <span class="nd-error">{{ errors()['height'] }}</span>
                </label>
                <label class="nd-field">
                  <span>{{ L().currentWeight }}</span>
                  <input type="number" [value]="form().currentWeight" (input)="setField('currentWeight', ($event.target as HTMLInputElement).value)" />
                  <span class="nd-error">{{ errors()['currentWeight'] }}</span>
                </label>
                <label class="nd-field">
                  <span>{{ L().targetWeight }}</span>
                  <input type="number" [value]="form().targetWeight" (input)="setField('targetWeight', ($event.target as HTMLInputElement).value)" />
                  <span class="nd-error">{{ errors()['targetWeight'] }}</span>
                </label>
              </div>
              <div class="nd-form-grid" style="margin-top:18px">
                <label class="nd-field">
                  <span>{{ L().goal }}</span>
                  <select [value]="form().goal" (change)="setField('goal', ($event.target as HTMLSelectElement).value)">
                    @for (o of goalOpts(); track o.v) { <option [value]="o.v">{{ o.label }}</option> }
                  </select>
                </label>
                <label class="nd-field">
                  <span>{{ L().activity }}</span>
                  <select [value]="form().activity" (change)="setField('activity', ($event.target as HTMLSelectElement).value)">
                    @for (o of activityOpts(); track o.v) { <option [value]="o.v">{{ o.label }}</option> }
                  </select>
                </label>
              </div>
            </div>
          }

          @if (step() === 3) {
            <div>
              <h2>{{ step3Title() }}</h2>
              <p class="nd-step3__sub">{{ step3Sub() }}</p>
              <div class="nd-form-col">
                <label class="nd-field">
                  <span>{{ L().medical }}</span>
                  <textarea rows="2" [value]="form().medical" (input)="setField('medical', ($event.target as HTMLTextAreaElement).value)"></textarea>
                </label>
                <label class="nd-field">
                  <span>{{ L().allergies }}</span>
                  <textarea rows="2" [value]="form().allergies" (input)="setField('allergies', ($event.target as HTMLTextAreaElement).value)"></textarea>
                </label>
                <label class="nd-field">
                  <span>{{ L().medications }} <span class="nd-field__hint">{{ L().medsHint }}</span></span>
                  <textarea rows="2" [value]="form().medications" (input)="setField('medications', ($event.target as HTMLTextAreaElement).value)"></textarea>
                </label>
                <label class="nd-agree">
                  <input type="checkbox" [checked]="form().agree" (change)="setField('agree', ($event.target as HTMLInputElement).checked)" />
                  <span>{{ L().agree }}</span>
                </label>
                <span class="nd-error">{{ errors()['agree'] }}</span>
              </div>
            </div>
          }

          <div class="nd-form-nav">
            <button type="button" class="nd-btn-back" [class.hidden]="step() === 1" (click)="goBack()">{{ backLabel() }}</button>
            <button type="button" class="nd-btn-next" [disabled]="submitting()" (click)="goNext()">{{ nextLabel() }}</button>
          </div>
        </div>
      } @else {
        <div class="nd-success">
          <div class="nd-success__icon"><svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#1B5E20" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></div>
          <h2>{{ successTitle() }}</h2>
          <p>{{ successText() }}</p>
          <a [href]="waLink()" target="_blank" rel="noopener" class="nd-success__btn">💬 {{ successBtn() }}</a>
        </div>
      }
    </section>
  </main>
  <app-footer />
</div>
```

- [ ] **Step 3: Write the SCSS** (values ported from `project/Subscription.dc.html:19-22,27-138,172-174`)

Create `frontend/src/app/pages/subscription/subscription.component.scss`:

```scss
@import '../../../styles/tokens';

.nd-page { font-family: $font-body; color: $nd-text; background: #fff; overflow-x: hidden; }
.nd-eyebrow { font-size: 13px; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; color: $nd-green; }
.nd-h1 { font-family: $font-serif; font-weight: 500; font-size: 50px; line-height: 1.08; margin: 14px 0 14px; letter-spacing: -.02em; @include bp-880 { font-size: 40px; } @include bp-560 { font-size: 32px; } }

.nd-hero { background: $nd-bg-soft; border-bottom: 1px solid $nd-border-soft; }
.nd-hero__inner { max-width: 820px; margin: 0 auto; padding: 78px 28px 60px; text-align: center; p { font-size: 18px; color: $nd-text-muted; margin: 0 auto; max-width: 52ch; } @include bp-560 { padding-left: 20px; padding-right: 20px; } }

.nd-plans { max-width: 1100px; margin: 0 auto; padding: 64px 28px 30px; @include bp-560 { padding-left: 20px; padding-right: 20px; } }
.nd-plans__grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; align-items: start; @include bp-880 { grid-template-columns: 1fr; } }
.nd-plan-card {
  position: relative; cursor: pointer; background: #fff; border: 1px solid $nd-border; border-radius: 22px; padding: 30px 28px;
  transition: .18s; box-shadow: 0 4px 16px rgba(15,36,23,.04);
  &:hover { border-color: $nd-green; }
  &.popular { padding: 38px 28px 30px; }
  &.selected { border: 2px solid $nd-green-dark; box-shadow: 0 18px 44px rgba(27,94,32,.16); }
}
.nd-plan-card__badge { position: absolute; top: -13px; left: 50%; transform: translateX(-50%); background: $nd-green-dark; color: #fff; font-size: 12px; font-weight: 700; padding: 6px 16px; border-radius: 999px; }
.nd-plan-card__head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.nd-plan-card__name { font-size: 15px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; margin: 0; &--basic, &--premium { color: $nd-green; } &--pro { color: $nd-green-dark; } }
.nd-plan-card__radio {
  width: 22px; height: 22px; border-radius: 50%; border: 2px solid #C9DBCB; background: #fff; color: #fff;
  display: flex; align-items: center; justify-content: center; font-size: 12px; flex: none;
  &.selected { border-color: $nd-green-dark; background: $nd-green-dark; }
}
.nd-plan-card__price { display: flex; align-items: baseline; gap: 6px; margin-bottom: 18px; span:first-child { font-family: $font-serif; font-size: 44px; font-weight: 600; color: $nd-text; } }
.nd-plan-card__period { font-size: 14px; color: $nd-text-faint; }
.nd-plan-card__features { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 11px; li { display: flex; gap: 10px; align-items: center; font-size: 14.5px; color: #A9B4AD; &.included { color: #33423A; } } }
.nd-plan-card__mark { font-weight: 700; flex: none; color: #C0C9C2; &.included { color: $nd-green; } }
.nd-plans__note { text-align: center; margin: 26px 0 0; font-size: 14.5px; color: $nd-text-faint; }

.nd-form-sec { max-width: 760px; margin: 0 auto; padding: 40px 28px 96px; @include bp-560 { padding-left: 20px; padding-right: 20px; } }
.nd-form-card { background: #fff; border: 1px solid $nd-border; border-radius: 24px; padding: 40px; box-shadow: 0 14px 44px rgba(15,36,23,.07); h2 { font-family: $font-serif; font-weight: 600; font-size: 26px; margin: 0 0 20px; } }

.nd-stepper { display: flex; align-items: center; margin-bottom: 34px; }
.nd-stepper__step { display: flex; align-items: center; flex: 1; }
.nd-stepper__head { display: flex; align-items: center; gap: 10px; }
.nd-stepper__dot { width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; flex: none; background: $nd-border; color: $nd-text-faint; &.active { background: $nd-green-dark; color: #fff; } }
.nd-stepper__label { font-size: 13.5px; font-weight: 600; color: #9AA89F; &.active { color: $nd-text; } }
.nd-stepper__line { flex: 1; height: 2px; background: $nd-border; margin: 0 12px; &.done { background: $nd-green-dark; } }

.nd-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; @include bp-880 { grid-template-columns: 1fr; } &--3 { grid-template-columns: 1fr 1fr 1fr; @include bp-880 { grid-template-columns: 1fr; } } }
.nd-form-col { display: flex; flex-direction: column; gap: 18px; }
.nd-field {
  display: flex; flex-direction: column; gap: 7px;
  span:first-child { font-size: 13.5px; font-weight: 600; color: #33423A; }
  input, select, textarea {
    border: 1px solid $nd-border-green; border-radius: 11px; padding: 12px 14px; font-size: 15px;
    font-family: inherit; outline: none; background: #fff; color: $nd-text; width: 100%;
  }
  textarea { resize: vertical; line-height: 1.5; }
}
.nd-field__hint { color: $nd-green; font-weight: 700; }
.nd-error { font-size: 12.5px; color: #C0392B; min-height: 1px; font-weight: 600; }

.nd-gender { margin-top: 18px; }
.nd-gender__label { font-size: 13.5px; font-weight: 600; color: #33423A; display: block; margin-bottom: 9px; }
.nd-gender__opts { display: flex; gap: 10px; }
.nd-gender__btn {
  flex: 1; font-family: inherit; cursor: pointer; font-weight: 600; font-size: 14.5px; padding: 12px; border-radius: 11px;
  background: #fff; color: #445249; border: 1px solid $nd-border-green;
  &.selected { background: $nd-green-dark; color: #fff; border-color: $nd-green-dark; }
}

.nd-step3__sub { font-size: 14px; color: $nd-text-faint; margin: 0 0 20px; }
.nd-agree { display: flex; gap: 11px; align-items: flex-start; cursor: pointer; input { margin-top: 3px; width: 18px; height: 18px; accent-color: $nd-green-dark; flex: none; } span { font-size: 14px; color: #445249; line-height: 1.5; } }

.nd-form-nav { display: flex; justify-content: space-between; gap: 12px; margin-top: 30px; }
.nd-btn-back { background: #fff; color: #445249; border: 1px solid $nd-border-green; font-family: inherit; cursor: pointer; font-weight: 700; font-size: 15px; padding: 14px 28px; border-radius: 12px; &.hidden { visibility: hidden; } }
.nd-btn-next { background: $nd-green-dark; color: #fff; border: none; font-family: inherit; cursor: pointer; font-weight: 700; font-size: 15px; padding: 14px 28px; border-radius: 12px; &:hover { background: $nd-green; } }

.nd-success {
  text-align: center; background: #fff; border: 1px solid $nd-border; border-radius: 24px; padding: 56px 40px;
  box-shadow: 0 14px 44px rgba(15,36,23,.07);
  h2 { font-family: $font-serif; font-weight: 600; font-size: 32px; margin: 0 0 12px; }
  p { font-size: 17px; color: $nd-text-muted; margin: 0 auto 28px; max-width: 44ch; line-height: 1.6; }
}
.nd-success__icon { width: 76px; height: 76px; border-radius: 50%; background: #EAF4EA; display: flex; align-items: center; justify-content: center; margin: 0 auto 22px; }
.nd-success__btn { display: inline-flex; align-items: center; gap: 9px; background: $nd-green-dark; color: #fff; text-decoration: none; font-weight: 700; font-size: 16px; padding: 15px 30px; border-radius: 999px; &:hover { background: $nd-green; } }
```

- [ ] **Step 4: Write the behavior test (step validation, plan select, submit calls LeadsService)**

Create `frontend/src/app/pages/subscription/subscription.component.spec.ts`:

```ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { SubscriptionComponent } from './subscription.component';
import { LeadsService } from '../../core/leads.service';

describe('SubscriptionComponent', () => {
  let fixture: ComponentFixture<SubscriptionComponent>;
  let component: SubscriptionComponent;
  let leadsServiceSpy: jasmine.SpyObj<LeadsService>;

  beforeEach(async () => {
    leadsServiceSpy = jasmine.createSpyObj('LeadsService', ['submitPlanRequest']);
    leadsServiceSpy.submitPlanRequest.and.returnValue(of({} as any));

    await TestBed.configureTestingModule({
      imports: [SubscriptionComponent],
      providers: [provideRouter([]), { provide: LeadsService, useValue: leadsServiceSpy }],
    }).compileComponents();
    fixture = TestBed.createComponent(SubscriptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('defaults to the pro plan and step 1', () => {
    expect(component.selected()).toBe('pro');
    expect(component.step()).toBe(1);
  });

  it('blocks advancing past step 1 with empty required fields', () => {
    component.goNext();
    expect(component.step()).toBe(1);
    expect(component.errors()['fullName']).toBeTruthy();
  });

  it('advances to step 2 once step 1 fields are valid', () => {
    component.setField('fullName', 'Jane Doe');
    component.setField('email', 'jane@example.com');
    component.setField('phone', '0500000000');
    component.setField('age', '25');
    component.goNext();
    expect(component.step()).toBe(2);
  });

  it('rejects age under 18', () => {
    component.setField('fullName', 'Jane Doe');
    component.setField('email', 'jane@example.com');
    component.setField('phone', '0500000000');
    component.setField('age', '16');
    component.goNext();
    expect(component.step()).toBe(1);
    expect(component.errors()['age']).toBeTruthy();
  });

  it('submitting step 3 calls LeadsService.submitPlanRequest and shows success', () => {
    component.selectPlan('premium');
    component.setField('fullName', 'Jane Doe');
    component.setField('email', 'jane@example.com');
    component.setField('phone', '0500000000');
    component.setField('age', '25');
    component.goNext();
    component.setField('height', '170');
    component.setField('currentWeight', '70');
    component.setField('targetWeight', '65');
    component.goNext();
    component.setField('agree', true);
    component.goNext();

    expect(leadsServiceSpy.submitPlanRequest).toHaveBeenCalledWith(
      jasmine.objectContaining({ name: 'Jane Doe', email: 'jane@example.com', plan: 'premium' })
    );
    expect(component.submitted()).toBe(true);
  });
});
```

- [ ] **Step 5: Run build and tests**

```bash
cd frontend
npx ng build
npx ng test --watch=false --browsers=ChromeHeadless
```

Expected: build succeeds, all `SubscriptionComponent` specs pass.

- [ ] **Step 6: Manually verify against the live backend**

With the Django dev server running (`cd backend && .venv/bin/python manage.py runserver` from repo root) and `ng serve` running, open `http://localhost:4200/subscription`, complete all 3 steps, submit, and confirm a new `PlanRequest` row appears in `http://localhost:8000/admin/leads/planrequest/`.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/app/pages/subscription
git commit -m "Add Subscription page with multi-step form wired to PlanRequest API"
```

---

## Task 10: Contact page

**Source:** `project/Contact.dc.html` (full file, 145 lines).

**Files:**
- Create: `frontend/src/app/pages/contact/contact.component.ts`
- Create: `frontend/src/app/pages/contact/contact.component.html`
- Create: `frontend/src/app/pages/contact/contact.component.scss`
- Create: `frontend/src/app/pages/contact/contact.component.spec.ts`

**Interfaces:**
- Consumes: `LangService`, `LeadsService.submitContact(payload: ContactPayload)` (Task 2), `NavComponent`, `FooterComponent`.
- Produces: route `'contact'` per Task 5.

This page's `submit()` calls the real `LeadsService.submitContact()` instead of the prototype's `setTimeout` fake (`project/Contact.dc.html:97-98`) — that fake delay only existed because the prototype had no backend.

- [ ] **Step 1: Write the component class** (validation/data ported from `project/Contact.dc.html:85-140`)

Create `frontend/src/app/pages/contact/contact.component.ts`:

```ts
import { Component, computed, inject, signal } from '@angular/core';
import { NavComponent } from '../../shared/nav/nav.component';
import { FooterComponent } from '../../shared/footer/footer.component';
import { LangService } from '../../core/lang.service';
import { LeadsService } from '../../core/leads.service';

interface FormState { name: string; email: string; phone: string; subject: string; message: string; }
interface InfoCard { icon: 'mail' | 'phone' | 'pin'; label: string; value: string; href: string; dir: 'ltr' | 'rtl'; }
interface Social { name: string; glyph: string; href: string; }

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [NavComponent, FooterComponent],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss',
})
export class ContactComponent {
  private readonly langService = inject(LangService);
  private readonly leadsService = inject(LeadsService);
  readonly lang = this.langService.lang;
  readonly ar = computed(() => this.lang() === 'ar');

  readonly sending = signal(false);
  readonly sent = signal(false);
  readonly errors = signal<Record<string, string>>({});
  readonly form = signal<FormState>({ name: '', email: '', phone: '', subject: 'general', message: '' });

  setField<K extends keyof FormState>(key: K, value: FormState[K]): void {
    this.form.update((f) => ({ ...f, [key]: value }));
    this.errors.update((e) => {
      const next = { ...e };
      delete next[key];
      return next;
    });
  }

  submit(): void {
    const ar = this.ar();
    const f = this.form();
    const e: Record<string, string> = {};
    const req = ar ? 'مطلوب' : 'Required';
    if (!f.name.trim()) e['name'] = req;
    if (!f.email.trim()) e['email'] = req;
    else if (!EMAIL_RE.test(f.email)) e['email'] = ar ? 'بريد غير صحيح' : 'Invalid email';
    if (!f.message.trim()) e['message'] = req;
    this.errors.set(e);
    if (Object.keys(e).length) return;

    this.sending.set(true);
    this.leadsService.submitContact(f).subscribe({
      next: () => { this.sending.set(false); this.sent.set(true); },
      error: () => { this.sending.set(false); this.sent.set(true); },
    });
  }

  readonly eyebrow = computed(() => (this.ar() ? 'تواصل' : 'Get in touch'));
  readonly h1 = computed(() => (this.ar() ? 'تواصل مع د. كريم' : 'Contact Dr. Karim'));
  readonly intro = computed(() => this.ar()
    ? 'أسئلة، استشارات، أو استفسارات إعلامية — يسعدنا أن نسمع منك.'
    : "Questions, consultations, or media inquiries — we'd love to hear from you.");

  readonly infoCards = computed<InfoCard[]>(() => {
    const ar = this.ar();
    return [
      { icon: 'mail', label: ar ? 'البريد الإلكتروني' : 'Email', value: 'karimeltaher640@gmail.com', href: 'mailto:karimeltaher640@gmail.com', dir: 'ltr' },
      { icon: 'phone', label: ar ? 'الهاتف' : 'Phone', value: '+966 54 993 0730', href: 'tel:+966549930730', dir: 'ltr' },
      { icon: 'pin', label: ar ? 'الموقع' : 'Location', value: ar ? 'الرياض، العليا، السعودية' : 'Riyadh, Olaya, KSA', href: '#', dir: ar ? 'rtl' : 'ltr' },
    ];
  });

  readonly followLabel = computed(() => (this.ar() ? 'تابعنا' : 'Follow us'));
  readonly socials: Social[] = [
    { name: 'Instagram', glyph: '⊚', href: 'https://instagram.com/dr.karimeltaher' },
    { name: 'TikTok', glyph: '♪', href: 'https://tiktok.com/@dr.karimeltaher' },
    { name: 'YouTube', glyph: '▶', href: 'https://youtube.com/@nutridoc' },
    { name: 'Facebook', glyph: 'f', href: 'https://facebook.com/nutridoc' },
  ];

  readonly L = computed(() => {
    const ar = this.ar();
    return {
      name: ar ? 'الاسم' : 'Name', email: ar ? 'البريد الإلكتروني' : 'Email', phone: ar ? 'الهاتف (اختياري)' : 'Phone (optional)',
      subject: ar ? 'الموضوع' : 'Subject', message: ar ? 'الرسالة' : 'Message',
    };
  });

  readonly subjectOpts = computed(() => {
    const ar = this.ar();
    return [
      { v: 'general', label: ar ? 'استفسار عام' : 'General Inquiry' },
      { v: 'consult', label: ar ? 'استشارة تغذية' : 'Nutrition Consultation' },
      { v: 'media', label: ar ? 'إعلام' : 'Media' },
      { v: 'partnership', label: ar ? 'شراكة' : 'Partnership' },
    ];
  });

  readonly submitLabel = computed(() => (this.sending() ? (this.ar() ? 'جارٍ الإرسال...' : 'Sending...') : (this.ar() ? 'إرسال الرسالة' : 'Send Message')));
  readonly sentTitle = computed(() => (this.ar() ? 'تم إرسال رسالتك!' : 'Message Sent!'));
  readonly sentText = computed(() => (this.ar() ? 'شكراً لتواصلك. سيرد عليك د. كريم في أقرب وقت.' : 'Thanks for reaching out. Dr. Karim will get back to you shortly.'));
}
```

- [ ] **Step 2: Write the template** (structure ported from `project/Contact.dc.html:27-78`)

Create `frontend/src/app/pages/contact/contact.component.html`:

```html
<div class="nd-page">
  <app-nav active="contact" />
  <main>
    <section class="nd-hero">
      <div class="nd-hero__inner">
        <span class="nd-eyebrow">{{ eyebrow() }}</span>
        <h1 class="nd-h1">{{ h1() }}</h1>
        <p>{{ intro() }}</p>
      </div>
    </section>

    <section class="nd-content">
      <div class="nd-content__grid">
        <div class="nd-info">
          @for (c of infoCards(); track c.label) {
            <a [href]="c.href" class="nd-info__card">
              <span class="nd-info__icon">
                @switch (c.icon) {
                  @case ('mail') { <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg> }
                  @case ('phone') { <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg> }
                  @case ('pin') { <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M12 22s7-6 7-12a7 7 0 1 0-14 0c0 6 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></svg> }
                }
              </span>
              <span>
                <span class="nd-info__label">{{ c.label }}</span>
                <span class="nd-info__value" [dir]="c.dir">{{ c.value }}</span>
              </span>
            </a>
          }
          <div class="nd-info__socials-card">
            <span class="nd-info__label">{{ followLabel() }}</span>
            <div class="nd-info__socials">
              @for (s of socials; track s.name) {
                <a [href]="s.href" target="_blank" rel="noopener" [attr.aria-label]="s.name" class="nd-info__social">{{ s.glyph }}</a>
              }
            </div>
          </div>
        </div>

        <div class="nd-form-card">
          @if (!sent()) {
            <div>
              <div class="nd-form-grid">
                <label class="nd-field">
                  <span>{{ L().name }}</span>
                  <input [value]="form().name" (input)="setField('name', ($event.target as HTMLInputElement).value)" />
                  <span class="nd-error">{{ errors()['name'] }}</span>
                </label>
                <label class="nd-field">
                  <span>{{ L().email }}</span>
                  <input type="email" [value]="form().email" (input)="setField('email', ($event.target as HTMLInputElement).value)" />
                  <span class="nd-error">{{ errors()['email'] }}</span>
                </label>
                <label class="nd-field">
                  <span>{{ L().phone }}</span>
                  <input [value]="form().phone" (input)="setField('phone', ($event.target as HTMLInputElement).value)" dir="ltr" />
                </label>
                <label class="nd-field">
                  <span>{{ L().subject }}</span>
                  <select [value]="form().subject" (change)="setField('subject', ($event.target as HTMLSelectElement).value)">
                    @for (o of subjectOpts(); track o.v) { <option [value]="o.v">{{ o.label }}</option> }
                  </select>
                </label>
              </div>
              <label class="nd-field nd-field--message">
                <span>{{ L().message }}</span>
                <textarea rows="5" [value]="form().message" (input)="setField('message', ($event.target as HTMLTextAreaElement).value)"></textarea>
                <span class="nd-error">{{ errors()['message'] }}</span>
              </label>
              <button type="button" class="nd-submit" [disabled]="sending()" (click)="submit()">{{ submitLabel() }}</button>
            </div>
          } @else {
            <div class="nd-sent">
              <div class="nd-sent__icon"><svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#1B5E20" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></div>
              <h2>{{ sentTitle() }}</h2>
              <p>{{ sentText() }}</p>
            </div>
          }
        </div>
      </div>
    </section>
  </main>
  <app-footer />
</div>
```

- [ ] **Step 3: Write the SCSS** (values ported from `project/Contact.dc.html:19-22,27-78`)

Create `frontend/src/app/pages/contact/contact.component.scss`:

```scss
@import '../../../styles/tokens';

.nd-page { font-family: $font-body; color: $nd-text; background: #fff; overflow-x: hidden; }
.nd-eyebrow { font-size: 13px; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; color: $nd-green; }
.nd-h1 { font-family: $font-serif; font-weight: 500; font-size: 50px; line-height: 1.08; margin: 14px 0 14px; letter-spacing: -.02em; @include bp-880 { font-size: 40px; } @include bp-560 { font-size: 32px; } }

.nd-hero { background: $nd-bg-soft; border-bottom: 1px solid $nd-border-soft; }
.nd-hero__inner { max-width: 820px; margin: 0 auto; padding: 78px 28px 60px; text-align: center; p { font-size: 18px; color: $nd-text-muted; margin: 0 auto; max-width: 50ch; } @include bp-560 { padding-left: 20px; padding-right: 20px; } }

.nd-content { max-width: 1100px; margin: 0 auto; padding: 72px 28px 96px; @include bp-560 { padding-left: 20px; padding-right: 20px; } }
.nd-content__grid { display: grid; grid-template-columns: .85fr 1.15fr; gap: 48px; align-items: start; @include bp-880 { grid-template-columns: 1fr; } }

.nd-info { display: flex; flex-direction: column; gap: 14px; }
.nd-info__card {
  text-decoration: none; display: flex; gap: 15px; align-items: center; border: 1px solid $nd-border; border-radius: 16px;
  padding: 20px; background: #fff; transition: .15s; color: $nd-text;
  &:hover { border-color: $nd-green-light; background: $nd-bg-soft; }
}
.nd-info__icon { width: 46px; height: 46px; border-radius: 12px; background: #EAF4EA; color: $nd-green; display: flex; align-items: center; justify-content: center; flex: none; }
.nd-info__label { display: block; font-size: 12.5px; color: #8A9A8E; font-weight: 600; margin-bottom: 2px; }
.nd-info__value { display: block; font-size: 15.5px; font-weight: 700; color: $nd-text; }
.nd-info__socials-card { border: 1px solid $nd-border; border-radius: 16px; padding: 20px; background: #fff; }
.nd-info__socials { display: flex; gap: 10px; margin-top: 12px; }
.nd-info__social {
  width: 42px; height: 42px; border-radius: 11px; background: #EAF4EA; color: $nd-green; display: flex; align-items: center;
  justify-content: center; text-decoration: none; font-weight: 700; font-size: 17px;
  &:hover { background: $nd-green; color: #fff; }
}

.nd-form-card { background: #fff; border: 1px solid $nd-border; border-radius: 22px; padding: 36px; box-shadow: 0 12px 40px rgba(15,36,23,.06); }
.nd-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; @include bp-560 { grid-template-columns: 1fr; } }
.nd-field {
  display: flex; flex-direction: column; gap: 7px;
  span:first-child { font-size: 13.5px; font-weight: 600; color: #33423A; }
  input, select, textarea { border: 1px solid $nd-border-green; border-radius: 11px; padding: 12px 14px; font-size: 15px; font-family: inherit; outline: none; background: #fff; color: $nd-text; width: 100%; }
  textarea { resize: vertical; line-height: 1.5; }
  &--message { margin-top: 18px; }
}
.nd-error { font-size: 12.5px; color: #C0392B; min-height: 1px; font-weight: 600; }
.nd-submit { width: 100%; margin-top: 22px; background: $nd-green-dark; color: #fff; border: none; font-family: inherit; cursor: pointer; font-weight: 700; font-size: 16px; padding: 15px; border-radius: 12px; &:disabled { opacity: .7; cursor: default; } }

.nd-sent { text-align: center; padding: 30px 10px; h2 { font-family: $font-serif; font-weight: 600; font-size: 28px; margin: 0 0 10px; } p { font-size: 16px; color: $nd-text-muted; margin: 0; line-height: 1.6; } }
.nd-sent__icon { width: 68px; height: 68px; border-radius: 50%; background: #EAF4EA; display: flex; align-items: center; justify-content: center; margin: 0 auto 18px; }
```

- [ ] **Step 4: Write the behavior test (validation + LeadsService call)**

Create `frontend/src/app/pages/contact/contact.component.spec.ts`:

```ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ContactComponent } from './contact.component';
import { LeadsService } from '../../core/leads.service';

describe('ContactComponent', () => {
  let fixture: ComponentFixture<ContactComponent>;
  let component: ContactComponent;
  let leadsServiceSpy: jasmine.SpyObj<LeadsService>;

  beforeEach(async () => {
    leadsServiceSpy = jasmine.createSpyObj('LeadsService', ['submitContact']);
    leadsServiceSpy.submitContact.and.returnValue(of({} as any));

    await TestBed.configureTestingModule({
      imports: [ContactComponent],
      providers: [provideRouter([]), { provide: LeadsService, useValue: leadsServiceSpy }],
    }).compileComponents();
    fixture = TestBed.createComponent(ContactComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('blocks submit with empty required fields and sets errors', () => {
    component.submit();
    expect(leadsServiceSpy.submitContact).not.toHaveBeenCalled();
    expect(component.errors()['name']).toBeTruthy();
    expect(component.errors()['email']).toBeTruthy();
    expect(component.errors()['message']).toBeTruthy();
  });

  it('rejects an invalid email format', () => {
    component.setField('name', 'Jane');
    component.setField('email', 'not-an-email');
    component.setField('message', 'hello');
    component.submit();
    expect(component.errors()['email']).toBeTruthy();
    expect(leadsServiceSpy.submitContact).not.toHaveBeenCalled();
  });

  it('submits via LeadsService and shows the sent state on valid input', () => {
    component.setField('name', 'Jane');
    component.setField('email', 'jane@example.com');
    component.setField('message', 'hello there');
    component.submit();
    expect(leadsServiceSpy.submitContact).toHaveBeenCalledWith(
      jasmine.objectContaining({ name: 'Jane', email: 'jane@example.com', message: 'hello there' })
    );
    expect(component.sent()).toBe(true);
  });
});
```

- [ ] **Step 5: Run build and tests**

```bash
cd frontend
npx ng build
npx ng test --watch=false --browsers=ChromeHeadless
```

Expected: build succeeds, all `ContactComponent` specs pass.

- [ ] **Step 6: Manually verify against the live backend**

With Django running and `ng serve` running, open `http://localhost:4200/contact`, submit a message, and confirm a new `ContactSubmission` appears in `http://localhost:8000/admin/leads/contactsubmission/`.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/app/pages/contact
git commit -m "Add Contact page wired to ContactSubmission API"
```

---

## Task 11: Blog page

**Source:** `project/Blog.dc.html` (full file, 140 lines). Unlike the prototype's 6 hardcoded mock posts (`project/Blog.dc.html:88-97`), this page calls `BlogService.categories()` and `BlogService.posts({ category, q })` (Task 2) against the real Django API. Pagination becomes client-side over the fetched filtered set, 6-per-page, matching the prototype's `PER = 6` (`project/Blog.dc.html:85`) — the backend's own `PageNumberPagination` (`PAGE_SIZE: 9`) is irrelevant here because `BlogService.posts()` already requests the full filtered set (DRF defaults to page 1 of `PAGE_SIZE` results; given the dataset is small, this matches existing data, but note this as a known limitation below).

**Files:**
- Create: `frontend/src/app/pages/blog/blog.component.ts`
- Create: `frontend/src/app/pages/blog/blog.component.html`
- Create: `frontend/src/app/pages/blog/blog.component.scss`
- Create: `frontend/src/app/pages/blog/blog.component.spec.ts`

**Interfaces:**
- Consumes: `LangService`, `BlogService.categories(): Observable<Category[]>`, `BlogService.posts(filters): Observable<BlogPostSummary[]>` (Task 2), `NavComponent`, `FooterComponent`.
- Produces: route `'blog'` per Task 5.

**Known limitation to flag for the user (not a blocker):** because `BlogService.posts()` hits `/api/posts/` without a `page` query param, Django's `PageNumberPagination` (`PAGE_SIZE: 9`) caps the unwrapped `results` to the first 9 matching posts server-side. With 6 seed posts this is invisible; if the catalog grows past 9 posts the "All" category view will silently truncate. This plan does not change `PAGE_SIZE` or add a "load more" — flag it to the user as a known follow-up rather than expanding scope here.

- [ ] **Step 1: Write the component class** (category/search/pagination logic ported from `project/Blog.dc.html:83-136`)

Create `frontend/src/app/pages/blog/blog.component.ts`:

```ts
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavComponent } from '../../shared/nav/nav.component';
import { FooterComponent } from '../../shared/footer/footer.component';
import { LangService } from '../../core/lang.service';
import { BlogService } from '../../core/blog.service';
import { BlogPostSummary, Category } from '../../shared/models/blog.models';

const PER_PAGE = 6;

@Component({
  selector: 'app-blog',
  standalone: true,
  imports: [RouterLink, NavComponent, FooterComponent],
  templateUrl: './blog.component.html',
  styleUrl: './blog.component.scss',
})
export class BlogComponent {
  private readonly langService = inject(LangService);
  private readonly blogService = inject(BlogService);
  readonly lang = this.langService.lang;
  readonly ar = computed(() => this.lang() === 'ar');

  readonly categories = signal<Category[]>([]);
  readonly allPosts = signal<BlogPostSummary[]>([]);
  readonly activeCategory = signal<string>('all');
  readonly query = signal('');
  readonly page = signal(1);
  readonly loading = signal(true);

  constructor() {
    this.blogService.categories().subscribe((cats) => this.categories.set(cats));
    this.fetchPosts();
  }

  private fetchPosts(): void {
    this.loading.set(true);
    this.blogService.posts({
      category: this.activeCategory() === 'all' ? undefined : this.activeCategory(),
      q: this.query().trim() || undefined,
    }).subscribe((posts) => {
      this.allPosts.set(posts);
      this.page.set(1);
      this.loading.set(false);
    });
  }

  selectCategory(slug: string): void {
    this.activeCategory.set(slug);
    this.fetchPosts();
  }

  onSearchInput(value: string): void {
    this.query.set(value);
    this.fetchPosts();
  }

  goToPage(p: number): void {
    this.page.set(p);
  }

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.allPosts().length / PER_PAGE)));
  readonly pagePosts = computed(() => {
    const p = Math.min(this.page(), this.totalPages());
    return this.allPosts().slice((p - 1) * PER_PAGE, p * PER_PAGE);
  });

  readonly eyebrow = computed(() => (this.ar() ? 'المدونة' : 'NutriDoc Journal'));
  readonly h1 = computed(() => (this.ar() ? 'مدونة التغذية' : 'The Nutrition Blog'));
  readonly intro = computed(() => this.ar()
    ? 'مقالات مبنية على الأدلة في التغذية وإدارة الوزن والصحة من د. كريم الطاهر.'
    : 'Evidence-based articles on nutrition, weight management, and health from Dr. Karim Eltaher.');
  readonly searchPlaceholder = computed(() => (this.ar() ? 'ابحث في المقالات...' : 'Search articles...'));
  readonly authorChip = computed(() => (this.ar() ? 'د. كريم' : 'Dr. Karim'));
  readonly noResultsMsg = computed(() => (this.ar() ? 'لا توجد مقالات مطابقة. جرّب بحثاً آخر.' : 'No matching articles. Try a different search.'));

  postTitle(post: BlogPostSummary): string { return this.ar() ? post.title_ar : post.title_en; }
  postExcerpt(post: BlogPostSummary): string { return this.ar() ? post.excerpt_ar : post.excerpt_en; }
  postCategoryName(post: BlogPostSummary): string { return this.ar() ? post.category.name_ar : post.category.name_en; }
  postReadLabel(post: BlogPostSummary): string {
    return this.ar() ? `${post.read_time_minutes} دقائق` : `${post.read_time_minutes} min read`;
  }
  categoryName(cat: Category): string { return this.ar() ? cat.name_ar : cat.name_en; }
}
```

- [ ] **Step 2: Write the template** (structure ported from `project/Blog.dc.html:24-80`)

Create `frontend/src/app/pages/blog/blog.component.html`:

```html
<div class="nd-page">
  <app-nav active="blog" />
  <main>
    <section class="nd-hero">
      <div class="nd-hero__inner">
        <span class="nd-eyebrow">{{ eyebrow() }}</span>
        <h1 class="nd-h1">{{ h1() }}</h1>
        <p>{{ intro() }}</p>
        <div class="nd-search">
          <input [value]="query()" (input)="onSearchInput(($event.target as HTMLInputElement).value)" [placeholder]="searchPlaceholder()" />
        </div>
      </div>
    </section>

    <section class="nd-results">
      <div class="nd-cats">
        <button type="button" class="nd-cat-btn" [class.active]="activeCategory() === 'all'" (click)="selectCategory('all')">{{ ar() ? 'الكل' : 'All' }}</button>
        @for (c of categories(); track c.slug) {
          <button type="button" class="nd-cat-btn" [class.active]="activeCategory() === c.slug" (click)="selectCategory(c.slug)">{{ categoryName(c) }}</button>
        }
      </div>

      @if (loading()) {
        <div class="nd-empty"><p>{{ ar() ? 'جارٍ التحميل...' : 'Loading...' }}</p></div>
      } @else if (pagePosts().length > 0) {
        <div class="nd-grid">
          @for (post of pagePosts(); track post.id) {
            <a [routerLink]="['/blog', post.slug]" class="nd-card">
              <div class="nd-card__img" [style.background]="post.cover_image_url ? 'url(' + post.cover_image_url + ') center/cover' : 'linear-gradient(140deg,#A5D6A7,#66BB6A)'">
                <span class="nd-card__cat">{{ postCategoryName(post) }}</span>
              </div>
              <div class="nd-card__body">
                <h3>{{ postTitle(post) }}</h3>
                <p>{{ postExcerpt(post) }}</p>
                <div class="nd-card__foot">
                  <span class="nd-card__avatar">K</span>
                  <span class="nd-card__author">{{ authorChip() }}</span>
                  <span class="nd-card__read">{{ postReadLabel(post) }}</span>
                </div>
              </div>
            </a>
          }
        </div>
      } @else {
        <div class="nd-empty"><div class="nd-empty__icon">🔍</div><p>{{ noResultsMsg() }}</p></div>
      }

      @if (totalPages() > 1) {
        <div class="nd-pagination">
          @for (p of Array(totalPages()).fill(0); track $index; let i = $index) {
            <button type="button" class="nd-page-btn" [class.active]="page() === i + 1" (click)="goToPage(i + 1)">{{ i + 1 }}</button>
          }
        </div>
      }
    </section>
  </main>
  <app-footer />
</div>
```

`Array(...)` is not directly callable from a template expression context reliably across Angular versions — replace that pagination `@for` with a precomputed signal instead. Add to the component class (Step 1) right after `totalPages`:

```ts
  readonly pageNumbers = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i + 1));
```

And change the pagination block in the template to:

```html
      @if (totalPages() > 1) {
        <div class="nd-pagination">
          @for (p of pageNumbers(); track p) {
            <button type="button" class="nd-page-btn" [class.active]="page() === p" (click)="goToPage(p)">{{ p }}</button>
          }
        </div>
      }
```

- [ ] **Step 3: Write the SCSS** (values ported from `project/Blog.dc.html:19-22,27-77`)

Create `frontend/src/app/pages/blog/blog.component.scss`:

```scss
@import '../../../styles/tokens';

.nd-page { font-family: $font-body; color: $nd-text; background: #fff; overflow-x: hidden; }
.nd-eyebrow { font-size: 13px; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; color: $nd-green; }
.nd-h1 { font-family: $font-serif; font-weight: 500; font-size: 50px; line-height: 1.08; margin: 14px 0 14px; letter-spacing: -.02em; @include bp-880 { font-size: 42px; } @include bp-560 { font-size: 34px; } }

.nd-hero { background: $nd-bg-soft; border-bottom: 1px solid $nd-border-soft; }
.nd-hero__inner { max-width: 900px; margin: 0 auto; padding: 78px 28px 64px; text-align: center; p { font-size: 18px; color: $nd-text-muted; margin: 0 auto 30px; max-width: 54ch; } @include bp-560 { padding-left: 20px; padding-right: 20px; } }
.nd-search { max-width: 480px; margin: 0 auto; position: relative; input { width: 100%; border: 1px solid $nd-border-green; border-radius: 999px; padding: 15px 22px; font-size: 15px; font-family: inherit; outline: none; background: #fff; color: $nd-text; &:focus { border-color: $nd-green; box-shadow: 0 0 0 3px rgba(46,125,50,.12); } } }

.nd-results { max-width: 1180px; margin: 0 auto; padding: 44px 28px 90px; @include bp-560 { padding-left: 20px; padding-right: 20px; } }
.nd-cats { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; margin-bottom: 44px; }
.nd-cat-btn {
  font-family: inherit; cursor: pointer; font-size: 14px; font-weight: 600; padding: 9px 18px; border-radius: 999px;
  transition: .18s; background: #fff; color: #445249; border: 1px solid $nd-border-green;
  &:hover { border-color: $nd-green; }
  &.active { background: $nd-green-dark; color: #fff; border-color: $nd-green-dark; }
}

.nd-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; @include bp-880 { grid-template-columns: 1fr 1fr; } @include bp-560 { grid-template-columns: 1fr; } }
.nd-card {
  text-decoration: none; color: inherit; background: #fff; border: 1px solid $nd-border-soft; border-radius: 18px;
  overflow: hidden; display: flex; flex-direction: column; transition: .2s;
  &:hover { box-shadow: 0 16px 40px rgba(15,36,23,.1); transform: translateY(-4px); }
}
.nd-card__img { height: 170px; display: flex; align-items: flex-end; padding: 14px; }
.nd-card__cat { background: rgba(255,255,255,.92); color: $nd-green-dark; font-size: 12px; font-weight: 700; padding: 5px 12px; border-radius: 999px; }
.nd-card__body { padding: 22px 22px 24px; display: flex; flex-direction: column; flex: 1; h3 { font-size: 18.5px; font-weight: 700; line-height: 1.3; margin: 0 0 10px; } p { font-size: 14.5px; line-height: 1.6; color: $nd-text-muted; margin: 0 0 18px; flex: 1; } }
.nd-card__foot { display: flex; align-items: center; gap: 10px; }
.nd-card__avatar { width: 30px; height: 30px; border-radius: 50%; background: linear-gradient(140deg, $nd-green-mid, $nd-green); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 12px; font-weight: 700; }
.nd-card__author { font-size: 13px; color: $nd-text-muted; font-weight: 600; }
.nd-card__read { margin-inline-start: auto; font-size: 12.5px; color: #8A9A8E; }

.nd-empty { text-align: center; padding: 60px 20px; color: $nd-text-faint; }
.nd-empty__icon { font-size: 40px; margin-bottom: 12px; }

.nd-pagination { display: flex; gap: 8px; justify-content: center; margin-top: 48px; }
.nd-page-btn {
  font-family: inherit; cursor: pointer; width: 42px; height: 42px; border-radius: 10px; font-weight: 700; font-size: 15px;
  background: #fff; color: #445249; border: 1px solid $nd-border-green;
  &.active { background: $nd-green-dark; color: #fff; border-color: $nd-green-dark; }
}
```

- [ ] **Step 4: Write the behavior test (category filter, search, pagination, all via mocked BlogService)**

Create `frontend/src/app/pages/blog/blog.component.spec.ts`:

```ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { BlogComponent } from './blog.component';
import { BlogService } from '../../core/blog.service';
import { BlogPostSummary, Category } from '../../shared/models/blog.models';

function makePost(overrides: Partial<BlogPostSummary>): BlogPostSummary {
  return {
    id: 1, title_en: 'Title', title_ar: 'عنوان', slug: 'title', excerpt_en: 'Excerpt', excerpt_ar: 'مقتطف',
    author: 'Dr. Karim Eltaher', cover_image_url: '', read_time_minutes: 5, published_at: '2026-01-01',
    category: { id: 1, name_en: 'Weight', name_ar: 'الوزن', slug: 'weight' },
    ...overrides,
  };
}

describe('BlogComponent', () => {
  let fixture: ComponentFixture<BlogComponent>;
  let component: BlogComponent;
  let blogServiceSpy: jasmine.SpyObj<BlogService>;
  const categories: Category[] = [{ id: 1, name_en: 'Weight', name_ar: 'الوزن', slug: 'weight' }];

  function setup(posts: BlogPostSummary[]) {
    blogServiceSpy = jasmine.createSpyObj('BlogService', ['categories', 'posts']);
    blogServiceSpy.categories.and.returnValue(of(categories));
    blogServiceSpy.posts.and.returnValue(of(posts));
    TestBed.configureTestingModule({
      imports: [BlogComponent],
      providers: [provideRouter([]), { provide: BlogService, useValue: blogServiceSpy }],
    });
    fixture = TestBed.createComponent(BlogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('loads categories and posts on init', () => {
    setup([makePost({ id: 1 })]);
    expect(blogServiceSpy.categories).toHaveBeenCalled();
    expect(blogServiceSpy.posts).toHaveBeenCalledWith({ category: undefined, q: undefined });
    expect(component.allPosts().length).toBe(1);
  });

  it('selecting a category re-fetches with that category slug', () => {
    setup([]);
    component.selectCategory('weight');
    expect(blogServiceSpy.posts).toHaveBeenCalledWith({ category: 'weight', q: undefined });
  });

  it('typing in search re-fetches with the query', () => {
    setup([]);
    component.onSearchInput('protein');
    expect(blogServiceSpy.posts).toHaveBeenCalledWith({ category: undefined, q: 'protein' });
  });

  it('paginates 6 posts per page', () => {
    const posts = Array.from({ length: 8 }, (_, i) => makePost({ id: i + 1, slug: `post-${i + 1}` }));
    setup(posts);
    expect(component.totalPages()).toBe(2);
    expect(component.pagePosts().length).toBe(6);
    component.goToPage(2);
    expect(component.pagePosts().length).toBe(2);
  });

  it('shows no-results state for an empty filtered set', () => {
    setup([]);
    expect(component.pagePosts().length).toBe(0);
  });
});
```

- [ ] **Step 5: Run build and tests**

```bash
cd frontend
npx ng build
npx ng test --watch=false --browsers=ChromeHeadless
```

Expected: build succeeds, all `BlogComponent` specs pass.

- [ ] **Step 6: Manually verify against the live backend**

With Django running (it must have at least one `Category` and one published `BlogPost` seeded via `/admin/` — if the database is empty, create one category and one published post first) and `ng serve` running, open `http://localhost:4200/blog`. Confirm: real categories from `/api/categories/` render as filter buttons, posts from `/api/posts/` render as cards, typing in the search box re-queries `q=`, and clicking a category re-queries `category=`.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/app/pages/blog
git commit -m "Add Blog list page wired to categories/posts API"
```

---

## Task 12: BlogPost detail page

**Source:** `project/BlogPost.dc.html` (full file, 165 lines). Unlike the prototype's hardcoded single article, this page reads the `:slug` route param and calls `BlogService.post(slug)` (Task 2), rendering `body_en`/`body_ar` via `[innerHTML]` and the `related` array returned by the detail endpoint instead of the prototype's static `moreCards` (`project/BlogPost.dc.html:155-158`).

**Files:**
- Create: `frontend/src/app/pages/blog-post/blog-post.component.ts`
- Create: `frontend/src/app/pages/blog-post/blog-post.component.html`
- Create: `frontend/src/app/pages/blog-post/blog-post.component.scss`
- Create: `frontend/src/app/pages/blog-post/blog-post.component.spec.ts`

**Interfaces:**
- Consumes: `LangService`, `BlogService.post(slug): Observable<BlogPostDetail>` (Task 2), `ActivatedRoute`, `NavComponent`, `FooterComponent`.
- Produces: route `'blog/:slug'` per Task 5.

- [ ] **Step 1: Write the component class**

Create `frontend/src/app/pages/blog-post/blog-post.component.ts`:

```ts
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NavComponent } from '../../shared/nav/nav.component';
import { FooterComponent } from '../../shared/footer/footer.component';
import { LangService } from '../../core/lang.service';
import { BlogService } from '../../core/blog.service';
import { BlogPostDetail, BlogPostSummary } from '../../shared/models/blog.models';

@Component({
  selector: 'app-blog-post',
  standalone: true,
  imports: [RouterLink, NavComponent, FooterComponent],
  templateUrl: './blog-post.component.html',
  styleUrl: './blog-post.component.scss',
})
export class BlogPostComponent {
  private readonly langService = inject(LangService);
  private readonly blogService = inject(BlogService);
  private readonly route = inject(ActivatedRoute);

  readonly lang = this.langService.lang;
  readonly ar = computed(() => this.lang() === 'ar');

  readonly post = signal<BlogPostDetail | null>(null);
  readonly loading = signal(true);
  readonly copied = signal(false);

  constructor() {
    const slug = this.route.snapshot.paramMap.get('slug')!;
    this.blogService.post(slug).subscribe((p) => {
      this.post.set(p);
      this.loading.set(false);
    });
  }

  title(): string { const p = this.post(); return p ? (this.ar() ? p.title_ar : p.title_en) : ''; }
  body(): string { const p = this.post(); return p ? (this.ar() ? p.body_ar : p.body_en) : ''; }
  category(): string { const p = this.post(); return p ? (this.ar() ? p.category.name_ar : p.category.name_en) : ''; }
  readTimeLabel(): string {
    const p = this.post();
    if (!p) return '';
    return this.ar() ? `${p.read_time_minutes} دقائق قراءة` : `${p.read_time_minutes} min read`;
  }
  dateLabel(): string {
    const p = this.post();
    if (!p || !p.published_at) return '';
    const d = new Date(p.published_at);
    return d.toLocaleDateString(this.ar() ? 'ar' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }
  relatedTitle(post: BlogPostSummary): string { return this.ar() ? post.title_ar : post.title_en; }
  relatedCategory(post: BlogPostSummary): string { return this.ar() ? post.category.name_ar : post.category.name_en; }
  relatedReadLabel(post: BlogPostSummary): string {
    return this.ar() ? `${post.read_time_minutes} دقائق` : `${post.read_time_minutes} min read`;
  }

  copyLink(): void {
    try { navigator.clipboard.writeText(location.href); } catch { /* clipboard unavailable */ }
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 1800);
  }

  readonly crumbHome = computed(() => (this.ar() ? 'الرئيسية' : 'Home'));
  readonly crumbBlog = computed(() => (this.ar() ? 'المدونة' : 'Blog'));
  readonly authorRole = computed(() => (this.ar() ? 'صيدلي إكلينيكي وخبير تغذية' : 'Clinical Pharmacist & Nutrition Expert'));
  readonly authorBio = computed(() => this.ar()
    ? 'مؤسس نوتري دوك. يجمع بين الصيدلة الإكلينيكية وعلم التغذية لبناء خطط مبنية على الأدلة.'
    : 'Founder of NutriDoc. Combines clinical pharmacy with nutrition science to build evidence-based plans.');
  readonly authorCta = computed(() => (this.ar() ? 'الملف الكامل' : 'Full profile'));
  readonly relatedTitleLabel = computed(() => (this.ar() ? 'مقالات ذات صلة' : 'Related articles'));
  readonly subTitle = computed(() => (this.ar() ? 'خطتك تبدأ هنا' : 'Your Plan Starts Here'));
  readonly subText = computed(() => (this.ar() ? 'احصل على خطة تغذية مخصصة من د. كريم.' : 'Get a personalized nutrition plan from Dr. Karim.'));
  readonly subBtn = computed(() => (this.ar() ? 'اشترك الآن' : 'Subscribe Now'));
  readonly shareLabel = computed(() => (this.ar() ? 'شارك المقال' : 'Share this article'));
  readonly copyLabel = computed(() => (this.copied() ? (this.ar() ? 'تم النسخ!' : 'Copied!') : (this.ar() ? 'انسخ الرابط' : 'Copy link')));
  readonly waHref = computed(() => `https://wa.me/?text=${encodeURIComponent(this.ar() ? 'مقال رائع من نوتري دوك' : 'Great read from NutriDoc')}`);
  readonly moreTitle = computed(() => (this.ar() ? 'اقرأ المزيد' : 'Keep Reading'));
}
```

- [ ] **Step 2: Write the template** (structure ported from `project/BlogPost.dc.html:28-107`; article body fields `lede`/`p1`-`p5`/`h2a`/`h2b`/`h3a`/`quote`/`bullets` from the prototype were hardcoded demo prose for a single mock article — since this page now renders real `body_en`/`body_ar` CKEditor HTML from the API via `[innerHTML]`, those individual paragraph bindings are replaced by one `[innerHTML]="body()"` block)

Create `frontend/src/app/pages/blog-post/blog-post.component.html`:

```html
<div class="nd-page">
  <app-nav active="blog" />
  <main>
    @if (loading()) {
      <div class="nd-loading"><p>{{ ar() ? 'جارٍ التحميل...' : 'Loading...' }}</p></div>
    } @else if (post()) {
      <section class="nd-hero">
        <div class="nd-hero__overlay"></div>
        <div class="nd-hero__inner">
          <nav class="nd-crumbs">
            <a routerLink="/">{{ crumbHome() }}</a> <span>/</span> <a routerLink="/blog">{{ crumbBlog() }}</a> <span>/</span> <span class="current">{{ title() }}</span>
          </nav>
          <span class="nd-hero__cat">{{ category() }}</span>
          <h1 class="nd-hero__h1">{{ title() }}</h1>
          <div class="nd-hero__meta">
            <span class="nd-hero__avatar">K</span>
            <span class="nd-hero__author">{{ post()!.author }}</span><span class="dot">·</span><span>{{ dateLabel() }}</span><span class="dot">·</span><span>{{ readTimeLabel() }}</span>
          </div>
        </div>
      </section>

      <div class="nd-body-grid">
        <article class="nd-article" [innerHTML]="body()"></article>

        <aside class="nd-aside">
          <div class="nd-aside__author">
            <div class="nd-aside__author-head">
              <span class="nd-aside__avatar">K</span>
              <div><div class="nd-aside__name">{{ post()!.author }}</div><div class="nd-aside__role">{{ authorRole() }}</div></div>
            </div>
            <p>{{ authorBio() }}</p>
            <a routerLink="/about" class="nd-aside__cta">{{ authorCta() }} →</a>
          </div>

          @if (post()!.related.length > 0) {
            <div class="nd-aside__related">
              <h4>{{ relatedTitleLabel() }}</h4>
              <div class="nd-aside__related-list">
                @for (r of post()!.related; track r.id) {
                  <a [routerLink]="['/blog', r.slug]">{{ relatedTitle(r) }}</a>
                }
              </div>
            </div>
          }

          <div class="nd-aside__sub">
            <h4>{{ subTitle() }}</h4>
            <p>{{ subText() }}</p>
            <a routerLink="/subscription" class="nd-aside__sub-btn">{{ subBtn() }}</a>
          </div>
        </aside>
      </div>

      <div class="nd-share">
        <span>{{ shareLabel() }}</span>
        <button type="button" (click)="copyLink()">🔗 {{ copyLabel() }}</button>
        <a [href]="waHref()" target="_blank" rel="noopener">💬 WhatsApp</a>
      </div>

      @if (post()!.related.length > 0) {
        <section class="nd-more">
          <div class="nd-more__inner">
            <h2>{{ moreTitle() }}</h2>
            <div class="nd-more__grid">
              @for (r of post()!.related; track r.id) {
                <a [routerLink]="['/blog', r.slug]" class="nd-more__card">
                  <div class="nd-more__img"><span>{{ relatedCategory(r) }}</span></div>
                  <div class="nd-more__body"><h3>{{ relatedTitle(r) }}</h3><span>{{ relatedReadLabel(r) }}</span></div>
                </a>
              }
            </div>
          </div>
        </section>
      }
    }
  </main>
  <app-footer />
</div>
```

- [ ] **Step 3: Write the SCSS** (values ported from `project/BlogPost.dc.html:20-23,29-106`)

Create `frontend/src/app/pages/blog-post/blog-post.component.scss`:

```scss
@import '../../../styles/tokens';

.nd-page { font-family: $font-body; color: $nd-text; background: #fff; overflow-x: hidden; }
.nd-loading { padding: 120px 20px; text-align: center; color: $nd-text-faint; }

.nd-hero { position: relative; height: 420px; background: linear-gradient(140deg, $nd-green-dark, $nd-green, $nd-green-mid); display: flex; align-items: flex-end; }
.nd-hero__overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(15,36,23,.78), rgba(15,36,23,.15)); }
.nd-hero__inner { position: relative; max-width: 900px; margin: 0 auto; padding: 0 28px 48px; width: 100%; @include bp-560 { padding-left: 20px; padding-right: 20px; } }
.nd-crumbs { font-size: 13.5px; color: #CADCCD; margin-bottom: 18px; a { color: #CADCCD; text-decoration: none; } span { opacity: .6; } .current { color: #fff; opacity: 1; } }
.nd-hero__cat { display: inline-block; background: $nd-green-light; color: $nd-green-dark; font-size: 12px; font-weight: 700; padding: 5px 13px; border-radius: 999px; margin-bottom: 14px; }
.nd-hero__h1 { font-family: $font-serif; font-weight: 500; font-size: 44px; line-height: 1.1; color: #fff; margin: 0; letter-spacing: -.02em; max-width: 20ch; @include bp-560 { font-size: 30px; } }
.nd-hero__meta { display: flex; align-items: center; gap: 12px; margin-top: 20px; color: #D6E8D8; font-size: 14px; .dot { opacity: .6; } }
.nd-hero__avatar { width: 34px; height: 34px; border-radius: 50%; background: linear-gradient(140deg, $nd-green-mid, $nd-green-light); display: flex; align-items: center; justify-content: center; color: $nd-green-dark; font-weight: 700; }
.nd-hero__author { font-weight: 600; color: #fff; }

.nd-body-grid { max-width: 1120px; margin: 0 auto; padding: 64px 28px 90px; display: grid; grid-template-columns: 1fr 320px; gap: 56px; align-items: start; @include bp-920 { grid-template-columns: 1fr; } @include bp-560 { padding-left: 20px; padding-right: 20px; } }
.nd-article {
  font-size: 17.5px; line-height: 1.8; color: #33423A;
  :global(h2) { font-family: $font-serif; font-weight: 600; font-size: 28px; color: $nd-text; margin: 40px 0 14px; letter-spacing: -.01em; }
  :global(h3) { font-size: 20px; font-weight: 700; color: $nd-text; margin: 28px 0 12px; }
  :global(p) { margin: 0 0 22px; }
  :global(blockquote) { margin: 32px 0; padding: 20px 26px; border-inline-start: 4px solid $nd-green-mid; background: #F2F8F2; border-radius: 0 12px 12px 0; font-family: $font-serif; font-style: italic; font-size: 20px; color: $nd-green-dark; line-height: 1.5; }
  :global(ul) { margin: 0 0 24px; padding-inline-start: 22px; display: flex; flex-direction: column; gap: 10px; }
}
.nd-aside { display: flex; flex-direction: column; gap: 22px; position: sticky; top: 96px; @include bp-920 { order: -1; position: static; } }
.nd-aside__author { border: 1px solid $nd-border; border-radius: 18px; padding: 26px; background: $nd-bg-soft; p { margin: 0 0 14px; font-size: 14px; line-height: 1.65; color: $nd-text-muted; } }
.nd-aside__author-head { display: flex; align-items: center; gap: 13px; margin-bottom: 14px; }
.nd-aside__avatar { width: 52px; height: 52px; border-radius: 50%; background: linear-gradient(140deg, $nd-green-mid, $nd-green); display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 20px; }
.nd-aside__name { font-weight: 700; font-size: 16px; }
.nd-aside__role { font-size: 13px; color: $nd-green; font-weight: 600; }
.nd-aside__cta { color: $nd-green-dark; font-weight: 700; font-size: 14px; text-decoration: none; border-bottom: 2px solid $nd-green-light; padding-bottom: 2px; }
.nd-aside__related { border: 1px solid $nd-border; border-radius: 18px; padding: 26px; h4 { margin: 0 0 16px; font-size: 13px; letter-spacing: .1em; text-transform: uppercase; color: $nd-green; font-weight: 700; } }
.nd-aside__related-list { display: flex; flex-direction: column; gap: 14px; a { text-decoration: none; color: $nd-text; font-size: 15px; font-weight: 600; line-height: 1.4; &:hover { color: $nd-green; } } }
.nd-aside__sub { border-radius: 18px; padding: 26px; background: linear-gradient(140deg, $nd-green-dark, $nd-green); color: #fff; h4 { margin: 0 0 8px; font-family: $font-serif; font-size: 21px; font-weight: 600; } p { margin: 0 0 16px; font-size: 14px; color: #D6E8D8; line-height: 1.6; } }
.nd-aside__sub-btn { display: block; text-align: center; background: #fff; color: $nd-green-dark; text-decoration: none; font-weight: 700; font-size: 15px; padding: 12px; border-radius: 12px; }

.nd-share {
  max-width: 1120px; margin: -50px auto 0; padding: 0 28px 40px; display: flex; align-items: center; gap: 14px; flex-wrap: wrap;
  span:first-child { font-size: 14px; font-weight: 700; color: $nd-text; }
  button, a { font-family: inherit; cursor: pointer; border: 1px solid $nd-border-green; background: #fff; color: $nd-green-dark; font-weight: 600; font-size: 14px; padding: 9px 16px; border-radius: 999px; display: flex; align-items: center; gap: 7px; text-decoration: none; &:hover { background: #EAF4EA; } }
}

.nd-more { background: $nd-bg-soft; border-top: 1px solid $nd-border-soft; }
.nd-more__inner { max-width: 1180px; margin: 0 auto; padding: 80px 28px; h2 { font-family: $font-serif; font-weight: 500; font-size: 34px; margin: 0 0 36px; letter-spacing: -.02em; } @include bp-560 { padding-left: 20px; padding-right: 20px; } }
.nd-more__grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; @include bp-560 { grid-template-columns: 1fr; } }
.nd-more__card { text-decoration: none; color: inherit; background: #fff; border: 1px solid $nd-border-soft; border-radius: 18px; overflow: hidden; display: flex; flex-direction: column; transition: .2s; &:hover { box-shadow: 0 16px 40px rgba(15,36,23,.1); transform: translateY(-4px); } }
.nd-more__img { height: 150px; background: linear-gradient(140deg, $nd-green-mid, $nd-green); display: flex; align-items: flex-end; padding: 14px; span { background: rgba(255,255,255,.92); color: $nd-green-dark; font-size: 12px; font-weight: 700; padding: 5px 12px; border-radius: 999px; } }
.nd-more__body { padding: 20px; h3 { font-size: 17.5px; font-weight: 700; line-height: 1.32; margin: 0 0 8px; } span { font-size: 13px; color: #8A9A8E; } }
```

Note: Angular's component-scoped CSS does not support a literal `:global()` pseudo function the way some other frameworks do — for content injected via `[innerHTML]` (which Angular's view encapsulation does not scope anyway since it's raw DOM, not template-rendered), drop the `:global(...)` wrapper and write plain selectors instead (e.g. `.nd-article h2 { ... }` instead of `.nd-article :global(h2) { ... }`). Use this corrected, equivalent form in the actual file:

```scss
.nd-article {
  font-size: 17.5px; line-height: 1.8; color: #33423A;
  h2 { font-family: $font-serif; font-weight: 600; font-size: 28px; color: $nd-text; margin: 40px 0 14px; letter-spacing: -.01em; }
  h3 { font-size: 20px; font-weight: 700; color: $nd-text; margin: 28px 0 12px; }
  p { margin: 0 0 22px; }
  blockquote { margin: 32px 0; padding: 20px 26px; border-inline-start: 4px solid $nd-green-mid; background: #F2F8F2; border-radius: 0 12px 12px 0; font-family: $font-serif; font-style: italic; font-size: 20px; color: $nd-green-dark; line-height: 1.5; }
  ul { margin: 0 0 24px; padding-inline-start: 22px; display: flex; flex-direction: column; gap: 10px; }
}
```

- [ ] **Step 4: Write the behavior test (route param, related rendering, copy link)**

Create `frontend/src/app/pages/blog-post/blog-post.component.spec.ts`:

```ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { BlogPostComponent } from './blog-post.component';
import { BlogService } from '../../core/blog.service';
import { BlogPostDetail } from '../../shared/models/blog.models';

describe('BlogPostComponent', () => {
  let fixture: ComponentFixture<BlogPostComponent>;
  let blogServiceSpy: jasmine.SpyObj<BlogService>;

  const detail: BlogPostDetail = {
    id: 1, slug: 'protein-timing', title_en: 'Protein Timing', title_ar: 'توقيت البروتين',
    excerpt_en: 'e', excerpt_ar: 'م', body_en: '<p>Body EN</p>', body_ar: '<p>Body AR</p>',
    author: 'Dr. Karim Eltaher', cover_image_url: '', read_time_minutes: 6, published_at: '2026-05-28',
    category: { id: 1, name_en: 'Clinical Nutrition', name_ar: 'تغذية إكلينيكية', slug: 'clinical' },
    related: [
      { id: 2, slug: 'myths', title_en: 'Myths', title_ar: 'خرافات', excerpt_en: 'e', excerpt_ar: 'م', author: 'Dr. Karim Eltaher', cover_image_url: '', read_time_minutes: 5, published_at: '2026-05-20', category: { id: 1, name_en: 'Clinical Nutrition', name_ar: 'تغذية إكلينيكية', slug: 'clinical' } },
    ],
  };

  beforeEach(async () => {
    blogServiceSpy = jasmine.createSpyObj('BlogService', ['post']);
    blogServiceSpy.post.and.returnValue(of(detail));

    await TestBed.configureTestingModule({
      imports: [BlogPostComponent],
      providers: [
        provideRouter([]),
        { provide: BlogService, useValue: blogServiceSpy },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ slug: 'protein-timing' }) } } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(BlogPostComponent);
    fixture.detectChanges();
  });

  it('fetches the post by the route slug', () => {
    expect(blogServiceSpy.post).toHaveBeenCalledWith('protein-timing');
  });

  it('renders the English title and related article link', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Protein Timing');
    expect(text).toContain('Myths');
  });

  it('copyLink sets copied state temporarily', (done) => {
    const component = fixture.componentInstance;
    spyOn(navigator.clipboard, 'writeText').and.returnValue(Promise.resolve());
    component.copyLink();
    expect(component.copied()).toBe(true);
    setTimeout(() => {
      expect(component.copied()).toBe(false);
      done();
    }, 1900);
  });
});
```

- [ ] **Step 5: Run build and tests**

```bash
cd frontend
npx ng build
npx ng test --watch=false --browsers=ChromeHeadless
```

Expected: build succeeds — this is the last route registered in Task 5's `app.routes.ts`, so the whole app now compiles cleanly end-to-end. All `BlogPostComponent` specs pass.

- [ ] **Step 6: Manually verify against the live backend**

With Django running and at least one published post seeded, open `http://localhost:4200/blog`, click a post card, confirm the detail page renders the CKEditor body HTML, author sidebar, and related posts (if the category has other published posts), and that "Copy link" and the WhatsApp share button work.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/app/pages/blog-post
git commit -m "Add BlogPost detail page wired to post-detail API"
```

---

## Task 13: End-to-end verification and CORS sanity check

**Files:** none created — this task only runs and observes the system.

**Interfaces:** none new — verifies all interfaces from Tasks 1–12 work together against the real `backend/`.

- [ ] **Step 1: Confirm CORS is already correctly configured**

Read `backend/config/settings.py:160-162` — confirm `CORS_ALLOWED_ORIGINS = ["http://localhost:4200"]` is present (it already was, as verified at planning time). No change needed; this step is a verification, not a step that edits the file.

- [ ] **Step 2: Start the Django backend**

```bash
cd backend
.venv/bin/python manage.py runserver
```

Expected: server starts on `http://localhost:8000` with no errors. If the database is empty of blog content, seed at least one `Category` and one published `BlogPost` via `http://localhost:8000/admin/` before continuing (needed for Task 11/12's manual checks to show real data).

- [ ] **Step 3: Start the Angular dev server**

```bash
cd frontend
npx ng serve
```

Expected: compiles with no errors, serves on `http://localhost:4200`.

- [ ] **Step 4: Walk every route manually**

Visit, in order: `/`, `/about`, `/services`, `/subscription` (submit the 3-step form), `/contact` (submit the form), `/blog` (filter by category, search, paginate if more than 6 results), `/blog/<a real slug>` (confirm related posts and body HTML render). For every page, click the nav's language toggle and confirm the full page — text, layout direction, nav, footer — flips to Arabic/RTL and back.

- [ ] **Step 5: Run the full test suite one more time**

```bash
cd frontend
npx ng build
npx ng test --watch=false --browsers=ChromeHeadless
```

Expected: build succeeds with zero errors, all specs across all 12 prior tasks pass.

- [ ] **Step 6: Report scope completion to the user**

No commit for this task (verification only). Summarize to the user: all 7 pages ported, wired to the real backend, lang/RTL switching works, and flag the two known limitations called out in Task 11 (the `PAGE_SIZE: 9` truncation if the blog catalog grows, and that `project/` was left in place as the visual reference per the design spec's "Out of scope" section — removing it is a follow-up the user can request separately).

---
