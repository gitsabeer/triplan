import { ApplicationConfig, ErrorHandler, importProvidersFrom, ModuleWithProviders, provideAppInitializer, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';
import { GlobalErrorHandler } from './services/global-error-handler.service';
import { removeToken } from './utils/token-utils';
import {
  CalendarIcon,
  CircleChevronLeft,
  CircleChevronLeftIcon,
  Clock,
  ClockIcon,
  CloudSun,
  CloudSunIcon,
  HotelIcon,
  LogOutIcon,
  LucideAngularModule,
  MapPin,
  MapPinIcon,
  PlaneIcon,
  SparklesIcon,
  UsersIcon,
  UtensilsIcon,
  WalletIcon
} from 'lucide-angular';

export function clearJwtOnStartup() {
  removeToken()
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    provideAppInitializer(clearJwtOnStartup),
    importProvidersFrom(LucideAngularModule.pick({ CloudSunIcon, ClockIcon, MapPinIcon, PlaneIcon, HotelIcon, CalendarIcon, UsersIcon, WalletIcon, SparklesIcon, CircleChevronLeftIcon, LogOutIcon, UtensilsIcon })),
    { provide: ErrorHandler, useClass: GlobalErrorHandler }]
};


