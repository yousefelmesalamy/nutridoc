import { Component, computed, inject, signal } from '@angular/core';
import { NavComponent } from '../../shared/nav/nav.component';
import { FooterComponent } from '../../shared/footer/footer.component';
import { LangService } from '../../core/lang.service';
import { LeadsService } from '../../core/leads.service';

interface FormState { name: string; email: string; phone: string; subject: string; message: string; }
interface InfoCard { icon: 'mail' | 'phone' | 'pin'; label: string; value: string; href: string; dir: 'ltr' | 'rtl'; }
interface Social { name: string; glyph: string; href: string; }

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [NavComponent, FooterComponent],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss',
})
export class ContactComponent {
  private readonly langService = inject(LangService);
  private readonly leadsService = inject(LeadsService);
  readonly lang = this.langService.lang;
  readonly ar = computed(() => this.lang() === 'ar');

  readonly sending = signal(false);
  readonly sent = signal(false);
  readonly errors = signal<Record<string, string>>({});
  readonly form = signal<FormState>({ name: '', email: '', phone: '', subject: 'general', message: '' });

  setField<K extends keyof FormState>(key: K, value: FormState[K]): void {
    this.form.update((f) => ({ ...f, [key]: value }));
    this.errors.update((e) => {
      const next = { ...e };
      delete next[key];
      return next;
    });
  }

  setFieldFromInput(key: keyof FormState, event: Event): void {
    const value = (event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).value;
    this.setField(key, value as FormState[typeof key]);
  }

  submit(): void {
    const ar = this.ar();
    const f = this.form();
    const e: Record<string, string> = {};
    const req = ar ? 'مطلوب' : 'Required';
    if (!f.name.trim()) e['name'] = req;
    if (!f.email.trim()) e['email'] = req;
    else if (!EMAIL_RE.test(f.email)) e['email'] = ar ? 'بريد غير صحيح' : 'Invalid email';
    if (!f.message.trim()) e['message'] = req;
    this.errors.set(e);
    if (Object.keys(e).length) return;

    this.sending.set(true);
    this.leadsService.submitContact(f).subscribe({
      next: () => { this.sending.set(false); this.sent.set(true); },
      error: () => { this.sending.set(false); this.sent.set(true); },
    });
  }

  readonly eyebrow = computed(() => (this.ar() ? 'تواصل' : 'Get in touch'));
  readonly h1 = computed(() => (this.ar() ? 'تواصل مع د. كريم' : 'Contact Dr. Karim'));
  readonly intro = computed(() => this.ar()
    ? 'أسئلة، استشارات، أو استفسارات إعلامية — يسعدنا أن نسمع منك.'
    : "Questions, consultations, or media inquiries — we'd love to hear from you.");

  readonly infoCards = computed<InfoCard[]>(() => {
    const ar = this.ar();
    return [
      { icon: 'mail', label: ar ? 'البريد الإلكتروني' : 'Email', value: 'karimeltaher640@gmail.com', href: 'mailto:karimeltaher640@gmail.com', dir: 'ltr' },
      { icon: 'phone', label: ar ? 'الهاتف' : 'Phone', value: '+966 54 993 0730', href: 'tel:+966549930730', dir: 'ltr' },
      { icon: 'pin', label: ar ? 'الموقع' : 'Location', value: ar ? 'الرياض، العليا، السعودية' : 'Riyadh, Olaya, KSA', href: '#', dir: ar ? 'rtl' : 'ltr' },
    ];
  });

  readonly followLabel = computed(() => (this.ar() ? 'تابعنا' : 'Follow us'));
  readonly socials: Social[] = [
    { name: 'Instagram', glyph: '⊚', href: 'https://instagram.com/dr.karimeltaher' },
    { name: 'TikTok', glyph: '♪', href: 'https://tiktok.com/@dr.karimeltaher' },
    { name: 'YouTube', glyph: '▶', href: 'https://youtube.com/@nutridoc' },
    { name: 'Facebook', glyph: 'f', href: 'https://facebook.com/nutridoc' },
  ];

  readonly L = computed(() => {
    const ar = this.ar();
    return {
      name: ar ? 'الاسم' : 'Name', email: ar ? 'البريد الإلكتروني' : 'Email', phone: ar ? 'الهاتف (اختياري)' : 'Phone (optional)',
      subject: ar ? 'الموضوع' : 'Subject', message: ar ? 'الرسالة' : 'Message',
    };
  });

  readonly subjectOpts = computed(() => {
    const ar = this.ar();
    return [
      { v: 'general', label: ar ? 'استفسار عام' : 'General Inquiry' },
      { v: 'consult', label: ar ? 'استشارة تغذية' : 'Nutrition Consultation' },
      { v: 'media', label: ar ? 'إعلام' : 'Media' },
      { v: 'partnership', label: ar ? 'شراكة' : 'Partnership' },
    ];
  });

  readonly submitLabel = computed(() => (this.sending() ? (this.ar() ? 'جارٍ الإرسال...' : 'Sending...') : (this.ar() ? 'إرسال الرسالة' : 'Send Message')));
  readonly sentTitle = computed(() => (this.ar() ? 'تم إرسال رسالتك!' : 'Message Sent!'));
  readonly sentText = computed(() => (this.ar() ? 'شكراً لتواصلك. سيرد عليك د. كريم في أقرب وقت.' : 'Thanks for reaching out. Dr. Karim will get back to you shortly.'));
}
