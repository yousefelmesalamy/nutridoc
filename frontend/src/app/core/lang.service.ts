import { effect, Injectable, signal } from '@angular/core';

export type Lang = 'en' | 'ar';
const STORAGE_KEY = 'nutridoc-lang';

@Injectable({ providedIn: 'root' })
export class LangService {
  readonly lang = signal<Lang>(this.readInitial());

  constructor() {
    effect(() => {
      const l = this.lang();
      document.documentElement.lang = l;
      document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr';
      try {
        localStorage.setItem(STORAGE_KEY, l);
      } catch {
        /* storage unavailable */
      }
    });
  }

  toggle(): void {
    this.lang.set(this.lang() === 'ar' ? 'en' : 'ar');
  }

  private readInitial(): Lang {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored === 'ar' ? 'ar' : 'en';
    } catch {
      return 'en';
    }
  }
}
