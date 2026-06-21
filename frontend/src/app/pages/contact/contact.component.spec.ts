import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { ContactComponent } from './contact.component';
import { LeadsService } from '../../core/leads.service';

describe('ContactComponent', () => {
  let fixture: ComponentFixture<ContactComponent>;
  let component: ContactComponent;
  let leadsServiceSpy: { submitContact: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    leadsServiceSpy = { submitContact: vi.fn() };
    leadsServiceSpy.submitContact.mockReturnValue(of({} as any));

    await TestBed.configureTestingModule({
      imports: [ContactComponent],
      providers: [provideRouter([]), { provide: LeadsService, useValue: leadsServiceSpy }],
    }).compileComponents();
    fixture = TestBed.createComponent(ContactComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('blocks submit with empty required fields and sets errors', () => {
    component.submit();
    expect(leadsServiceSpy.submitContact).not.toHaveBeenCalled();
    expect(component.errors()['name']).toBeTruthy();
    expect(component.errors()['email']).toBeTruthy();
    expect(component.errors()['message']).toBeTruthy();
  });

  it('rejects an invalid email format', () => {
    component.setField('name', 'Jane');
    component.setField('email', 'not-an-email');
    component.setField('message', 'hello');
    component.submit();
    expect(component.errors()['email']).toBeTruthy();
    expect(leadsServiceSpy.submitContact).not.toHaveBeenCalled();
  });

  it('submits via LeadsService and shows the sent state on valid input', () => {
    component.setField('name', 'Jane');
    component.setField('email', 'jane@example.com');
    component.setField('message', 'hello there');
    component.submit();
    expect(leadsServiceSpy.submitContact).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Jane', email: 'jane@example.com', message: 'hello there' })
    );
    expect(component.sent()).toBe(true);
  });
});
