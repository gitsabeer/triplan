import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-error-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="error-container">
      <h1>{{ message.details }}</h1>
      <p>{{ message.error }}</p>

      <button (click)="reload()">Try Again</button>
    </div>
  `,
  styles: [`
    .error-container {
      padding: 40px;
      text-align: center;
      max-width: 500px;
      margin: 80px auto;
      border-radius: 12px;
      background: #fff3f3;
      border: 1px solid #ffb3b3;
    }
    h1 {
      color: #d9534f;
      margin-bottom: 16px;
    }
    button {
      padding: 10px 20px;
      border: none;
      background: #d9534f;
      color: white;
      border-radius: 6px;
      cursor: pointer;
    }
  `]
})
export class ErrorPageComponent {
  message = {details:'Unexpected error occurred.' ,error :"Something went wrong"};

  constructor(private router: Router) {
    const nav = this.router.getCurrentNavigation();
    this.message =  nav?.extras?.state 
         ?? JSON.parse(sessionStorage.getItem('error') || '{}');
  }

  

  reload() {
     this.router.navigate(['/travel'], {
        });
  }
}
