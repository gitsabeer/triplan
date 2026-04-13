import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-travel-search',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './travel-search.component.html',
  styleUrls: ['./travel-search.component.scss']
})
export class TravelSearchComponent implements OnInit {
  form!: FormGroup;

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

  constructor(private fb: FormBuilder) {}

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
    if (this.form.invalid) return;

    console.log('Search Data:', this.form.value);

    // TODO: Call your travel API or agent
  }
}
