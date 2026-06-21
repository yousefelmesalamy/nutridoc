import { Component, computed, inject, signal } from '@angular/core';
import { NavComponent } from '../../shared/nav/nav.component';
import { FooterComponent } from '../../shared/footer/footer.component';
import { LangService } from '../../core/lang.service';
import { LeadsService } from '../../core/leads.service';

interface FormState {
  fullName: string; email: string; phone: string; age: string; gender: string;
  height: string; currentWeight: string; targetWeight: string;
  goal: string; activity: string;
  medical: string; allergies: string; medications: string; agree: boolean;
}

type PlanKey = 'basic' | 'pro' | 'premium';

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

@Component({
  selector: 'app-subscription',
  standalone: true,
  imports: [NavComponent, FooterComponent],
  templateUrl: './subscription.component.html',
  styleUrl: './subscription.component.scss',
})
export class SubscriptionComponent {
  private readonly langService = inject(LangService);
  private readonly leadsService = inject(LeadsService);
  readonly lang = this.langService.lang;
  readonly ar = computed(() => this.lang() === 'ar');

  readonly selected = signal<PlanKey>('pro');
  readonly step = signal<1 | 2 | 3>(1);
  readonly submitted = signal(false);
  readonly submitting = signal(false);
  readonly errors = signal<Record<string, string>>({});
  readonly form = signal<FormState>({
    fullName: '', email: '', phone: '', age: '', gender: '',
    height: '', currentWeight: '', targetWeight: '',
    goal: 'lose_weight', activity: 'moderate',
    medical: '', allergies: '', medications: '', agree: false,
  });

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

  setFieldFromCheckbox(key: keyof FormState, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.setField(key, checked as FormState[typeof key]);
  }

  selectPlan(key: PlanKey): void {
    this.selected.set(key);
  }

  private validateStep(): boolean {
    const ar = this.ar();
    const f = this.form();
    const e: Record<string, string> = {};
    const req = ar ? 'هذا الحقل مطلوب' : 'This field is required';

    if (this.step() === 1) {
      if (!f.fullName.trim()) e['fullName'] = req;
      if (!f.email.trim()) e['email'] = req;
      else if (!EMAIL_RE.test(f.email)) e['email'] = ar ? 'بريد إلكتروني غير صحيح' : 'Invalid email address';
      if (!f.phone.trim()) e['phone'] = req;
      if (!String(f.age).trim()) e['age'] = req;
      else if (Number(f.age) < 18) e['age'] = ar ? 'يجب أن يكون العمر ١٨ أو أكثر' : 'Must be 18 or older';
    }
    if (this.step() === 2) {
      if (!String(f.height).trim()) e['height'] = req;
      if (!String(f.currentWeight).trim()) e['currentWeight'] = req;
      if (!String(f.targetWeight).trim()) e['targetWeight'] = req;
    }
    if (this.step() === 3) {
      if (!f.agree) e['agree'] = ar ? 'يجب الموافقة على الشروط للمتابعة' : 'You must agree to the terms to continue';
    }
    this.errors.set(e);
    return Object.keys(e).length === 0;
  }

  goNext(): void {
    if (!this.validateStep()) return;
    if (this.step() < 3) {
      this.step.set((this.step() + 1) as 1 | 2 | 3);
      return;
    }
    this.submitting.set(true);
    const f = this.form();
    const detailLines = [
      `Age: ${f.age}`, `Gender: ${f.gender}`,
      `Height: ${f.height} cm`, `Current weight: ${f.currentWeight} kg`, `Target weight: ${f.targetWeight} kg`,
      `Goal: ${f.goal}`, `Activity: ${f.activity}`,
      `Medical conditions: ${f.medical || '-'}`, `Allergies: ${f.allergies || '-'}`, `Medications: ${f.medications || '-'}`,
    ].join('\n');
    this.leadsService.submitPlanRequest({
      name: f.fullName, email: f.email, phone: f.phone, plan: this.selected(),
      message: detailLines,
    }).subscribe({
      next: () => { this.submitting.set(false); this.submitted.set(true); },
      error: () => { this.submitting.set(false); this.submitted.set(true); },
    });
  }

  goBack(): void {
    this.step.set(Math.max(1, this.step() - 1) as 1 | 2 | 3);
    this.errors.set({});
  }

  readonly planMeta = computed(() => {
    const ar = this.ar();
    return [
      { key: 'basic' as PlanKey, popular: false, accent: 'basic', name: ar ? 'أساسي' : 'Basic', price: ar ? '٩٩' : '99' },
      { key: 'pro' as PlanKey, popular: true, accent: 'pro', name: ar ? 'برو' : 'Pro', price: ar ? '١٩٩' : '199' },
      { key: 'premium' as PlanKey, popular: false, accent: 'premium', name: ar ? 'بريميوم' : 'Premium', price: ar ? '٣٤٩' : '349' },
    ];
  });

  private readonly featDefs = [
    { en: 'Custom meal plan', ar: 'خطة وجبات مخصصة', b: true, p: true, pr: true },
    { en: 'WhatsApp follow-up', ar: 'متابعة عبر واتساب', b: false, p: true, pr: true },
    { en: 'Supplement guide', ar: 'دليل المكملات', b: false, p: true, pr: true },
    { en: 'Monthly check-in call', ar: 'مكالمة متابعة شهرية', b: false, p: false, pr: true },
    { en: 'Drug–nutrition review', ar: 'مراجعة الدواء والغذاء', b: false, p: false, pr: true },
  ];

  features(planKey: PlanKey) {
    const ar = this.ar();
    const fld = planKey === 'basic' ? 'b' : planKey === 'pro' ? 'p' : 'pr';
    return this.featDefs.map((fd) => {
      const inc = (fd as any)[fld] as boolean;
      return { label: ar ? fd.ar : fd.en, included: inc };
    });
  }

