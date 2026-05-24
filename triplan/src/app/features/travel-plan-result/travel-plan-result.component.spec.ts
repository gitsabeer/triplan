import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { TravelPlanResultComponent } from './travel-plan-result.component';

describe('TravelPlanResultComponent', () => {
  let component: TravelPlanResultComponent;
  let fixture: ComponentFixture<TravelPlanResultComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TravelPlanResultComponent],
      providers: [
        provideHttpClient(),
        provideRouter([])
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TravelPlanResultComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
