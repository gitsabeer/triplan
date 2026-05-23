import { Routes } from '@angular/router';
import { TravelSearchComponent } from './travel-search/travel-search.component';
import { TravelPlanResultComponent } from './travel-plan-result/travel-plan-result.component';
import { ServiceProgressComponent } from './service-progress/service-progress.component';
import { TravelProfileComponent } from './travel-profile/travel-profile.component';

export const TRAVEL_ROUTES: Routes = [
  {
    path: '',
    component: TravelSearchComponent
  },
  { path: 'progress', component: ServiceProgressComponent },
  {
    path: 'result',
    component: TravelPlanResultComponent
  },
  {
    path: 'profile',
    component: TravelProfileComponent
  }
];
