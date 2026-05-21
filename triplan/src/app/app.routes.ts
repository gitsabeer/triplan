import { Routes } from '@angular/router';
import { TRAVEL_ROUTES } from './features/travel.routes';
import { ErrorPageComponent } from './components/error-page/error-page.component';

export const routes: Routes = [
    {
        path: 'travel',        
        children: TRAVEL_ROUTES
    },
    { path: 'error', component: ErrorPageComponent },
    { path: '', redirectTo: 'travel', pathMatch: 'full' },
    { path: '**', redirectTo: 'error' }
];
