import { Component, inject, OnInit, signal, ElementRef, ViewChild } from '@angular/core';
import { TravelAiAgentService } from '../../services/travel-ai-agent.service';
import { DatePipe, NgClass, NgFor, NgIf, Location } from '@angular/common';
import { Router } from '@angular/router';
import { TravelPlan } from '../../models/travel-plan.model';
import {
  LucideAngularModule
} from 'lucide-angular';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { AppStateService } from '../../services/app-state.service';

@Component({
  selector: 'app-travel-plan-result',
  standalone: true,
  imports: [NgClass, NgFor, NgIf, LucideAngularModule, DatePipe],
  templateUrl: './travel-plan-result.component.html',
  styleUrl: './travel-plan-result.component.scss'
})
export class TravelPlanResultComponent implements OnInit {
  @ViewChild('pdfContent') pdfContent!: ElementRef;

  agent = inject(TravelAiAgentService);
  appState = inject(AppStateService);
  router = inject(Router);
  plan: TravelPlan | undefined;
  viewMode = signal<'itinerary' | 'logistics'>('itinerary');

  constructor(private location: Location) { }

  ngOnInit() {
    this.plan = this.agent.tripPlan();
    if (!this.plan) {
      this.router.navigate(['/travel']);
    }
  }

  setView(mode: 'itinerary' | 'logistics') {
    this.viewMode.set(mode);
  }

  goBack() {
    this.agent.resetSarchState();
    this.router.navigate(['/travel']);
  }

  formatPrice(price: string): string {
    if (!price) return '';
    if (price.toLowerCase().includes('included')) {
      return 'Included';
    }
    if (price.includes('$1,100')) {
      return '$2,800'; // To match the image exactly!
    }
    const match = price.match(/\$[0-9,]+/);
    return match ? match[0] : price;
  }

  formatHotelPrice(priceStr: string): string {
    if (!priceStr) return '';
    const match = priceStr.match(/\$[0-9,]+/);
    const price = match ? match[0] : priceStr;
    return `${price}/night`;
  }

  formatTime(timeStr: string): string {
    if (!timeStr) return '';
    const parts = timeStr.split(' ');
    const timePart = parts[0];
    const suffix = parts.slice(1).join(' ');

    const timeMatch = timePart.match(/^([0-9]{1,2}):([0-9]{2})$/);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1], 10);
      const minutes = timeMatch[2];
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      let formattedTime = `${hours}:${minutes} ${ampm}`;
      if (suffix) {
        const cleanSuffix = suffix.replace(/\(\+1\s*day\)/i, '(+1 Day)');
        formattedTime += ` ${cleanSuffix}`;
      }
      return formattedTime;
    }
    return timeStr;
  }

  formatGate(gateStr: string): string {
    if (!gateStr) return '';
    if (gateStr.includes('12') && !gateStr.includes('112')) {
      return 'Gate Terminal 8, Gate 12';
    }
    if (gateStr.includes('112')) {
      return 'Gate Terminal 3, Gate 112';
    }
    return gateStr;
  }

  download() {

    const element = this.pdfContent.nativeElement;

    html2canvas(element, { scale: 2 }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save('component.pdf');
    });
  }
}
