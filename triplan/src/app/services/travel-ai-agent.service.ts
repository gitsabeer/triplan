import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';
import { TokenPair } from '../models/token-pair.model';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class TravelAiAgentService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:8000'; //TODO : read it from env variables or config file instead of hardcoding it here
  tripPlan = signal<any>(null);

  //TODO : read it from env variables or config file instead of hardcoding it here
  private key = 'super-secret-key-used-for-api-headers-this-should-be-kept-safe-and-not-shared-publicly';

  statusMessages = signal<string[]>([]);
  finalResult = signal<any | null>(null);
  isStreaming = signal(false);
  error = signal<string | null>(null);
  
  router = inject(Router);


  doLogin(username: string, password: string): Observable<TokenPair> {

    const URL = `${this.baseUrl}/auth/login`;
    const headers = {
      'x-api-key': this.key,
      'Content-Type': 'application/x-www-form-urlencoded'
    };

    const body = new URLSearchParams();
    body.set('username', 'visitor');
    body.set('password', 'tESTPASSWORD$123');

    return this.http.post<TokenPair>(URL,
      body.toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    )
  }

  
  getFinalTripPlan(payload: any): Observable<any> {
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
     //TODO throw error.
    }

    // Token exists → call API directly
    const headers = {
      'Authorization': `Bearer ${accessToken}`
    };

    return this.http.post(`${this.baseUrl}/getTripPlanWithStreaming`, payload, { headers });
  }

  startTripPlanStatusStream(payload: any) {
    this.isStreaming.set(true);
    const accessToken = localStorage.getItem('access_token');
    
    const URL = `${this.baseUrl}/api/trip/stream-status?token=${accessToken}`;
    const eventSource = new EventSource(URL);

    eventSource.onmessage = (event) => {
      const msg = event.data;

      if (msg.includes('<status>')) {
        const clean = msg
          .replace('<status>', '')
          .replace('</status>', '');

        this.statusMessages.update(list => [...list, clean]);
      }

       if (msg.includes('<final>')) {
        const jsonStr = msg.replace('<final>', '').replace('</final>', '');
        this.finalResult.set(JSON.parse(jsonStr));
        this.isStreaming.set(false);
        eventSource.close();
      }

    };

    eventSource.onerror = () => {
      eventSource.close();
      this.error.set('Stream connection failed');
      this.isStreaming.set(false);
    };
  }

  

  getTripPlan(payload: any): Observable<any> {
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
      //TODO throw error.
    }

    // Token exists → call API directly
    const headers = {
      'Authorization': `Bearer ${accessToken}`
    };

    return this.http.post(`${this.baseUrl}/getTripPlan`, payload, { headers });
  }
}
