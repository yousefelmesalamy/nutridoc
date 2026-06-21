import { TestBed } from '@angular/core/testing';
import { LangService } from './lang.service';

describe('LangService', () => {
  let service: LangService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [LangService],
    });
    service = TestBed.inject(LangService);
  });

  it('defaults to en', () => {
    expect(service.lang()).toBe('en');
  });

  it('toggle flips between en and ar', () => {
    service.toggle();
    expect(service.lang()).toBe('ar');
    service.toggle();
    expect(service.lang()).toBe('en');
  });

  it('sets document dir to rtl when ar', async () => {
    service.toggle();
    // Wait for any pending effects
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(document.documentElement.dir).toBe('rtl');
    expect(document.documentElement.lang).toBe('ar');
  });
});
