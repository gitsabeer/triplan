import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServiceProgressComponent } from './service-progress.component';

describe('ServiceProgressComponent', () => {
  let component: ServiceProgressComponent;
  let fixture: ComponentFixture<ServiceProgressComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServiceProgressComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ServiceProgressComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
