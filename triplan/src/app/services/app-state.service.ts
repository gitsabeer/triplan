import { Injectable, signal, effect } from '@angular/core';

export interface UserProfile {
  name: string;
  email: string;
  bio: string;
  favorites: string;
}

export interface UserTripItem {
  id: number;
  title: string;
  date: string;
  travelers: number;
  budget: string;
  status: 'Upcoming' | 'Completed';
}

@Injectable({
  providedIn: 'root'
})
export class AppStateService {
  // Theme Signal ('normal' | 'dark')
  theme = signal<'normal' | 'dark'>('normal');

  // Language Signal ('en' | 'es' | 'ja')
  language = signal<'en' | 'es' | 'ja'>('en');

  // User Profile Signal
  userProfile = signal<UserProfile>({
    name: 'Siji Sabeer',
    email: 'siji@triplan.ai',
    bio: 'Tech enthusiast and adventurous traveler who loves exploring hidden hiking trails and authentic local cuisines.',
    favorites: 'Culture, Hiking, Food'
  });

  // User Saved Items (Trips)
  userItems = signal<UserTripItem[]>([
    {
      id: 1,
      title: 'Trip to Tokyo, Japan',
      date: 'May 1 – May 5, 2026',
      travelers: 2,
      budget: '$5,000',
      status: 'Upcoming'
    },
    {
      id: 2,
      title: 'Summer in Paris, France',
      date: 'Jul 10 – Jul 18, 2025',
      travelers: 1,
      budget: '$3,500',
      status: 'Completed'
    }
  ]);

  private translations = {
    en: {
      SUBTITLE: "Your personal AI travel agent. Tell us where you want to go, and we'll handle the rest.",
      FROM_CITY: "From City",
      DESTINATION: "Destination",
      DEPART: "Depart",
      RETURN: "Return",
      TRAVELERS: "Travelers",
      BUDGET: "Budget",
      INTERESTS: "Interests",
      EXPLORE: "Explore Itinerary",
      ITINERARY: "Itinerary",
      LOGISTICS: "Logistics & Flights",
      DAILY_ITINERARY: "Daily Itinerary",
      FLIGHT_SUGGESTIONS: "Flight Suggestions",
      RECOMMENDED_STAYS: "Recommended Stays",
      ROUTE: "Route",
      DURATION: "Duration",
      EST_PRICE: "Est. Price",
      BOOK_FLIGHT: "Book Flight",
      BOOK_STAY: "Book Stay",
      BUDGET_BREAKDOWN: "Budget Breakdown",
      OVERVIEW: "Overview",
      DOWNLOAD_PDF: "Download PDF",
      DAY: "Day",
      DAYS: "days",
      TRIP_OVERVIEW: "Trip Overview",
      BUDGET_LEVEL: "Budget Level",
      FLIGHTS: "Flights",
      HOTELS: "Hotels",
      FOOD: "Food",
      TRANSIT: "Taxi/Transit",
      EST_COST: "Est. Cost",
      FLIGHT_DEPART: "Depart",
      FLIGHT_ARRIVE: "Arrive"
    },
    es: {
      SUBTITLE: "Tu agente de viajes personal con IA. Cuéntanos a dónde quieres ir y nosotros nos encargamos del resto.",
      FROM_CITY: "Ciudad de origen",
      DESTINATION: "Destino",
      DEPART: "Salida",
      RETURN: "Regreso",
      TRAVELERS: "Viajeros",
      BUDGET: "Presupuesto",
      INTERESTS: "Intereses",
      EXPLORE: "Explorar Itinerario",
      ITINERARY: "Itinerary",
      LOGISTICS: "Logística y Vuelos",
      DAILY_ITINERARY: "Itinerario Diario",
      FLIGHT_SUGGESTIONS: "Sugerencias de Vuelos",
      RECOMMENDED_STAYS: "Alojamientos Recomendados",
      ROUTE: "Ruta",
      DURATION: "Duración",
      EST_PRICE: "Precio Est.",
      BOOK_FLIGHT: "Reservar Vuelo",
      BOOK_STAY: "Reservar Estancia",
      BUDGET_BREAKDOWN: "Desglose de Presupuesto",
      OVERVIEW: "Resumen",
      DOWNLOAD_PDF: "Descargar PDF",
      DAY: "Día",
      DAYS: "días",
      TRIP_OVERVIEW: "Resumen del viaje",
      BUDGET_LEVEL: "Nivel de presupuesto",
      FLIGHTS: "Vuelos",
      HOTELS: "Hoteles",
      FOOD: "Comida",
      TRANSIT: "Taxi/Tránsito",
      EST_COST: "Costo Est.",
      FLIGHT_DEPART: "Salida",
      FLIGHT_ARRIVE: "Llegada"
    },
    ja: {
      SUBTITLE: "あなた専用のAI旅行代理店。行きたい場所を教えていただければ、残りはすべてお任せください。",
      FROM_CITY: "出発都市",
      DESTINATION: "目的地",
      DEPART: "出発日",
      RETURN: "帰国日",
      TRAVELERS: "旅行者数",
      BUDGET: "予算",
      INTERESTS: "興味・関心",
      EXPLORE: "旅程を計画する",
      ITINERARY: "旅程",
      LOGISTICS: "ロジスティクス＆フライト",
      DAILY_ITINERARY: "毎日の旅程",
      FLIGHT_SUGGESTIONS: "おすすめフライト",
      RECOMMENDED_STAYS: "おすすめの宿泊先",
      ROUTE: "ルート",
      DURATION: "所要時間",
      EST_PRICE: "予想価格",
      BOOK_FLIGHT: "フライトを予約",
      BOOK_STAY: "宿泊先を予約",
      BUDGET_BREAKDOWN: "予算の内訳",
      OVERVIEW: "概要",
      DOWNLOAD_PDF: "PDFをダウンロード",
      DAY: "日目",
      DAYS: "日間",
      TRIP_OVERVIEW: "旅行の概要",
      BUDGET_LEVEL: "予算レベル",
      FLIGHTS: "フライト",
      HOTELS: "ホテル",
      FOOD: "食事",
      TRANSIT: "タクシー/交通機関",
      EST_COST: "予想費用",
      FLIGHT_DEPART: "出発",
      FLIGHT_ARRIVE: "到着"
    }
  };

  constructor() {
    // Sync theme with DOM body class whenever theme signal changes
    effect(() => {
      const currentTheme = this.theme();
      if (currentTheme === 'dark') {
        document.body.classList.add('dark-theme');
      } else {
        document.body.classList.remove('dark-theme');
      }
    });
  }

  toggleTheme() {
    this.theme.update(t => t === 'normal' ? 'dark' : 'normal');
  }

  setLanguage(lang: 'en' | 'es' | 'ja') {
    this.language.set(lang);
  }

  updateProfile(profile: UserProfile) {
    this.userProfile.set(profile);
  }

  addTrip(trip: Omit<UserTripItem, 'id'>) {
    const nextId = this.userItems().length > 0 
      ? Math.max(...this.userItems().map(t => t.id)) + 1 
      : 1;
    this.userItems.update(items => [...items, { ...trip, id: nextId }]);
  }

  deleteTrip(id: number) {
    this.userItems.update(items => items.filter(t => t.id !== id));
  }

  t(key: keyof typeof this.translations.en): string {
    const lang = this.language();
    return this.translations[lang][key] || this.translations.en[key] || '';
  }
}
