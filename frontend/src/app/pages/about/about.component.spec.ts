import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AboutComponent } from './about.component';

describe('AboutComponent', () => {
  let fixture: ComponentFixture<AboutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AboutComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(AboutComponent);
    fixture.detectChanges();
  });

  it('renders Dr. Karim\'s name and all four achievement stats', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Dr. Karim Eltaher');
    expect(text).toContain('20k+');
    expect(text).toContain('300k+');
    expect(text).toContain('5+');
    expect(text).toContain('100s');
  });
});
