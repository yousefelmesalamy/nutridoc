import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { ContactPayload, PlanRequestPayload } from '../shared/models/leads.models';

@Injectable({ providedIn: 'root' })
export class LeadsService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  submitContact(payload: ContactPayload): Observable<ContactPayload> {
    return this.http.post<ContactPayload>(`${this.base}/contact/`, payload);
  }

  submitPlanRequest(payload: PlanRequestPayload): Observable<PlanRequestPayload> {
    return this.http.post<PlanRequestPayload>(`${this.base}/plan-requests/`, payload);
  }
}
