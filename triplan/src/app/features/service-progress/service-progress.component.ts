import { Component, effect, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TravelAiAgentService } from '../../services/travel-ai-agent.service';
import { NgFor, NgIf } from '@angular/common';
import { haveValidToken, storeToken } from '../../utils/token-utils';
import { timeInterval } from 'rxjs';
import { SearchData } from '../../models/search-data.model';

@Component({
  selector: 'app-service-progress',
  standalone: true,
  imports: [NgFor, NgIf],
  templateUrl: './service-progress.component.html',
  styleUrl: './service-progress.component.scss'
})
export class ServiceProgressComponent implements OnInit {

  router = inject(Router);
  agent = inject(TravelAiAgentService);

  steps = [
    'Analyzing destinations…',
    'Finding best flights…',
    'Optimizing travel days…',
    'Building your itinerary…',
    'Finalizing results…'
  ];

  currentStep = 0;
  interval: any;


  constructor() {

    // Observe final result
    effect(() => {
      const result = this.agent.tripPlan();
      if (result) {
        this.processResult(result);
      }
    });

    // Observe errors
    effect(() => {
      if (this.agent.error()) {
        this.reportError(this.agent.error())
      }
    });


    // Observe stream completion
    effect(() => {
      if (!this.agent.isStreaming()) {
        console.log('Stream finished');
      }
    });
  }

  ngOnInit() {
    if (this.agent.isDemoMode()) {
      this.runProgressDemo();
    } else {
      this.runProgress();
    }
  }

  reportError(err: any) {
    const result = { details: 'Failed to generate trip plan.', error: err };
    // this.agent.tripPlan.set(this.result);  
    sessionStorage.setItem('error', JSON.stringify(result));
    this.router.navigate(['/error'], { replaceUrl: true });
  }

  processResult(result: any) {
    clearInterval(this.interval);
    this.router.navigate(['/travel/result'], { replaceUrl: true });

  }

  sampleSearchData = {
    "fromCity": "New York",
    "destination": "Tokyo",
    "startDate": "2026-06-01",
    "endDate": "2026-06-05",
    "travelers": 2,
    "budget": "$3,500",
    "interests": ["coding", "hiking", "food"]
  }

  getTripPlan() {
    const searchVal = this.agent.searchData();
    const dataObj = searchVal ? searchVal.createPayload() : this.sampleSearchData;
    const payload = JSON.stringify(dataObj);
    this.agent.getTripPlan(payload);
  }

  runProgressDemo() {
    this.agent.getSampleResponse();
  }

  runProgress() {

    if (!haveValidToken()) {
      // No token → login first → then call getTripPlan
      this.agent.doLogin('visitor', 'tESTPASSWORD$123').subscribe({
        next: (tokenPair => {
          storeToken(tokenPair.access_token)
          this.getTripPlan();
        }),
        error: (err => {
          console.error('Login failed', err);
          this.reportError('Authentication failed.');
        })
      });
    } else {
      this.getTripPlan();
    }

    this.interval = setInterval(() => {
      this.currentStep++;

      if (this.currentStep === this.steps.length) {
        this.currentStep = 0;
      }
    }, 1000);

  }

}
