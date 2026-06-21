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
