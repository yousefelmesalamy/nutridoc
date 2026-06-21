import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  let fixture: ComponentFixture<HomeComponent>;
  let component: HomeComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders the English hero heading by default', () => {
    expect(fixture.nativeElement.textContent).toContain('Nutrition advice you can');
  });

  it('myths start closed and toggle open on click', () => {
    expect(component.isMythOpen(0)).toBe(false);
    component.toggleMyth(0);
    expect(component.isMythOpen(0)).toBe(true);
    component.toggleMyth(0);
    expect(component.isMythOpen(0)).toBe(false);
  });

  it('switching language updates hero copy to Arabic', () => {
    component['langService'].toggle();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('معلومات صحية');
  });
});
