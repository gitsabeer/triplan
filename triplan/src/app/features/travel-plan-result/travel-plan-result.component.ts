import { Component, inject, OnInit } from '@angular/core';
import { TravelAiAgentService } from '../../services/travel-ai-agent.service';
import { JsonPipe, NgIf } from '@angular/common';

@Component({
  selector: 'app-travel-plan-result',
  standalone: true,
   imports: [JsonPipe,NgIf], 
  templateUrl: './travel-plan-result.component.html',
  styleUrl: './travel-plan-result.component.scss'
})
export class TravelPlanResultComponent implements OnInit {

  agent = inject(TravelAiAgentService);
  tripPlan: any = null;

  ngOnInit() {
    this.tripPlan = this.agent.tripPlan();
  }


}
