import { Component, effect, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TravelAiAgentService } from '../../services/travel-ai-agent.service';
import { NgFor, NgIf } from '@angular/common';

@Component({
  selector: 'app-service-progress',
  standalone: true,
  imports: [NgFor,NgIf],
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
  result: any = null;
  interval: NodeJS.Timeout | undefined;

  constructor() {    

    // Observe final result
    effect(() => {
      const result = this.agent.finalResult();
      if (result) {
         this.agent.tripPlan.set(result);   // store result
        this.result = result;
        clearInterval(this.interval);
        this.router.navigate(['/travel/result']);
      }
    });

    // Observe errors
    effect(() => {
      const err = this.agent.error();
      if (err) {
        console.error('Stream error', err);
        this.result = { error: 'Failed to generate trip plan. Please try again.' , details: err};         
        this.agent.tripPlan.set(this.result);  
        sessionStorage.setItem('error', JSON.stringify(this.result));
        this.router.navigate(['/error']);
        //return throwError(() => err);
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
    this.runProgress();
  }


  getTripPlan() {    

    this.result = null; // reset result for new run
    const payload = JSON.stringify({
            "fromCity": "New York",
            "destination": "Tokyo",
            "startDate": "2026-05-01",
            "endDate": "2026-05-15",
            "budget": "$5,000",
            "travelers": 2,
            "interests": ["coding", "hiking", "food"]
            });
    this.agent.startTripPlanStatusStream(payload);

  }

  runProgress() {

    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
      // No token → login first → then call getTripPlan
      this.agent.doLogin('visitor', 'tESTPASSWORD$123').subscribe
      (tokenPair => {
        localStorage.setItem('access_token', tokenPair.access_token);
        this.getTripPlan();
      });
    }else {
      this.getTripPlan();
    }

    this.interval = setInterval(() => {
      this.currentStep++;

      if (this.currentStep === this.steps.length) {
        this.currentStep = 0;
      }
    }, 500);


    
    // When backend finishes streaming, it triggers Step 2
    /**this.agent.getFinalTripPlan(payload).subscribe(result => {
        this.agent.tripPlan.set(result);   // store result
        this.result = result;
        clearInterval(interval);
        this.router.navigate(['/travel/result']);
    });*/
    
    /* this.agent.getTripPlan(payload).subscribe({
      next: (result) => {
        this.agent.tripPlan.set(result);   // store result
        this.result = result;
        clearInterval(interval);
        this.router.navigate(['/travel/result']);
      },
      error: (err) => {
        console.error('Trip plan error:', err);
         this.result = { error: 'Failed to generate trip plan. Please try again.' , details: err};
         
        this.agent.tripPlan.set(this.result);   // store result
        clearInterval(interval);
        this.router.navigate(['/travel/result']);
      }
    });*/
  }

}
