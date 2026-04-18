import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TravelAiAgentService } from '../../services/travel-ai-agent.service';

@Component({
  selector: 'app-service-progress',
  standalone: true,
  imports: [],
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

  ngOnInit() {
    this.runProgress();
  }

  runProgress() {
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

    const interval = setInterval(() => {
      this.currentStep++;

      if (this.currentStep === this.steps.length) {
        this.currentStep = 0;
      }
    }, 500);

    
    
     this.agent.getTripPlan(payload).subscribe({
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
    });
  }

}
