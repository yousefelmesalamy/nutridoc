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
