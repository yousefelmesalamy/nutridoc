import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavComponent } from '../../shared/nav/nav.component';
import { FooterComponent } from '../../shared/footer/footer.component';
import { LangService } from '../../core/lang.service';

interface Service {
  key: 'plan' | 'weight' | 'clinical' | 'drug' | 'sport' | 'online';
  featured: boolean;
  title: string;
  desc: string;
}

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [RouterLink, NavComponent, FooterComponent],
  templateUrl: './services.component.html',
  styleUrl: './services.component.scss',
})
export class ServicesComponent {
  private readonly langService = inject(LangService);
  readonly lang = this.langService.lang;
  readonly ar = computed(() => this.lang() === 'ar');

  readonly eyebrow = computed(() => (this.ar() ? 'الخدمات' : 'What we offer'));
  readonly h1 = computed(() => (this.ar() ? 'خدمات تغذية مبنية على العلم' : 'Nutrition Services, Backed by Science'));
  readonly intro = computed(() => this.ar()
    ? 'من الخطط المخصصة إلى مراجعة تفاعل الأدوية مع الغذاء — خدمات تجمع بين خبرة الصيدلة الإكلينيكية وعلم التغذية الحديث.'
    : 'From personalized plans to medication–diet reviews — services that combine clinical-pharmacy expertise with modern nutrition science.');
  readonly uniqueLabel = computed(() => (this.ar() ? 'خدمة فريدة' : 'Unique to NutriDoc'));

  readonly services = computed<Service[]>(() => {
    const ar = this.ar();
    return [
      { key: 'plan', featured: false, title: ar ? 'خطط تغذية مخصصة' : 'Personalized Nutrition Plans', desc: ar ? 'خطط وجبات مخصصة مبنية على جسمك وأهدافك ونمط حياتك — لا حلولاً جاهزة للجميع.' : 'Custom meal plans built around your body, goals, and lifestyle — not a one-size-fits-all template.' },
      { key: 'weight', featured: false, title: ar ? 'برنامج إدارة الوزن' : 'Weight Management Program', desc: ar ? 'بروتوكولات مبنية على الأدلة لفقدان وزن مستدام وبناء عضلات — بلا حميات قاسية.' : 'Evidence-based protocols for sustainable weight loss and lean muscle gain — without crash diets.' },
      { key: 'clinical', featured: false, title: ar ? 'استشارات التغذية الإكلينيكية' : 'Clinical Nutrition Counseling', desc: ar ? 'دعم تغذوي للحالات المزمنة — السكري، الضغط، تكيس المبايض — مدعوم بخبرة صيدلانية.' : 'Nutrition support for chronic conditions — diabetes, hypertension, PCOS — backed by pharmacy expertise.' },
      { key: 'drug', featured: true, title: ar ? 'مراجعة تفاعل الدواء والغذاء' : 'Drug–Nutrition Interaction Review', desc: ar ? 'خدمة فريدة تستخدم خبرة الصيدلة الإكلينيكية لفحص تأثير أدويتك على نظامك الغذائي والعكس.' : 'A unique service using clinical pharmacy expertise to check how your medications affect your diet — and vice versa.' },
      { key: 'sport', featured: false, title: ar ? 'تغذية رياضية' : 'Sports Nutrition', desc: ar ? 'تغذية موجهة للأداء للرياضيين والأشخاص النشطين الراغبين في تدريب وتعافٍ أذكى.' : 'Performance-focused nutrition for athletes and active individuals who want to train and recover smarter.' },
      { key: 'online', featured: false, title: ar ? 'استشارة عن بُعد' : 'Online Consultation', desc: ar ? 'جلسات استشارية مرنة عبر الفيديو أو واتساب — إرشاد متخصص من أي مكان في المملكة.' : 'Flexible video or WhatsApp consultation sessions — get expert guidance from anywhere in the Kingdom.' },
    ];
  });

  readonly ctaH2 = computed(() => (this.ar() ? 'لست متأكداً أي خدمة تناسبك؟' : 'Not Sure Which Service Fits?'));
  readonly ctaSub = computed(() => (this.ar() ? 'ابدأ بخطة، أو تواصل مع د. كريم مباشرة لتحديد ما يناسبك.' : 'Start with a plan, or contact Dr. Karim directly to find your best fit.'));
  readonly ctaBtn1 = computed(() => (this.ar() ? 'استعرض الخطط' : 'View Plans'));
  readonly ctaBtn2 = computed(() => (this.ar() ? 'تواصل معنا' : 'Contact Us'));
}
