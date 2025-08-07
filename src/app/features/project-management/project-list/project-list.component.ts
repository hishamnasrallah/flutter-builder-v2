import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProjectService, FlutterProject } from '../services/project.service';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="project-list-container">
      <!-- Header -->
      <div class="list-header">
        <h1 class="text-2xl font-bold text-gray-800">My Flutter Projects</h1>
        <button
          class="btn-primary"
          (click)="createNewProject()">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 4v16m8-8H4"></path>
          </svg>
          New Project
        </button>
      </div>

      <!-- Search and Filter -->
      <div class="search-filter-bar">
        <input
          type="text"
          placeholder="Search projects..."
          [(ngModel)]="searchTerm"
          (input)="filterProjects()"
          class="search-input">

        <select
          [(ngModel)]="sortBy"
          (change)="sortProjects()"
          class="sort-select">
          <option value="created_at">Newest First</option>
          <option value="name">Name (A-Z)</option>
          <option value="updated_at">Recently Updated</option>
        </select>
      </div>

      <!-- Projects Grid -->
      <div class="projects-grid">
        @if (loading) {
          <div class="loading-spinner">
            <div class="spinner"></div>
            <p>Loading projects...</p>
          </div>
        } @else if (error) {
          <div class="error-state">
            <svg class="w-16 h-16 text-red-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z">
              </path>
            </svg>
            <h3 class="text-lg font-medium text-red-600 mt-4">Error Loading Projects</h3>
            <p class="text-gray-500 mt-2">{{ error }}</p>
            <button
              class="btn-primary mt-4"
              (click)="loadProjects()">
              Try Again
            </button>
          </div>
        } @else if (filteredProjects.length === 0 && searchTerm) {
          <div class="empty-state">
            <svg class="w-16 h-16 text-gray-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z">
              </path>
            </svg>
            <h3 class="text-lg font-medium text-gray-600 mt-4">No projects found</h3>
            <p class="text-gray-500 mt-2">No projects match your search "{{ searchTerm }}"</p>
            <button
              class="text-blue-600 hover:text-blue-700 mt-2"
              (click)="clearSearch()">
              Clear search
            </button>
          </div>
        } @else if (filteredProjects.length === 0) {
          <div class="empty-state">
            <svg class="w-24 h-24 text-gray-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10">
              </path>
            </svg>
            <h3 class="text-lg font-medium text-gray-600 mt-4">No projects yet</h3>
            <p class="text-gray-500 mt-2">Create your first Flutter project to get started</p>
            <button
              class="btn-primary mt-4"
              (click)="createNewProject()">
              Create First Project
            </button>
          </div>
        } @else {
          @for (project of filteredProjects; track project.id) {
            <div class="project-card" (click)="openProject(project)">
              <!-- Project Icon/Preview -->
              <div class="project-preview" [style.background-color]="project.primary_color || '#2196F3'">
                @if (project.app_icon) {
                  <img [src]="project.app_icon" alt="{{ project.name }}" class="app-icon">
                } @else {
                  <div class="default-icon">
                    {{ getInitials(project.name) }}
                  </div>
                }
              </div>

              <!-- Project Info -->
              <div class="project-info">
                <h3 class="project-name">{{ project.name }}</h3>
                <p class="project-package">{{ project.package_name }}</p>
                <p class="project-description">{{ project.description || 'No description' }}</p>
              </div>

              <!-- Project Actions -->
              <div class="project-actions">
                <button
                  class="action-btn"
                  (click)="editProject($event, project)"
                  title="Edit Settings">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z">
                    </path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                </button>

                <button
                  class="action-btn"
                  (click)="buildProject($event, project)"
                  title="Build APK">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V2">
                    </path>
                  </svg>
                </button>

                <button
                  class="action-btn text-red-600"
                  (click)="deleteProject($event, project)"
                  title="Delete Project">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16">
                    </path>
                  </svg>
                </button>
              </div>

              <!-- Last Updated -->
              <div class="project-footer">
                <span class="text-xs text-gray-500">
                  Updated {{ formatDate(project.updated_at) }}
                </span>
              </div>
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .project-list-container {
      @apply p-6 bg-gray-50 min-h-screen;
    }

    .list-header {
      @apply flex items-center justify-between mb-6;
    }

    .btn-primary {
      @apply flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors;
    }

    .search-filter-bar {
      @apply flex gap-4 mb-6;
    }

    .search-input {
      @apply flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500;
    }

    .sort-select {
      @apply px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500;
    }

    .projects-grid {
      @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6;
    }

    .project-card {
      @apply bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow cursor-pointer overflow-hidden;
    }

    .project-preview {
      @apply h-32 flex items-center justify-center;
    }

    .app-icon {
      @apply w-16 h-16 rounded-lg;
    }

    .default-icon {
      @apply text-white text-3xl font-bold;
    }

    .project-info {
      @apply p-4;
    }

    .project-name {
      @apply font-semibold text-gray-800;
    }

    .project-package {
      @apply text-xs text-gray-500 mt-1;
    }

    .project-description {
      @apply text-sm text-gray-600 mt-2 line-clamp-2;
    }

    .project-actions {
      @apply flex gap-2 px-4 pb-3;
    }

    .action-btn {
      @apply p-2 hover:bg-gray-100 rounded transition-colors;
    }

    .project-footer {
      @apply px-4 py-2 bg-gray-50 border-t border-gray-100;
    }

    .loading-spinner, .empty-state, .error-state {
      @apply col-span-full flex flex-col items-center justify-center py-12;
    }

    .spinner {
      @apply w-10 h-10 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin;
    }
  `]
})
export class ProjectListComponent implements OnInit {
  projects: FlutterProject[] = [];
  filteredProjects: FlutterProject[] = [];
  loading = true;
  error = '';
  searchTerm = '';
  sortBy = 'created_at';

  constructor(
    private projectService: ProjectService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadProjects();
  }

  loadProjects() {
    this.loading = true;
    this.error = '';

    this.projectService.getProjects().subscribe({
      next: (projects) => {
        console.log('Projects received:', projects);

        // Ensure projects is an array
        if (Array.isArray(projects)) {
          this.projects = projects;
        } else {
          console.error('Projects is not an array:', projects);
          this.projects = [];
          this.error = 'Invalid data format received from server';
        }

        this.filterProjects();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading projects:', error);
        this.error = error.error?.detail || 'Failed to load projects. Please try again.';
        this.projects = [];
        this.filteredProjects = [];
        this.loading = false;
      }
    });
  }

  createNewProject() {
    this.router.navigate(['/projects/create']);
  }

  openProject(project: FlutterProject) {
    this.router.navigate(['/builder'], {
      queryParams: { projectId: project.id }
    });
  }

  editProject(event: Event, project: FlutterProject) {
    event.stopPropagation();
    this.router.navigate(['/projects', project.id, 'settings']);
  }

  buildProject(event: Event, project: FlutterProject) {
    event.stopPropagation();
    this.router.navigate(['/projects', project.id, 'build']);
  }

  deleteProject(event: Event, project: FlutterProject) {
    event.stopPropagation();
    if (confirm(`Are you sure you want to delete "${project.name}"?`)) {
      this.projectService.deleteProject(project.id).subscribe({
        next: () => {
          this.loadProjects();
        },
        error: (error) => {
          console.error('Error deleting project:', error);
          alert('Failed to delete project. Please try again.');
        }
      });
    }
  }

  filterProjects() {
    // Ensure projects is an array before filtering
    if (!Array.isArray(this.projects)) {
      console.error('Cannot filter - projects is not an array:', this.projects);
      this.filteredProjects = [];
      return;
    }

    if (!this.searchTerm) {
      this.filteredProjects = [...this.projects];
    } else {
      const searchLower = this.searchTerm.toLowerCase();
      this.filteredProjects = this.projects.filter(project =>
        project.name.toLowerCase().includes(searchLower) ||
        project.package_name.toLowerCase().includes(searchLower) ||
        (project.description && project.description.toLowerCase().includes(searchLower))
      );
    }

    this.sortProjects();
  }

  sortProjects() {
    if (!Array.isArray(this.filteredProjects)) {
      return;
    }

    this.filteredProjects.sort((a, b) => {
      switch (this.sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'updated_at':
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        case 'created_at':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
  }

  clearSearch() {
    this.searchTerm = '';
    this.filterProjects();
  }

  getInitials(name: string): string {
    if (!name) return '?';

    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'Never';

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;

    return date.toLocaleDateString();
  }
}
