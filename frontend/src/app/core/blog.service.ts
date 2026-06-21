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
