import { Component, inject, signal, HostListener, ElementRef, ViewChild } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { AppStateService } from './services/app-state.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, FormsModule, LucideAngularModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  appState = inject(AppStateService);
  router = inject(Router);

  showSettings = signal(false);

  // Reference to dropdown for click-outside detection
  @ViewChild('settingsDropdown') settingsDropdown!: ElementRef;

  // Listen for clicks on the entire document
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.showSettings() && this.settingsDropdown) {
      const clickedInside = this.settingsDropdown.nativeElement.contains(event.target);
      if (!clickedInside) {
        this.showSettings.set(false);
      }
    }
  }

  toggleSettings(event: MouseEvent) {
    // Prevent document click handler from immediately closing the dropdown we're opening
    event.stopPropagation();
    this.showSettings.update(v => !v);
  }

  setTheme(themeMode: 'normal' | 'dark') {
    if (this.appState.theme() !== themeMode) {
      this.appState.theme.set(themeMode);
    }
  }

  onLanguageChange(lang: 'en' | 'es' | 'ja') {
    this.appState.setLanguage(lang);
    this.showSettings.set(false); // Close dropdown after selection
  }

  navigateToProfile() {
    this.showSettings.set(false);
    this.router.navigate(['/travel/profile']);
  }

  goHome() {
    this.showSettings.set(false);
    this.router.navigate(['/travel']);
  }

  // Helpers to bind in template
  theme() {
    return this.appState.theme();
  }

  language() {
    return this.appState.language();
  }
}
