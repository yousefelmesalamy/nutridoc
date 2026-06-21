import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { SubscriptionComponent } from './subscription.component';
import { LeadsService } from '../../core/leads.service';

describe('SubscriptionComponent', () => {
  let fixture: ComponentFixture<SubscriptionComponent>;
  let component: SubscriptionComponent;
  let leadsServiceSpy: { submitPlanRequest: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    leadsServiceSpy = { submitPlanRequest: vi.fn() };
    leadsServiceSpy.submitPlanRequest.mockReturnValue(of({} as any));

    await TestBed.configureTestingModule({
      imports: [SubscriptionComponent],
      providers: [provideRouter([]), { provide: LeadsService, useValue: leadsServiceSpy }],
    }).compileComponents();
    fixture = TestBed.createComponent(SubscriptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('defaults to the pro plan and step 1', () => {
    expect(component.selected()).toBe('pro');
    expect(component.step()).toBe(1);
  });

  it('blocks advancing past step 1 with empty required fields', () => {
    component.goNext();
    expect(component.step()).toBe(1);
    expect(component.errors()['fullName']).toBeTruthy();
  });

  it('advances to step 2 once step 1 fields are valid', () => {
    component.setField('fullName', 'Jane Doe');
    component.setField('email', 'jane@example.com');
    component.setField('phone', '0500000000');
    component.setField('age', '25');
    component.goNext();
    expect(component.step()).toBe(2);
  });

  it('rejects age under 18', () => {
    component.setField('fullName', 'Jane Doe');
    component.setField('email', 'jane@example.com');
    component.setField('phone', '0500000000');
    component.setField('age', '16');
    component.goNext();
    expect(component.step()).toBe(1);
    expect(component.errors()['age']).toBeTruthy();
  });

  it('submitting step 3 calls LeadsService.submitPlanRequest and shows success', () => {
    component.selectPlan('premium');
    component.setField('fullName', 'Jane Doe');
    component.setField('email', 'jane@example.com');
    component.setField('phone', '0500000000');
    component.setField('age', '25');
    component.goNext();
    component.setField('height', '170');
    component.setField('currentWeight', '70');
    component.setField('targetWeight', '65');
    component.goNext();
    component.setField('agree', true);
    component.goNext();

    expect(leadsServiceSpy.submitPlanRequest).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Jane Doe', email: 'jane@example.com', plan: 'premium' })
    );
    expect(component.submitted()).toBe(true);
  });
});
