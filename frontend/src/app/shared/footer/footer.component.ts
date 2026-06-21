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
