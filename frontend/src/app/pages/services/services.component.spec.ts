import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ServicesComponent } from './services.component';

describe('ServicesComponent', () => {
  let fixture: ComponentFixture<ServicesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServicesComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(ServicesComponent);
    fixture.detectChanges();
  });

  it('renders all six services with the featured badge on Drug–Nutrition Review', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Personalized Nutrition Plans');
    expect(text).toContain('Drug–Nutrition Interaction Review');
    expect(text).toContain('Unique to NutriDoc');
  });
});
