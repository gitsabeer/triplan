import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';


@Injectable({
  providedIn: 'root'
})
export class TravelAiAgentService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:8000';
  tripPlan = signal<any>(null);

  constructor() { }

  getTripPlan(payload: any): Observable<any> {
    const headers = {
      'x-api-key': 'super-secret-key'
    };
    return this.http.post(`${this.baseUrl}/getTripPlan`, payload, { headers });
  }
}
