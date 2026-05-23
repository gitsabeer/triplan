import { CommonModule, Location } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AppStateService, UserProfile } from '../../services/app-state.service';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-travel-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './travel-profile.component.html',
  styleUrls: ['./travel-profile.component.scss']
})
export class TravelProfileComponent implements OnInit {
  appState = inject(AppStateService);
  fb = inject(FormBuilder);
  location = inject(Location);

  profileForm!: FormGroup;
  isEditing = false;
  successMessage = '';

  ngOnInit() {
    const currentProfile = this.appState.userProfile();
    this.profileForm = this.fb.group({
      name: [currentProfile.name, Validators.required],
      email: [currentProfile.email, [Validators.required, Validators.email]],
      bio: [currentProfile.bio],
      favorites: [currentProfile.favorites]
    });
  }

  toggleEdit() {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      // Reset form to current state if cancelled
      this.profileForm.patchValue(this.appState.userProfile());
      this.successMessage = '';
    }
  }

  onSave() {
    if (this.profileForm.valid) {
      this.appState.updateProfile(this.profileForm.value as UserProfile);
      this.isEditing = false;
      this.successMessage = this.appState.language() === 'es' 
        ? '¡Perfil guardado con éxito!' 
        : this.appState.language() === 'ja'
        ? 'プロファイルが正常に保存されました！'
        : 'Profile successfully saved!';
      
      setTimeout(() => {
        this.successMessage = '';
      }, 3000);
    }
  }

  onDeleteTrip(id: number) {
    if (confirm(
      this.appState.language() === 'es' 
        ? '¿Estás seguro de que quieres eliminar este itinerario?' 
        : this.appState.language() === 'ja'
        ? 'この旅程を削除してもよろしいですか？'
        : 'Are you sure you want to delete this itinerary?'
    )) {
      this.appState.deleteTrip(id);
    }
  }

  goBack() {
    this.location.back();
  }

  // Language translation helper shortcut
  t(key: any): string {
    return this.appState.t(key);
  }
}
