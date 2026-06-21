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
