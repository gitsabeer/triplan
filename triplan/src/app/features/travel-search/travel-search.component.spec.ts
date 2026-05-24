import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';

import { TravelSearchComponent } from './travel-search.component';

describe('TravelSearchComponent', () => {
  let component: TravelSearchComponent;
  let fixture: ComponentFixture<TravelSearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TravelSearchComponent],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        provideAnimations()
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TravelSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
