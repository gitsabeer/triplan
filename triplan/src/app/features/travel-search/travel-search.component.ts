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

  searchFormValidator(group: FormGroup) {
    const from = group.get('from');
    const to = group.get('to');
    const departDate = group.get('departDate');
    const returnDate = group.get('returnDate');

    // Reset custom errors
    if (to?.hasError('sameCities')) {
      const errs = { ...to.errors };
      delete errs['sameCities'];
      to.setErrors(Object.keys(errs).length ? errs : null);
    }
    if (returnDate?.hasError('sameDates')) {
      const errs = { ...returnDate.errors };
      delete errs['sameDates'];
      returnDate.setErrors(Object.keys(errs).length ? errs : null);
    }

    // 1. Same cities validation
    if (from?.value && to?.value && from.value.trim().toLowerCase() === to.value.trim().toLowerCase()) {
      to.setErrors({ ...to.errors, sameCities: true });
    }

    // 2. Same dates validation
    if (departDate?.value && returnDate?.value) {
      const d1 = new Date(departDate.value);
      const d2 = new Date(returnDate.value);
      d1.setHours(0, 0, 0, 0);
      d2.setHours(0, 0, 0, 0);

      if (d1.getTime() === d2.getTime()) {
        returnDate.setErrors({ ...returnDate.errors, sameDates: true });
      }
    }
    return null;
  }

  ngOnInit(): void {
    this.agent.resetSarchState();
    this.form = this.fb.group({
      from: ['', Validators.required],
      to: ['', Validators.required],
      departDate: ['', Validators.required],
      returnDate: ['', Validators.required],
      travelers: [1, Validators.required],
      budget: ['moderate', Validators.required],
      interests: [[]]
    }, { validators: this.searchFormValidator });
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
    if (this.form.invalid && !this.agent.isDemoMode()) {
      this.form.markAllAsTouched();
      return;
    }

    this.agent.searchData.set(new SearchData(this.form.value));
    this.router.navigate(['/travel/progress']);
  }


}
