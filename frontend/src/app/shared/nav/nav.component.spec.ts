import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NavComponent } from './nav.component';

describe('NavComponent', () => {
  let fixture: ComponentFixture<NavComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(NavComponent);
    fixture.componentInstance.active = 'home';
    fixture.detectChanges();
  });

  it('creates and renders English links by default', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Home');
    expect(text).toContain('Subscribe Now');
  });

  it('toggling lang switches to Arabic copy', () => {
    fixture.componentInstance.toggleLang();
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('الرئيسية');
  });

  it('toggleMenu opens and closeMenu closes the drawer', () => {
    expect(fixture.componentInstance.menuOpen()).toBe(false);
    fixture.componentInstance.toggleMenu();
    expect(fixture.componentInstance.menuOpen()).toBe(true);
    fixture.componentInstance.closeMenu();
    expect(fixture.componentInstance.menuOpen()).toBe(false);
  });
});
