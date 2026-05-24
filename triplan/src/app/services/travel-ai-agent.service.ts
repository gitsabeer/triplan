import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';
import { TokenPair } from '../models/token-pair.model';
import { Router } from '@angular/router';
import { getToken, haveValidToken } from '../utils/token-utils';
import { TravelPlan } from '../models/travel-plan.model';
import { SearchData } from '../models/search-data.model';

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
  searchData = signal<SearchData | undefined>(undefined);
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

  startStream(response: any) {
    if (response?.code == 0) {

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
        } else if (msg.includes('<final>')) {
          const jsonStr = msg.replace('<final>', '').replace('</final>', '');
          try {
            let parsed = JSON.parse(jsonStr) as TravelPlan;
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
    } else {
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
      next: (response) => this.startStream(response),
      error: () => console.warn('POST failed, but SSE will still run')
    });
  }


  getSampleResponse() {
    this.tripPlan.set(this.samplResp)
  }

  samplResp = {
    "destination": "Tokyo", "fromCity": "New York", "startDate": "2026-05-01", "endDate": "2026-05-05", "summary": "A 5-day immersive journey through Tokyo, blending deep-tech exploration in Akihabara, scenic mountain hiking at Mt. Takao and Mt. Mitake, and a comprehensive culinary tour of Japan's capital.", "estimatedTotalBudget": "$5,000", "budgetBreakdown": { "flights": "$2,200", "hotels": "$1,400", "food": "$1,120", "transportation": "$280" }, "flights": [{ "fromCity": "New York (JFK)", "toCity": "Tokyo (HND)", "estimatedPrice": "$1,100 per person", "duration": "14h 05m", "stops": "Non-stop", "details": [{ "airline": "Japan Airlines", "flightNumber": "JL5", "departureTime": "13:30", "arrivalTime": "16:35 (+1 day)", "gate": "Gate 12" }] }, { "fromCity": "Tokyo (HND)", "toCity": "New York (JFK)", "estimatedPrice": "Included in Round Trip", "duration": "13h 10m", "stops": "Non-stop", "details": [{ "airline": "Japan Airlines", "flightNumber": "JL6", "departureTime": "11:15", "arrivalTime": "11:05", "gate": "Gate 112" }] }], "hotels": [{ "name": "APA Hotel Shinjuku Kabukicho Tower", "description": "A modern high-rise hotel featuring an open-air public bath and compact, efficient rooms perfect for tech-savvy travelers.", "estimatedPricePerNight": "$100", "location": "1-20-2 Kabukicho, Shinjuku, Tokyo" }],
    "dailyItinerary": [{
      "day": 1, "date": "2026-05-01", "title": "Departure from New York", "weather": { "condition": "Clear", "temperature": "18\u00b0C" },
      "activities": [{ "name": "JFK Airport Departure", "time": "10:30", "description": "Check-in for flight JL5 to Tokyo Haneda.", "location": "JFK Terminal 8", "estimatedCost": "$0", "type": "travel" }]
    },
    {
      "day": 2, "date": "2026-05-02", "title": "Arrival and Shinjuku Neon", "weather": { "condition": "Mild", "temperature": "20\u00b0C" },
      "activities": [{ "name": "Arrival at Haneda", "time": "16:35", "description": "Clear customs and take the Monorail to central Tokyo.", "location": "Haneda Airport", "estimatedCost": "$15", "type": "travel" }, { "name": "Dinner at Ichiran Ramen", "time": "20:00", "description": "Classic tonkotsu ramen with individual booths.", "location": "Shinjuku", "estimatedCost": "$15", "type": "restaurant" }]
    },
    { "day": 3, "date": "2026-05-03", "title": "Coding Culture in Akihabara", "weather": { "condition": "Sunny", "temperature": "22\u00b0C" }, "activities": [{ "name": "Akihabara Electric Town", "time": "10:00", "description": "Explore multi-story electronics shops and retro gaming centers.", "location": "Akihabara", "estimatedCost": "$0", "type": "activity" }, { "name": "GEEK BAR", "time": "19:00", "description": "A themed bar where developers and tech enthusiasts gather.", "location": "Nakano", "estimatedCost": "$30", "type": "restaurant" }] },
    { "day": 4, "date": "2026-05-04", "title": "Hiking Mt. Takao", "weather": { "condition": "Clear", "temperature": "19\u00b0C" }, "activities": [{ "name": "Mt. Takao Summit Hike", "time": "09:00", "description": "Hike Trail 1 to the summit for views of Mt. Fuji.", "location": "Hachioji", "estimatedCost": "$10", "type": "activity" }, { "name": "Tengu-ya Soba", "time": "13:00", "description": "Traditional buckwheat noodles at the base of the mountain.", "location": "Mt. Takao", "estimatedCost": "$15", "type": "restaurant" }] },
    { "day": 5, "date": "2026-05-15", "title": "Return to New York", "weather": { "condition": "Mild", "temperature": "20\u00b0C" }, "activities": [{ "name": "Travel to Haneda", "time": "08:00", "description": "Final transit to the airport.", "location": "Haneda Airport", "estimatedCost": "$10", "type": "travel" }, { "name": "Departure Flight", "time": "11:15", "description": "Boarding flight JL6 to New York.", "location": "Haneda Terminal 3", "estimatedCost": "$0", "type": "travel" }] }]
  }
}
