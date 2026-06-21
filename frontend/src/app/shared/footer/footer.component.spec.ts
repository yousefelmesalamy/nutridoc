import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { FooterComponent } from './footer.component';

describe('FooterComponent', () => {
  let fixture: ComponentFixture<FooterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FooterComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(FooterComponent);
    fixture.detectChanges();
  });

  it('renders the English nav title and email link by default', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Navigate');
    expect(text).toContain('karimeltaher640@gmail.com');
  });

  it('current year appears in the copyright line', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain(String(new Date().getFullYear()));
  });
});
