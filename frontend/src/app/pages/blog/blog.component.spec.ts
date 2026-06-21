import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
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
  let blogServiceSpy: { categories: ReturnType<typeof vi.fn>; posts: ReturnType<typeof vi.fn> };
  const categories: Category[] = [{ id: 1, name_en: 'Weight', name_ar: 'الوزن', slug: 'weight' }];

  function setup(posts: BlogPostSummary[]) {
    blogServiceSpy = { categories: vi.fn(), posts: vi.fn() };
    blogServiceSpy.categories.mockReturnValue(of(categories));
    blogServiceSpy.posts.mockReturnValue(of(posts));
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

  it('stops loading and clears posts when the posts request errors', () => {
    blogServiceSpy = { categories: vi.fn(), posts: vi.fn() };
    blogServiceSpy.categories.mockReturnValue(of(categories));
    blogServiceSpy.posts.mockReturnValue(throwError(() => new Error('network error')));
    TestBed.configureTestingModule({
      imports: [BlogComponent],
      providers: [provideRouter([]), { provide: BlogService, useValue: blogServiceSpy }],
    });
    fixture = TestBed.createComponent(BlogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.loading()).toBe(false);
    expect(component.allPosts().length).toBe(0);
  });

  it('stops loading when the categories request errors', () => {
    blogServiceSpy = { categories: vi.fn(), posts: vi.fn() };
    blogServiceSpy.categories.mockReturnValue(throwError(() => new Error('network error')));
    blogServiceSpy.posts.mockReturnValue(of([]));
    TestBed.configureTestingModule({
      imports: [BlogComponent],
      providers: [provideRouter([]), { provide: BlogService, useValue: blogServiceSpy }],
    });
    fixture = TestBed.createComponent(BlogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.categories().length).toBe(0);
    expect(component.loading()).toBe(false);
  });
});
