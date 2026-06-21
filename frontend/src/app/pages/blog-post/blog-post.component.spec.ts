import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { BlogPostComponent } from './blog-post.component';
import { BlogService } from '../../core/blog.service';
import { BlogPostDetail } from '../../shared/models/blog.models';

describe('BlogPostComponent', () => {
  let fixture: ComponentFixture<BlogPostComponent>;
  let blogServiceSpy: { post: ReturnType<typeof vi.fn> };

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
    blogServiceSpy = { post: vi.fn() };
    blogServiceSpy.post.mockReturnValue(of(detail));

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

  it('copyLink sets copied state temporarily', async () => {
    const component = fixture.componentInstance;
    if (!navigator.clipboard) {
      Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn() }, configurable: true });
    }
    vi.spyOn(navigator.clipboard, 'writeText').mockReturnValue(Promise.resolve());
    component.copyLink();
    expect(component.copied()).toBe(true);
    await new Promise((resolve) => setTimeout(resolve, 1900));
    expect(component.copied()).toBe(false);
  });

});

describe('BlogPostComponent (error case)', () => {
  it('shows a not-found message and stops loading when the post request errors', async () => {
    const errorSpy: { post: ReturnType<typeof vi.fn> } = { post: vi.fn() };
    errorSpy.post.mockReturnValue(throwError(() => new Error('not found')));

    await TestBed.configureTestingModule({
      imports: [BlogPostComponent],
      providers: [
        provideRouter([]),
        { provide: BlogService, useValue: errorSpy },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ slug: 'missing-post' }) } } },
      ],
    }).compileComponents();
    const errorFixture = TestBed.createComponent(BlogPostComponent);
    errorFixture.detectChanges();
    const component = errorFixture.componentInstance;

    expect(component.loading()).toBe(false);
    expect(component.notFound()).toBe(true);
    expect(errorFixture.nativeElement.textContent).toContain('Article not found.');
  });
});
