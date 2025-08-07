import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProjectService } from '../services/project.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface Language {
  id: number;
  code: string;
  name: string;
  is_active: boolean;
}

@Component({
  selector: 'app-project-create',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="create-container">
      <div class="create-card">
        <h1 class="create-title">Create New Flutter Project</h1>

        <form (ngSubmit)="onSubmit()" #projectForm="ngForm">
          <div class="form-group">
            <label for="name">Project Name *</label>
            <input
              type="text"
              id="name"
              [(ngModel)]="project.name"
              name="name"
              required
              class="form-input"
              placeholder="My Awesome App">
          </div>

          <div class="form-group">
            <label for="package_name">Package Name *</label>
            <input
              type="text"
              id="package_name"
              [(ngModel)]="project.package_name"
              name="package_name"
              required
              pattern="^[a-z][a-z0-9_]*(\\.[a-z][a-z0-9_]*)*$"
              class="form-input"
              placeholder="com.example.myapp">
            <p class="text-xs text-gray-500 mt-1">Must be in reverse domain format (e.g., com.example.app)</p>
          </div>

          <div class="form-group">
            <label for="description">Description</label>
            <textarea
              id="description"
              [(ngModel)]="project.description"
              name="description"
              rows="3"
              class="form-input"
              placeholder="Describe your project..."></textarea>
          </div>

          <div class="form-group">
            <label>Supported Languages *</label>
            <div class="languages-grid">
              @if (loadingLanguages) {
                <p class="text-sm text-gray-500">Loading languages...</p>
              } @else if (availableLanguages.length === 0) {
                <p class="text-sm text-gray-500">No languages available</p>
              } @else {
                @for (language of availableLanguages; track language.id) {
                  <label class="language-checkbox">
                    <input
                      type="checkbox"
                      [value]="language.id"
                      [checked]="isLanguageSelected(language.id)"
                      (change)="toggleLanguage(language.id)"
                      class="checkbox-input">
                    <span class="language-label">
                      {{ language.name }} ({{ language.code }})
                    </span>
                  </label>
                }
              }
            </div>
            @if (project.supported_language_ids.length === 0) {
              <p class="text-xs text-red-500 mt-1">Please select at least one language</p>
            }
          </div>

          <div class="form-row">
            <div class="form-group flex-1">
              <label for="primary_color">Primary Color</label>
              <input
                type="color"
                id="primary_color"
                [(ngModel)]="project.primary_color"
                name="primary_color"
                class="color-input">
            </div>

            <div class="form-group flex-1">
              <label for="secondary_color">Secondary Color</label>
              <input
                type="color"
                id="secondary_color"
                [(ngModel)]="project.secondary_color"
                name="secondary_color"
                class="color-input">
            </div>
          </div>

          @if (error) {
            <div class="error-message">
              {{ error }}
            </div>
          }

          <div class="form-actions">
            <button
              type="button"
              (click)="cancel()"
              class="btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              [disabled]="!projectForm.form.valid || loading || project.supported_language_ids.length === 0"
              class="btn-primary">
              {{ loading ? 'Creating...' : 'Create Project' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .create-container {
      @apply min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4;
    }

    .create-card {
      @apply max-w-2xl w-full bg-white p-8 rounded-lg shadow-lg;
    }

    .create-title {
      @apply text-2xl font-bold text-gray-900 mb-6;
    }

    .form-group {
      @apply mb-4;
    }

    .form-group label {
      @apply block text-sm font-medium text-gray-700 mb-2;
    }

    .form-input {
      @apply w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500;
    }

    .languages-grid {
      @apply grid grid-cols-2 md:grid-cols-3 gap-3 p-3 bg-gray-50 rounded-md max-h-60 overflow-y-auto;
    }

    .language-checkbox {
      @apply flex items-center space-x-2 cursor-pointer hover:bg-white p-2 rounded transition-colors;
    }

    .checkbox-input {
      @apply w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500;
    }

    .language-label {
      @apply text-sm text-gray-700;
    }

    .form-row {
      @apply flex gap-4;
    }

    .color-input {
      @apply w-full h-10 border border-gray-300 rounded-md cursor-pointer;
    }

    .form-actions {
      @apply flex gap-4 justify-end mt-6;
    }

    .btn-primary {
      @apply px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed;
    }

    .btn-secondary {
      @apply px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500;
    }

    .error-message {
      @apply text-red-600 text-sm mb-4 p-3 bg-red-50 rounded-md;
    }
  `]
})
export class ProjectCreateComponent implements OnInit {
  project = {
    name: '',
    package_name: '',
    description: '',
    primary_color: '#2196F3',
    secondary_color: '#FF5722',
    supported_language_ids: [1] // Default to English (ID: 1)
  };
  loading = false;
  loadingLanguages = true;
  error = '';
  availableLanguages: Language[] = [];

  constructor(
    private projectService: ProjectService,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.loadAvailableLanguages();
  }

  loadAvailableLanguages() {
    this.loadingLanguages = true;
    // Try to load languages from the version API
    this.http.get<Language[]>(`${environment.apiUrl}/version/languages/available/`).subscribe({
      next: (languages) => {
        this.availableLanguages = languages.filter(lang => lang.is_active);
        this.loadingLanguages = false;

        // If no languages are available, add a default English option
        if (this.availableLanguages.length === 0) {
          this.availableLanguages = [
            { id: 1, code: 'en', name: 'English', is_active: true }
          ];
        }
      },
      error: (error) => {
        console.error('Error loading languages:', error);
        // Fallback to default languages if API fails
        this.availableLanguages = [
          { id: 1, code: 'en', name: 'English', is_active: true },
          { id: 2, code: 'ar', name: 'Arabic', is_active: true },
          { id: 3, code: 'es', name: 'Spanish', is_active: true },
          { id: 4, code: 'fr', name: 'French', is_active: true }
        ];
        this.loadingLanguages = false;
      }
    });
  }

  isLanguageSelected(languageId: number): boolean {
    return this.project.supported_language_ids.includes(languageId);
  }

  toggleLanguage(languageId: number) {
    const index = this.project.supported_language_ids.indexOf(languageId);
    if (index > -1) {
      this.project.supported_language_ids.splice(index, 1);
    } else {
      this.project.supported_language_ids.push(languageId);
    }
  }

  onSubmit() {
    if (this.project.supported_language_ids.length === 0) {
      this.error = 'Please select at least one language';
      return;
    }

    this.loading = true;
    this.error = '';

    this.projectService.createProject(this.project).subscribe({
      next: (project) => {
        this.router.navigate(['/builder'], {
          queryParams: { projectId: project.id }
        });
      },
      error: (error) => {
        this.error = error.error?.detail || error.error?.supported_language_ids?.[0] || 'Failed to create project';
        this.loading = false;
      }
    });
  }

  cancel() {
    this.router.navigate(['/projects']);
  }
}
