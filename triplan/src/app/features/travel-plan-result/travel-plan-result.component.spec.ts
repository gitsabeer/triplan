import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TravelPlanResultComponent } from './travel-plan-result.component';

describe('TravelPlanResultComponent', () => {
  let component: TravelPlanResultComponent;
  let fixture: ComponentFixture<TravelPlanResultComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TravelPlanResultComponent]
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
