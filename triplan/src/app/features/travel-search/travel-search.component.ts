import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TravelAiAgentService } from '../../services/travel-ai-agent.service';
import { AppStateService } from '../../services/app-state.service';

@Component({
  selector: 'app-travel-search',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './travel-search.component.html',
  styleUrls: ['./travel-search.component.scss']
})
export class TravelSearchComponent implements OnInit {
  form!: FormGroup;
  appState = inject(AppStateService);

  interests = [
    'Culture',
    'Food',
    'Nature',
    'History',
    'Shopping',
    'Adventure',
    'Relaxation'
  ];

  selectedInterests: string[] = [];
  router = inject(Router);
  fb = inject(FormBuilder);
  agent = inject(TravelAiAgentService);

  constructor() {}

  ngOnInit(): void {
    this.form = this.fb.group({
      from: ['', Validators.required],
      to: ['', Validators.required],
      departDate: ['', Validators.required],
      returnDate: [''],
      travelers: [1, Validators.required],
      budget: ['moderate', Validators.required],
      interests: [[]]
    });
  }

  toggleInterest(tag: string) {
    if (this.selectedInterests.includes(tag)) {
      this.selectedInterests = this.selectedInterests.filter(t => t !== tag);
    } else {
      this.selectedInterests.push(tag);
    }

    this.form.patchValue({ interests: this.selectedInterests });
  }

  onSearch() {
  

    console.log('Search Data:', this.form.value);

    this.agent.tripPlan.set(this.samplResp)
    this.router.navigate(['/travel/result']);
  }

  samplResp = {"destination":"Tokyo","fromCity":"New York","startDate":"2026-05-01","endDate":"2026-05-05","summary":"A 5-day immersive journey through Tokyo, blending deep-tech exploration in Akihabara, scenic mountain hiking at Mt. Takao and Mt. Mitake, and a comprehensive culinary tour of Japan's capital.","estimatedTotalBudget":"$5,000","budgetBreakdown":{"flights":"$2,200","hotels":"$1,400","food":"$1,120","transportation":"$280"},"flights":[{"fromCity":"New York (JFK)","toCity":"Tokyo (HND)","estimatedPrice":"$1,100 per person","duration":"14h 05m","stops":"Non-stop","details":[{"airline":"Japan Airlines","flightNumber":"JL5","departureTime":"13:30","arrivalTime":"16:35 (+1 day)","gate":"Gate 12"}]},{"fromCity":"Tokyo (HND)","toCity":"New York (JFK)","estimatedPrice":"Included in Round Trip","duration":"13h 10m","stops":"Non-stop","details":[{"airline":"Japan Airlines","flightNumber":"JL6","departureTime":"11:15","arrivalTime":"11:05","gate":"Gate 112"}]}],"hotels":[{"name":"APA Hotel Shinjuku Kabukicho Tower","description":"A modern high-rise hotel featuring an open-air public bath and compact, efficient rooms perfect for tech-savvy travelers.","estimatedPricePerNight":"$100","location":"1-20-2 Kabukicho, Shinjuku, Tokyo"}],
  "dailyItinerary":[{"day":1,"date":"2026-05-01","title":"Departure from New York","weather":{"condition":"Clear","temperature":"18\u00b0C"},
    "activities":[{"name":"JFK Airport Departure","time":"10:30","description":"Check-in for flight JL5 to Tokyo Haneda.","location":"JFK Terminal 8","estimatedCost":"$0","type":"travel"}]},
    {"day":2,"date":"2026-05-02","title":"Arrival and Shinjuku Neon","weather":{"condition":"Mild","temperature":"20\u00b0C"},
    "activities":[{"name":"Arrival at Haneda","time":"16:35","description":"Clear customs and take the Monorail to central Tokyo.","location":"Haneda Airport","estimatedCost":"$15","type":"travel"},{"name":"Dinner at Ichiran Ramen","time":"20:00","description":"Classic tonkotsu ramen with individual booths.","location":"Shinjuku","estimatedCost":"$15","type":"restaurant"}]},
    {"day":3,"date":"2026-05-03","title":"Coding Culture in Akihabara","weather":{"condition":"Sunny","temperature":"22\u00b0C"},"activities":[{"name":"Akihabara Electric Town","time":"10:00","description":"Explore multi-story electronics shops and retro gaming centers.","location":"Akihabara","estimatedCost":"$0","type":"activity"},{"name":"GEEK BAR","time":"19:00","description":"A themed bar where developers and tech enthusiasts gather.","location":"Nakano","estimatedCost":"$30","type":"restaurant"}]},
    {"day":4,"date":"2026-05-04","title":"Hiking Mt. Takao","weather":{"condition":"Clear","temperature":"19\u00b0C"},"activities":[{"name":"Mt. Takao Summit Hike","time":"09:00","description":"Hike Trail 1 to the summit for views of Mt. Fuji.","location":"Hachioji","estimatedCost":"$10","type":"activity"},{"name":"Tengu-ya Soba","time":"13:00","description":"Traditional buckwheat noodles at the base of the mountain.","location":"Mt. Takao","estimatedCost":"$15","type":"restaurant"}]},
    {"day":5,"date":"2026-05-15","title":"Return to New York","weather":{"condition":"Mild","temperature":"20\u00b0C"},"activities":[{"name":"Travel to Haneda","time":"08:00","description":"Final transit to the airport.","location":"Haneda Airport","estimatedCost":"$10","type":"travel"},{"name":"Departure Flight","time":"11:15","description":"Boarding flight JL6 to New York.","location":"Haneda Terminal 3","estimatedCost":"$0","type":"travel"}]}]}
}
