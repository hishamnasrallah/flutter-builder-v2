import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

export interface FlutterProject {
  id: number;
  name: string;
  description: string;
  package_name: string;
  primary_color: string;
  secondary_color: string;
  app_icon?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  supported_language_ids: number[];
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  constructor(private api: ApiService) {}

  getProjects(): Observable<FlutterProject[]> {
    return this.api.get<any>('api/projects/flutter-projects/').pipe(
      map(response => {
        // Handle different response formats
        if (Array.isArray(response)) {
          return response;
        } else if (response.results && Array.isArray(response.results)) {
          // Paginated response
          return response.results;
        } else if (response.data && Array.isArray(response.data)) {
          // Data wrapped response
          return response.data;
        } else {
          console.error('Unexpected response format:', response);
          return [];
        }
      })
    );
  }

  getProject(id: number): Observable<FlutterProject> {
    return this.api.get<FlutterProject>(`api/projects/flutter-projects/${id}/`);
  }

  createProject(project: Partial<FlutterProject>): Observable<FlutterProject> {
    return this.api.post<FlutterProject>('api/projects/flutter-projects/', project);
  }

  updateProject(id: number, project: Partial<FlutterProject>): Observable<FlutterProject> {
    return this.api.put<FlutterProject>(`api/projects/flutter-projects/${id}/`, project);
  }

  deleteProject(id: number): Observable<void> {
    return this.api.delete<void>(`api/projects/flutter-projects/${id}/`);
  }

  setActiveProject(id: number): Observable<any> {
    return this.api.post(`api/projects/flutter-projects/${id}/set_active/`, {});
  }
}
