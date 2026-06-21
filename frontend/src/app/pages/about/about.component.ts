import { Component, computed, inject } from '@angular/core';
import { NavComponent } from '../../shared/nav/nav.component';
import { FooterComponent } from '../../shared/footer/footer.component';
import { LangService } from '../../core/lang.service';

interface Achievement { stat: string; text: string; }
interface Education { years: string; title: string; detail: string; }
interface Experience { period: string; role: string; org: string; }
interface Social { glyph: string; handle: string; href: string; }

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [NavComponent, FooterComponent],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss',
})
export class AboutComponent {
  private readonly langService = inject(LangService);
  readonly lang = this.langService.lang;
  readonly ar = computed(() => this.lang() === 'ar');

  readonly heroEyebrow = computed(() => (this.ar() ? 'تعرّف على خبيرك' : 'Meet your expert'));
  readonly name = computed(() => (this.ar() ? 'د. كريم الطاهر' : 'Dr. Karim Eltaher'));
  readonly title = computed(() => (this.ar() ? 'صيدلي إكلينيكي وخبير تغذية معتمد' : 'Clinical Pharmacist & Certified Nutrition Expert'));
  readonly credentials = computed<string[]>(() => this.ar()
    ? ['مرخّص من الهيئة السعودية (SCFHS)', 'خبير تغذية معتمد (المملكة المتحدة)', 'صيدلي إكلينيكي']
    : ['SCFHS Licensed', 'Certified Nutrition Expert (UK)', 'Clinical Pharmacist']);

  readonly summaryEyebrow = computed(() => (this.ar() ? 'نبذة' : 'Professional summary'));
  readonly summaryH2 = computed(() => (this.ar() ? 'علمٌ دقيق، رعايةٌ دافئة' : 'Precision Science, Warm Care'));
  readonly summary = computed(() => this.ar()
    ? 'يجمع د. كريم الطاهر بين خمس سنوات من الخبرة الإكلينيكية في الصيدلة وشهادة معتمدة في التغذية وإدارة السمنة من المملكة المتحدة. بصفته مؤسس نوتري دوك، يبني خططاً غذائية مبنية على الأدلة تأخذ في الاعتبار أدويتك وحالتك الصحية ونمط حياتك — لا حلولاً عامة، بل خططاً مصممة لك أنت.'
    : 'Dr. Karim Eltaher combines five years of clinical pharmacy experience with a certified qualification in Nutrition & Obesity Management from the UK. As the founder of NutriDoc, he builds evidence-based nutrition plans that account for your medications, medical conditions, and lifestyle — not generic templates, but plans designed for you.');

  readonly achH2 = computed(() => (this.ar() ? 'إنجازات رئيسية' : 'Key Achievements'));
  readonly achievements = computed<Achievement[]>(() => {
    const ar = this.ar();
    return [
      { stat: '20k+', text: ar ? 'مجتمع متنامٍ على تيك توك يثق بمحتواه التوعوي.' : 'A growing TikTok community trusting his educational content.' },
      { stat: '300k+', text: ar ? 'مشاهدة على يوتيوب لمحتوى تغذوي مبني على العلم.' : 'YouTube views on science-based nutrition content.' },
      { stat: '5+', text: ar ? 'سنوات من الخبرة الإكلينيكية بين الصيدلة والتغذية.' : 'Years of clinical experience across pharmacy and nutrition.' },
      { stat: '100s', text: ar ? 'من العملاء حققوا أهدافهم الصحية بخطط مخصصة.' : 'Of clients who reached their health goals with custom plans.' },
    ];
  });

  readonly eduEyebrow = computed(() => (this.ar() ? 'المؤهلات' : 'Credentials'));
  readonly eduH2 = computed(() => (this.ar() ? 'التعليم والشهادات' : 'Education & Certifications'));
  readonly education = computed<Education[]>(() => {
    const ar = this.ar();
    return [
      { years: '2015 – 2020', title: ar ? 'بكالوريوس الصيدلة الإكلينيكية' : 'Bachelor of Clinical Pharmacy', detail: ar ? 'جامعة القاهرة' : 'Cairo University' },
      { years: ar ? 'منذ نوفمبر ٢٠٢٢' : 'Since Nov 2022', title: ar ? 'ترخيص الهيئة السعودية للتخصصات الصحية' : 'SCFHS License', detail: 'No. 1401469300' },
      { years: ar ? 'منذ نوفمبر ٢٠٢٠' : 'Since Nov 2020', title: ar ? 'ترخيص وزارة الصحة المصرية' : 'MOH Egypt License', detail: 'No. 272226' },
      { years: '120 CH', title: ar ? 'التغذية وإدارة السمنة' : 'Nutrition & Obesity Management', detail: ar ? 'كلية ليدز للتدريب (المملكة المتحدة)' : 'Leeds Training College (UK)' },
    ];
  });

  readonly expEyebrow = computed(() => (this.ar() ? 'المسيرة المهنية' : 'Career'));
  readonly expH2 = computed(() => (this.ar() ? 'الخبرات العملية' : 'Work Experience'));
  readonly experience = computed<Experience[]>(() => {
    const ar = this.ar();
    return [
      { period: ar ? 'نوفمبر ٢٠٢٢ – الآن' : 'Nov 2022 – Present', role: ar ? 'صيدلي إكلينيكي' : 'Clinical Pharmacist', org: ar ? 'شركة ليمون الطبية' : 'Lemon Medical Company' },
      { period: ar ? 'يناير ٢٠٢١ – أكتوبر ٢٠٢٢' : 'Jan 2021 – Oct 2022', role: ar ? 'صيدلي' : 'Pharmacist', org: ar ? 'سلسلة صيدليات د. أسامة الطيبي' : 'Dr. Osama Altaieby Pharmacy Chain' },
      { period: ar ? '٢٠٢٠ – الآن' : '2020 – Present', role: ar ? 'المؤسس وخبير التغذية' : 'Founder & Nutrition Expert', org: 'NutriDoc' },
    ];
  });

  readonly skillsEyebrow = computed(() => (this.ar() ? 'المهارات' : 'Expertise'));
  readonly skillsH2 = computed(() => (this.ar() ? 'مجالات الخبرة' : 'Skills & Expertise'));
  readonly skills = computed<string[]>(() => this.ar()
    ? ['الصيدلة الإكلينيكية', 'تخطيط التغذية', 'إدارة الوزن', 'تفاعلات الدواء والغذاء', 'التغذية لمرضى الأمراض المزمنة', 'إدارة السمنة', 'التواصل والتثقيف', 'صناعة المحتوى', 'المتابعة والتحفيز']
    : ['Clinical Pharmacy', 'Nutrition Planning', 'Weight Management', 'Drug–Food Interactions', 'Disease-Specific Nutrition', 'Obesity Management', 'Patient Education', 'Content Creation', 'Coaching & Motivation']);

  readonly followH2 = computed(() => (this.ar() ? 'تابع نوتري دوك' : 'Follow NutriDoc'));
  readonly followSub = computed(() => (this.ar() ? 'نصائح يومية مبنية على العلم عبر منصاتك المفضلة.' : 'Daily science-based tips across your favorite platforms.'));
  readonly socials: Social[] = [
    { glyph: '⊚', handle: 'Instagram', href: 'https://instagram.com/dr.karimeltaher' },
    { glyph: '♪', handle: 'TikTok', href: 'https://tiktok.com/@dr.karimeltaher' },
    { glyph: '▶', handle: 'YouTube', href: 'https://youtube.com/@nutridoc' },
    { glyph: 'f', handle: 'Facebook', href: 'https://facebook.com/nutridoc' },
  ];
}
