import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: 'travel',
        loadChildren: () =>
            import('./features/travel.routes').then(m => m.TRAVEL_ROUTES)
    },
    {
        path: '',
        redirectTo: 'travel',
        pathMatch: 'full'
    }
];
