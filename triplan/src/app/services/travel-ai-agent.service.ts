import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';
import { TokenPair } from '../models/token-pair.model';
import { Router } from '@angular/router';
import { getToken, haveValidToken } from '../utils/token-utils';
import { TravelPlan } from '../models/travel-plan.model';

@Injectable({
  providedIn: 'root'
})
export class TravelAiAgentService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:8000'; //TODO : read it from env variables or config file instead of hardcoding it here


  //TODO : read it from env variables or config file instead of hardcoding it here
  private key = 'super-secret-key-used-for-api-headers-this-should-be-kept-safe-and-not-shared-publicly';

  statusMessages = signal<string[]>([]);
  tripPlan = signal<TravelPlan | undefined>(undefined);
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
    const accessToken = getToken();

    // Token exists → call API directly
    const headers = {
      'Authorization': `Bearer ${accessToken}`
    };

    return this.http.post(`${this.baseUrl}/getTripPlanWithStreaming`, payload, { headers });
  }

  startStream(response:any) {
    if(response?.code == 0){
      
      this.isStreaming.set(true);
      const accessToken = getToken()    
      const URL = `${this.baseUrl}/api/trip/stream-status?token=${accessToken}`;
      const eventSource = new EventSource(URL);

      eventSource.onmessage = (event) => {
        const msg = event.data;
          console.log(msg)
        if (msg.includes('<status>')) {
          const clean = msg
            .replace('<status>', '')
            .replace('</status>', '');

          this.statusMessages.update(list => [...list, clean]);
        }else if (msg.includes('<final>')) {
          const jsonStr = msg.replace('<final>', '').replace('</final>', '');
          try {
            let parsed =  JSON.parse(jsonStr) as TravelPlan;
            if (typeof parsed === 'string') {
              parsed = JSON.parse(parsed);
            }
            this.tripPlan.set(parsed)
          } catch (err) {
            console.error('Failed to parse final plan JSON', err);
          }
          this.isStreaming.set(false);
          eventSource.close();
        }

      };

      eventSource.onerror = () => {
        eventSource.close();
        this.error.set('Stream connection failed');
        this.isStreaming.set(false);
      };
    }else{
       this.error.set(response?.data?.error);
    }
  }

  

  getTripPlan(payload: any) {
    const accessToken = getToken();
    if (!accessToken) {
      //TODO throw error.
    }

    // Token exists → call API directly
    const headers = {
      'Authorization': `Bearer ${accessToken}`
    };

    this.http.post(`${this.baseUrl}/api/trip/getTripPlan`, payload, { headers }).subscribe({
      next: (response) =>this.startStream(response),
      error: () => console.warn('POST failed, but SSE will still run')
    });
    
    
  }
}
