// travel-plan.model.ts
export interface TravelPlan {
  destination: string;
  fromCity: string;
  startDate: string;
  endDate: string;
  summary: string;
  estimatedTotalBudget: string;
  budgetBreakdown: {
    flights: string;
    hotels: string;
    food: string;
    transportation: string;
  };
  flights: FlightSegment[];
  hotels: Hotel[];
  dailyItinerary: ItineraryDay[];
}

export interface FlightSegment {
  fromCity: string;
  toCity: string;
  estimatedPrice: string;
  duration: string;
  stops: string;
  details: FlightDetail[];
}

export interface FlightDetail {
  airline: string;
  flightNumber: string;
  departureTime: string;
  arrivalTime: string;
  gate: string;
}

export interface Hotel {
  name: string;
  description: string;
  estimatedPricePerNight: string;
  location: string;
}

export interface ItineraryDay {
  day: number;
  date: string;
  title: string;
  weather: {
    condition: string;
    temperature: string;
  };
  activities: Activity[];
}

export interface Activity {
  name: string;
  time: string;
  description: string;
  location: string;
  estimatedCost: string;
  type: 'travel' | 'restaurant' | 'activity' | string;
}
