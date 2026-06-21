import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { LangService } from '../../core/lang.service';
import { NavComponent } from '../../shared/nav/nav.component';
import { FooterComponent } from '../../shared/footer/footer.component';

interface TrustPoint { icon: 'pill' | 'book' | 'shield' | 'free'; title: string; desc: string; }
interface HubPost { cat: string; title: string; excerpt?: string; read: string; bg?: string; }
interface Topic { icon: 'scale' | 'myth' | 'clinic' | 'supp' | 'gut' | 'sport'; title: string; desc: string; count: string; }
interface Myth { claim: string; fact: string; }
interface Social { glyph: string; platform: string; handle: string; href: string; }

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, NavComponent, FooterComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  private readonly langService = inject(LangService);
  readonly lang = this.langService.lang;
  readonly ar = computed(() => this.lang() === 'ar');

  private readonly openMythsSet = new Set<number>();
  readonly mythVersion = signal(0);

  toggleMyth(i: number): void {
    if (this.openMythsSet.has(i)) {
      this.openMythsSet.delete(i);
    } else {
      this.openMythsSet.add(i);
    }
    this.mythVersion.set(this.mythVersion() + 1);
  }

  isMythOpen(i: number): boolean {
    this.mythVersion(); // read for reactivity
    return this.openMythsSet.has(i);
  }

  // Hero
  readonly heroEyebrow = computed(() => (this.ar() ? 'تغذية مبنية على الأدلة' : 'Evidence-based nutrition'));
  readonly heroH1a = computed(() => (this.ar() ? 'معلومات صحية' : 'Nutrition advice you can'));
  readonly heroH1b = computed(() => (this.ar() ? 'تثق بها' : 'actually'));
  readonly heroH1c = computed(() => (this.ar() ? 'فعلاً' : 'trust.'));
  readonly heroSub = computed(() => this.ar()
    ? 'مقالات واضحة ومبنية على العلم يكتبها ويراجعها صيدلي إكلينيكي مرخّص. بلا موضات، بلا تهويل — فقط ما تقوله الأدلة.'
    : 'Clear, science-backed articles written and reviewed by a licensed Clinical Pharmacist. No fads, no hype — just what the evidence says.');
  readonly heroCta1 = computed(() => (this.ar() ? 'تصفّح المقالات' : 'Explore the Articles'));
  readonly heroCta2 = computed(() => (this.ar() ? 'تعرّف على د. كريم' : 'Meet Dr. Karim'));
  readonly heroReassure = computed(() => (this.ar() ? 'كل محتوى مُراجَع طبياً · مجاني للجميع' : 'Every article medically reviewed · Free for everyone'));
  readonly heroCardTag = computed(() => (this.ar() ? 'الأكثر قراءة' : 'Most read'));
  readonly heroCardTitle = computed(() => (this.ar() ? 'هل تحتاج فعلاً إلى الفيتامينات المتعددة؟' : 'Do You Actually Need a Multivitamin?'));
  readonly heroCardExcerpt = computed(() => this.ar()
    ? 'نظرة هادئة على ما تقوله الأبحاث — ومتى تكون المكملات مضيعة للمال.'
    : 'A calm look at what the research says — and when supplements are a waste of money.');
  readonly heroCardAuthor = computed(() => (this.ar() ? 'د. كريم الطاهر' : 'Dr. Karim Eltaher'));
  readonly heroCardVerified = computed(() => (this.ar() ? 'مُراجَع' : 'Reviewed'));
  readonly scrollLabel = computed(() => (this.ar() ? 'اكتشف' : 'Scroll'));

  // Trust
  readonly trustEyebrow = computed(() => (this.ar() ? 'لماذا تثق بنا' : 'Why trust us'));
  readonly trustH2 = computed(() => (this.ar() ? 'لأن المعلومة الصحية يجب أن تكون آمنة' : 'Because health information should be safe to act on'));
  readonly trustPoints = computed<TrustPoint[]>(() => {
    const ar = this.ar();
    return [
      { icon: 'pill', title: ar ? 'بقلم صيدلي إكلينيكي' : 'Written by a Pharmacist', desc: ar ? 'كل مقال يكتبه ويراجعه صيدلي إكلينيكي مرخّص.' : 'Every article is written and reviewed by a licensed clinical pharmacist.' },
      { icon: 'book', title: ar ? 'مبني على الأدلة' : 'Backed by Evidence', desc: ar ? 'معلومات من الأبحاث المحكّمة، لا من الموضات العابرة.' : 'Sourced from peer-reviewed research — not passing trends.' },
      { icon: 'shield', title: ar ? 'آمن مع أدويتك' : 'Safe With Your Meds', desc: ar ? 'نراعي تفاعلات الدواء والغذاء التي يغفلها الآخرون.' : "We account for the drug–food interactions others overlook." },
      { icon: 'free', title: ar ? 'مجاني ومتاح' : 'Free & Accessible', desc: ar ? 'معرفة صحية موثوقة، متاحة للجميع دون مقابل.' : 'Trustworthy health knowledge, available to everyone at no cost.' },
    ];
  });

  // Knowledge hub
  readonly hubEyebrow = computed(() => (this.ar() ? 'مركز المعرفة' : 'Knowledge hub'));
  readonly hubH2 = computed(() => (this.ar() ? 'اقرأ. افهم. قرّر بثقة.' : 'Read. Understand. Decide with confidence.'));
  readonly hubSub = computed(() => this.ar()
    ? 'مقالات جديدة كل أسبوع تفكّك المواضيع الصحية المعقدة إلى معرفة عملية.'
    : 'New articles every week that break complex health topics into knowledge you can use.');
  readonly blogAll = computed(() => (this.ar() ? 'كل المقالات' : 'All articles'));
  readonly readMore = computed(() => (this.ar() ? 'اقرأ المقال' : 'Read article'));

  readonly featuredPost = computed<HubPost>(() => {
    const ar = this.ar();
    return {
      cat: ar ? 'تغذية إكلينيكية' : 'Clinical Nutrition',
      title: ar ? 'الحقيقة حول توقيت البروتين — ماذا يقول العلم فعلاً' : 'The Truth About Protein Timing — What the Science Actually Says',
      excerpt: ar
        ? 'النافذة البنائية ومشروبات التمرين، ولماذا الكمية اليومية أهم بكثير من التوقيت.'
        : 'The anabolic window, post-workout shakes, and why your total daily intake matters far more than the clock.',
      read: ar ? '٦ دقائق' : '6 min read',
    };
  });

  readonly restPosts = computed<HubPost[]>(() => {
    const ar = this.ar();
    return [
      { bg: 'linear-gradient(140deg,#1B5E20,#66BB6A)', cat: ar ? 'حقائق وخرافات' : 'Myths & Facts', title: ar ? '٥ خرافات غذائية يكشفها صيدلي' : '5 Food Myths Debunked by a Clinical Pharmacist', read: ar ? '٥ دقائق' : '5 min read' },
      { bg: 'linear-gradient(140deg,#2E7D32,#A5D6A7)', cat: ar ? 'إدارة الوزن' : 'Weight Management', title: ar ? 'لماذا تفشل الحميات القاسية' : 'Why Crash Diets Always Fail', read: ar ? '٧ دقائق' : '7 min read' },
      { bg: 'linear-gradient(140deg,#66BB6A,#1B5E20)', cat: ar ? 'مكملات' : 'Supplements', title: ar ? 'هل تحتاج فعلاً إلى الفيتامينات المتعددة؟' : 'Do You Actually Need a Multivitamin?', read: ar ? '٤ دقائق' : '4 min read' },
    ];
  });

  // Topics
  readonly topicsEyebrow = computed(() => (this.ar() ? 'تصفّح حسب الموضوع' : 'Browse by topic'));
  readonly topicsH2 = computed(() => (this.ar() ? 'ابحث عمّا يهمّك' : 'Find What Matters to You'));
  readonly topics = computed<Topic[]>(() => {
    const ar = this.ar();
    return [
      { icon: 'scale', title: ar ? 'إدارة الوزن' : 'Weight Management', desc: ar ? 'فقدان مستدام بلا حميات قاسية.' : 'Sustainable loss without crash diets.', count: ar ? '٨ مقالات' : '8 articles' },
      { icon: 'myth', title: ar ? 'حقائق وخرافات' : 'Myths & Facts', desc: ar ? 'ادعاءات شائعة تحت مجهر العلم.' : 'Popular claims under the microscope.', count: ar ? '٦ مقالات' : '6 articles' },
      { icon: 'clinic', title: ar ? 'تغذية إكلينيكية' : 'Clinical Nutrition', desc: ar ? 'تغذية لمرضى الحالات المزمنة.' : 'Nutrition for chronic conditions.', count: ar ? '٥ مقالات' : '5 articles' },
      { icon: 'supp', title: ar ? 'المكملات' : 'Supplements', desc: ar ? 'ما يستحق المال وما لا يستحق.' : "What's worth it, what isn't.", count: ar ? '٤ مقالات' : '4 articles' },
      { icon: 'gut', title: ar ? 'صحة الأمعاء' : 'Gut Health', desc: ar ? 'الميكروبيوم والشهية والطاقة.' : 'Microbiome, appetite & energy.', count: ar ? '٣ مقالات' : '3 articles' },
      { icon: 'sport', title: ar ? 'تغذية رياضية' : 'Sports Nutrition', desc: ar ? 'الأداء والتعافي بذكاء.' : 'Smarter performance & recovery.', count: ar ? '٣ مقالات' : '3 articles' },
    ];
  });

  // Myth vs fact
  readonly mythEyebrow = computed(() => (this.ar() ? 'حقيقة أم خرافة' : 'Myth vs Fact'));
  readonly mythH2 = computed(() => (this.ar() ? 'تحقّق بنفسك الآن' : 'Check It for Yourself, Right Now'));
  readonly mythSub = computed(() => this.ar()
    ? 'ادعاءات صحية شائعة، تحت مجهر الأدلة. اضغط لكشف الحقيقة.'
    : 'Common health claims, checked against the evidence. Tap to reveal the truth.');
  readonly mythTag = computed(() => (this.ar() ? 'خرافة' : 'Myth'));
  readonly factTag = computed(() => (this.ar() ? 'الحقيقة' : 'Fact'));
  readonly myths = computed<Myth[]>(() => {
    const ar = this.ar();
    return [
      { claim: ar ? 'الأكل بعد الثامنة مساءً يزيد الوزن.' : 'Eating after 8pm makes you gain weight.', fact: ar ? 'تغيّر الوزن يعتمد على إجمالي سعراتك اليومية، لا على الساعة. الأكل المتأخر يضر فقط إن دفعك لتناول المزيد أو أفسد نومك.' : 'Weight change depends on your total calories over the day — not the clock. Late eating only matters if it leads you to eat more overall or disrupts your sleep.' },
      { claim: ar ? 'الكربوهيدرات عدو فقدان الوزن.' : 'Carbs are the enemy of weight loss.', fact: ar ? 'لا يوجد عنصر غذائي واحد يسبب زيادة الوزن. الكربوهيدرات الكاملة كالشوفان والفاكهة والبقوليات ترتبط بتحكم أفضل بالوزن وصحة أمعاء أفضل.' : 'No single nutrient causes weight gain. Whole-food carbs like oats, fruit, and legumes are linked to better long-term weight control and gut health.' },
      { claim: ar ? 'شاي «الديتوكس» ينظّف جسمك.' : '"Detox" teas cleanse your body.', fact: ar ? 'كبدك وكليتاك ينظّفان جسمك على مدار الساعة. معظم أنواع شاي الديتوكس مجرد ملينات أو مدرّات للبول — والوزن المفقود ماء يعود سريعاً.' : 'Your liver and kidneys already detox your body 24/7. Most detox teas are mild laxatives or diuretics — the lost weight is water, and it returns.' },
      { claim: ar ? 'المكملات تغني عن النظام المتوازن.' : 'Supplements can replace a balanced diet.', fact: ar ? 'المكملات تسدّ نقصاً محدداً، لكنها لا تعوّض ألياف ومضادات أكسدة وتكامل الأطعمة الكاملة. معظم الأصحّاء يحصلون على حاجتهم من الطعام.' : "Supplements fill specific gaps — they can't replicate the fiber, antioxidants, and synergy of whole foods. Most healthy people get what they need from food." },
    ];
  });

  // About teaser
  readonly aboutEyebrow = computed(() => (this.ar() ? 'الخبير وراء المحتوى' : 'The expert behind the content'));
  readonly aboutH2 = computed(() => (this.ar() ? 'لماذا د. كريم؟' : 'Why Dr. Karim?'));
  readonly aboutBio = computed(() => this.ar()
    ? 'بصفته صيدلياً إكلينيكياً مرخّصاً وخبير تغذية معتمداً، يجمع د. كريم الطاهر بين فهم عميق للأدوية وعلم التغذية الحديث — وهو مزيج نادر يجعل نصيحته آمنة ودقيقة، خاصة لمن يتناولون أدوية مزمنة.'
    : 'As a licensed Clinical Pharmacist and Certified Nutrition Expert, Dr. Karim Eltaher combines a deep understanding of medications with modern nutrition science — a rare pairing that makes his guidance both safe and precise, especially for anyone on long-term medication.');
  readonly credentials = computed<string[]>(() => this.ar()
    ? ['مرخّص من الهيئة السعودية', 'خبير تغذية معتمد (UK)', 'صيدلي إكلينيكي']
    : ['SCFHS Licensed', 'Certified Nutrition Expert (UK)', 'Clinical Pharmacist']);
  readonly aboutCta = computed(() => (this.ar() ? 'اقرأ قصته الكاملة' : 'Read His Full Story'));
  readonly credBadgeLabel = computed(() => (this.ar() ? 'مرخّص رسمياً' : 'Officially Licensed'));
  readonly credBadgeText = computed(() => (this.ar() ? 'الهيئة السعودية للتخصصات الصحية' : 'SCFHS · Saudi Arabia'));

  // Follow
  readonly followEyebrow = computed(() => (this.ar() ? 'ابقَ على اطلاع' : 'Stay informed'));
  readonly followH2 = computed(() => (this.ar() ? 'نصائح صحية مجانية كل يوم' : 'Free Health Tips, Every Day'));
  readonly followSub = computed(() => this.ar()
    ? 'انضم لعشرات الآلاف الذين يتعلمون التغذية الصحيحة عبر منصاتنا.'
    : 'Join the tens of thousands learning real nutrition across our channels.');
  readonly socials: Social[] = [
    { glyph: '⊚', platform: 'Instagram', handle: '@dr.karimeltaher', href: 'https://instagram.com/dr.karimeltaher' },
    { glyph: '♪', platform: 'TikTok', handle: '@dr.karimeltaher', href: 'https://tiktok.com/@dr.karimeltaher' },
    { glyph: '▶', platform: 'YouTube', handle: 'NutriDoc', href: 'https://youtube.com/@nutridoc' },
    { glyph: 'f', platform: 'Facebook', handle: 'NutriDoc', href: 'https://facebook.com/nutridoc' },
  ];

  // Soft plan CTA
  readonly planEyebrow = computed(() => (this.ar() ? 'عندما تكون مستعداً' : "When you're ready"));
  readonly planH2 = computed(() => (this.ar() ? 'تريد إرشاداً مصمماً لك أنت؟' : 'Want guidance made just for you?'));
  readonly planSub = computed(() => this.ar()
    ? 'إذا أردت أن تتحول المعرفة إلى خطة شخصية تراعي جسمك وأدويتك، يمكن لـ د. كريم تصميمها لك.'
    : "If you'd like to turn this knowledge into a personal plan that accounts for your body and your medications, Dr. Karim can build one for you.");
  readonly planBtn = computed(() => (this.ar() ? 'استكشف الخطط الشخصية' : 'Explore Personal Plans'));
  readonly planNote = computed(() => (this.ar() ? 'لا ضغط — المحتوى يبقى مجانياً دائماً.' : 'No pressure — the content stays free, always.'));
}
