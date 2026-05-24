import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AppStateService } from '../../services/app-state.service';
import { TravelAiAgentService } from '../../services/travel-ai-agent.service';
import { SearchData } from '../../models/search-data.model';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';

@Component({
  selector: 'app-travel-search',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCardModule,
    MatDatepickerModule
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './travel-search.component.html',
  styleUrls: ['./travel-search.component.scss']
})
export class TravelSearchComponent implements OnInit {
  form!: FormGroup;
  appState = inject(AppStateService);
  agent = inject(TravelAiAgentService);

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

  minDate: Date = (() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  })();

  constructor() { }

  ngOnInit(): void {
    this.form = this.fb.group({
      from: ['', Validators.required],
      to: ['', Validators.required],
      departDate: ['', Validators.required],
      returnDate: ['', Validators.required],
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
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.agent.searchData.set(new SearchData(this.form.value));
    this.router.navigate(['/travel/progress']);
  }


}
