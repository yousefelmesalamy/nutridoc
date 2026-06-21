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

  onSearchInputEvent(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.onSearchInput(value);
  }

  goToPage(p: number): void {
    this.page.set(p);
  }

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.allPosts().length / PER_PAGE)));
  readonly pageNumbers = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i + 1));
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
