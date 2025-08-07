import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ProjectService, FlutterProject } from '../services/project.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface Language {
  id: number;
  code: string;
  name: string;
  is_active: boolean;
}

@Component({
  selector: 'app-project-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="settings-container">
      <div class="settings-card">
        <h1 class="settings-title">Project Settings</h1>

        @if (loading) {
          <div class="loading">Loading project...</div>
        } @else if (project) {
          <form (ngSubmit)="onSubmit()" #settingsForm="ngForm">
            <div class="form-group">
              <label for="name">Project Name</label>
              <input
                type="text"
                id="name"
                [(ngModel)]="project.name"
                name="name"
                required
                class="form-input">
            </div>

            <div class="form-group">
              <label for="package_name">Package Name</label>
              <input
                type="text"
                id="package_name"
                [(ngModel)]="project.package_name"
                name="package_name"
                required
                class="form-input"
                readonly>
              <p class="text-xs text-gray-500 mt-1">Package name cannot be changed after creation</p>
            </div>

            <div class="form-group">
              <label for="description">Description</label>
              <textarea
                id="description"
                [(ngModel)]="project.description"
                name="description"
                rows="3"
                class="form-input"></textarea>
            </div>

            <div class="form-group">
              <label>Supported Languages</label>
              <div class="languages-grid">
                @if (loadingLanguages) {
                  <p class="text-sm text-gray-500">Loading languages...</p>
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

            @if (success) {
              <div class="success-message">
                Settings saved successfully!
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
                [disabled]="!settingsForm.form.valid || saving || project.supported_language_ids.length === 0"
                class="btn-primary">
                {{ saving ? 'Saving...' : 'Save Changes' }}
              </button>
            </div>
          </form>
        }
      </div>
    </div>
  `,
  styles: [`
    .settings-container {
      @apply min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4;
    }

    .settings-card {
      @apply max-w-2xl w-full bg-white p-8 rounded-lg shadow-lg;
    }

    .settings-title {
      @apply text-2xl font-bold text-gray-900 mb-6;
    }

    .loading {
      @apply text-center py-8 text-gray-600;
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

    .success-message {
      @apply text-green-600 text-sm mb-4 p-3 bg-green-50 rounded-md;
    }
  `]
})
export class ProjectSettingsComponent implements OnInit {
  project: FlutterProject | null = null;
  loading = true;
  loadingLanguages = true;
  saving = false;
  error = '';
  success = false;
  availableLanguages: Language[] = [];

  constructor(
    private projectService: ProjectService,
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.params['id'];
    this.loadProject(Number(id));
    this.loadAvailableLanguages();
  }

  loadProject(id: number) {
    this.loading = true;
    this.projectService.getProject(id).subscribe({
      next: (project: FlutterProject) => {
        this.project = project;
        // Ensure supported_language_ids is an array
        if (!this.project.supported_language_ids) {
          this.project.supported_language_ids = [1]; // Default to English
        }
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading project:', error);
        this.error = 'Failed to load project';
        this.loading = false;
      }
    });
  }

  loadAvailableLanguages() {
    this.loadingLanguages = true;
    this.http.get<Language[]>(`${environment.apiUrl}/version/languages/available/`).subscribe({
      next: (languages) => {
        this.availableLanguages = languages.filter(lang => lang.is_active);
        this.loadingLanguages = false;
      },
      error: (error) => {
        console.error('Error loading languages:', error);
        // Fallback to default languages
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
    return this.project?.supported_language_ids?.includes(languageId) || false;
  }

  toggleLanguage(languageId: number) {
    if (!this.project) return;

    if (!this.project.supported_language_ids) {
      this.project.supported_language_ids = [];
    }

    const index = this.project.supported_language_ids.indexOf(languageId);
    if (index > -1) {
      this.project.supported_language_ids.splice(index, 1);
    } else {
      this.project.supported_language_ids.push(languageId);
    }
  }

  onSubmit() {
    if (!this.project) return;

    if (this.project.supported_language_ids.length === 0) {
      this.error = 'Please select at least one language';
      return;
    }

    this.saving = true;
    this.error = '';
    this.success = false;

    this.projectService.updateProject(this.project.id, this.project).subscribe({
      next: () => {
        this.success = true;
        this.saving = false;
        setTimeout(() => {
          this.success = false;
        }, 3000);
      },
      error: (error: any) => {
        this.error = error.error?.detail || 'Failed to save settings';
        this.saving = false;
      }
    });
  }

  cancel() {
    this.router.navigate(['/projects']);
  }
}