  readonly period = computed(() => (this.ar() ? 'ريال/شهر' : 'SAR/mo'));
  readonly popularLabel = computed(() => (this.ar() ? 'الأكثر شيوعاً' : 'MOST POPULAR'));
  readonly selectedPlanName = computed(() => this.planMeta().find((p) => p.key === this.selected())!.name);
  readonly selectedNote = computed(() => (this.ar() ? 'الخطة المختارة: ' : 'Selected plan: ') + this.selectedPlanName());

  readonly eyebrow = computed(() => (this.ar() ? 'الاشتراك' : 'Your plan'));
  readonly h1 = computed(() => (this.ar() ? 'احصل على خطة تغذيتك المخصصة' : 'Get Your Personalized Nutrition Plan'));
  readonly intro = computed(() => this.ar()
    ? 'اختر خطتك، أخبرنا عن جسمك وأهدافك، وسيصمم د. كريم خطة مبنية على العلم خصيصاً لك.'
    : "Choose your plan, tell us about your body and goals, and Dr. Karim will craft a science-backed plan just for you.");

  readonly stepLabels = computed(() => this.ar()
    ? ['البيانات الشخصية', 'الجسم والأهداف', 'الطبية والتأكيد']
    : ['Your details', 'Body & goals', 'Medical & confirm']);

  readonly step1Title = computed(() => (this.ar() ? 'بياناتك الشخصية' : 'Your Details'));
  readonly step2Title = computed(() => (this.ar() ? 'جسمك وأهدافك' : 'Body & Goals'));
  readonly step3Title = computed(() => (this.ar() ? 'معلومات طبية' : 'Medical Information'));
  readonly step3Sub = computed(() => this.ar()
    ? 'خلفية د. كريم في الصيدلة تجعل هذه المعلومات قيّمة جداً لخطتك.'
    : "Dr. Karim's pharmacy background makes this information especially valuable for your plan.");

  readonly L = computed(() => {
    const ar = this.ar();
    return {
      fullName: ar ? 'الاسم الكامل' : 'Full name', email: ar ? 'البريد الإلكتروني' : 'Email', phone: ar ? 'رقم الجوال' : 'Phone', age: ar ? 'العمر' : 'Age', gender: ar ? 'الجنس' : 'Gender',
      height: ar ? 'الطول (سم)' : 'Height (cm)', currentWeight: ar ? 'الوزن الحالي (كجم)' : 'Current weight (kg)', targetWeight: ar ? 'الوزن المستهدف (كجم)' : 'Target weight (kg)',
      goal: ar ? 'الهدف' : 'Goal', activity: ar ? 'مستوى النشاط' : 'Activity level',
      medical: ar ? 'حالات طبية (اختياري)' : 'Medical conditions (optional)', allergies: ar ? 'حساسية غذائية (اختياري)' : 'Allergies (optional)',
      medications: ar ? 'الأدوية الحالية' : 'Current medications', medsHint: ar ? '(موصى به)' : '(recommended)',
      agree: ar ? 'أوافق على شروط الخدمة وسياسة الخصوصية الخاصة بنوتري دوك.' : "I agree to NutriDoc's terms of service and privacy policy.",
    };
  });

  readonly genderOpts = computed(() => {
    const ar = this.ar();
    return [{ v: 'male', label: ar ? 'ذكر' : 'Male' }, { v: 'female', label: ar ? 'أنثى' : 'Female' }];
  });
  readonly goalOpts = computed(() => {
    const ar = this.ar();
    return [
      { v: 'lose_weight', label: ar ? 'فقدان الوزن' : 'Lose weight' },
      { v: 'gain_muscle', label: ar ? 'بناء العضلات' : 'Gain muscle' },
      { v: 'maintain', label: ar ? 'المحافظة' : 'Maintain' },
      { v: 'medical', label: ar ? 'حالة طبية' : 'Medical / condition' },
    ];
  });
  readonly activityOpts = computed(() => {
    const ar = this.ar();
    return [
      { v: 'sedentary', label: ar ? 'خامل' : 'Sedentary' },
      { v: 'light', label: ar ? 'نشاط خفيف' : 'Lightly active' },
      { v: 'moderate', label: ar ? 'نشاط متوسط' : 'Moderately active' },
      { v: 'active', label: ar ? 'نشط' : 'Active' },
      { v: 'very_active', label: ar ? 'نشط جداً' : 'Very active' },
    ];
  });

  readonly nextLabel = computed(() => (this.step() === 3 ? (this.ar() ? 'إرسال الطلب' : 'Submit Request') : (this.ar() ? 'التالي' : 'Next')));
  readonly backLabel = computed(() => (this.ar() ? 'رجوع' : 'Back'));

  readonly successTitle = computed(() => (this.ar() ? 'تم استلام طلبك!' : 'Request Received!'));
  readonly successText = computed(() => this.ar()
    ? 'شكراً لك! سيراجع د. كريم بياناتك ويتواصل معك لتصميم خطتك. يمكنك التواصل معه مباشرة الآن عبر واتساب.'
    : 'Thank you! Dr. Karim will review your details and reach out to craft your plan. You can also message him directly now on WhatsApp.');
  readonly successBtn = computed(() => (this.ar() ? 'تواصل مع د. كريم' : 'Message Dr. Karim'));
  readonly waLink = computed(() => {
    const ar = this.ar();
    const text = ar ? `مرحباً د. كريم، اشتركت في خطة ${this.selectedPlanName()}` : `Hi Dr. Karim, I just subscribed to the ${this.selectedPlanName()} plan`;
    return `https://wa.me/966549930730?text=${encodeURIComponent(text)}`;
  });
}
