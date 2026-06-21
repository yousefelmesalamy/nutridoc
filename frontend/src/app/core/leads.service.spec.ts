import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../environments/environment';
import { LeadsService } from './leads.service';

describe('LeadsService', () => {
  let service: LeadsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(LeadsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('submitContact() POSTs to /contact/', () => {
    const payload = { name: 'A', email: 'a@b.com', phone: '', subject: 'general', message: 'hi' };
    service.submitContact(payload).subscribe();
    const req = httpMock.expectOne(`${environment.apiBaseUrl}/contact/`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(payload);
  });

  it('submitPlanRequest() POSTs to /plan-requests/', () => {
    const payload = { name: 'A', email: 'a@b.com', phone: '', plan: 'pro', message: 'details' };
    service.submitPlanRequest(payload).subscribe();
    const req = httpMock.expectOne(`${environment.apiBaseUrl}/plan-requests/`);
    expect(req.request.method).toBe('POST');
    req.flush(payload);
  });
});
