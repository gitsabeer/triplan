import { Component } from '@angular/core';
import { TravelSearchComponent } from './features/travel-search/travel-search.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [TravelSearchComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'triplan';
}
