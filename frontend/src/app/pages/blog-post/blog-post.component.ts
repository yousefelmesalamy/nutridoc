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
  readonly notFound = signal(false);

  constructor() {
    const slug = this.route.snapshot.paramMap.get('slug')!;
    this.blogService.post(slug).subscribe({
      next: (p) => {
        this.post.set(p);
        this.loading.set(false);
      },
      error: () => {
        this.notFound.set(true);
        this.loading.set(false);
      },
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
  readonly notFoundMsg = computed(() => (this.ar() ? 'المقال غير موجود.' : 'Article not found.'));
}
