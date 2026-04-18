import { TestBed } from '@angular/core/testing';

import { TravelAiAgentService } from './travel-ai-agent.service';

describe('TravelAiAgentService', () => {
  let service: TravelAiAgentService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TravelAiAgentService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
