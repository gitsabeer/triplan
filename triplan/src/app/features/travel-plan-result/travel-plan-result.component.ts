import { Component, inject, OnInit, signal, ElementRef, ViewChild  } from '@angular/core';
import { TravelAiAgentService } from '../../services/travel-ai-agent.service';
import { DatePipe, NgClass, NgFor, NgIf,Location  } from '@angular/common';
import { TravelPlan } from '../../models/travel-plan.model';
import { 
  LucideAngularModule
} from 'lucide-angular';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf'

@Component({
  selector: 'app-travel-plan-result',
  standalone: true,
  imports: [NgClass, NgFor, NgIf, LucideAngularModule,DatePipe], 
  templateUrl: './travel-plan-result.component.html',
  styleUrl: './travel-plan-result.component.scss'
})
export class TravelPlanResultComponent implements OnInit {
  @ViewChild('pdfContent') pdfContent!: ElementRef;

  agent = inject(TravelAiAgentService);
  plan: TravelPlan | undefined;
  viewMode = signal<'itinerary' | 'logistics'>('itinerary');

  constructor(private location: Location) {}

  ngOnInit() {
    this.plan = this.agent.tripPlan();
  }

  setView(mode: 'itinerary' | 'logistics') {
    this.viewMode.set(mode);
  }

  goBack(){
    this.location.back();
  }

  download(){

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
