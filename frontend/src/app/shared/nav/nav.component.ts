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
