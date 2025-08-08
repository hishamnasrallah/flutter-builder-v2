// src/app/core/services/component-template.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { map } from 'rxjs/operators';

// Define the structure of the backend's ComponentTemplate
export interface BackendComponentTemplate {
  flutter_widget: string;
  name: string;
  category: string;
  icon: string;
  description?: string;
  default_properties: any;
  can_have_children: boolean;
  max_children?: number;
  is_active: boolean;
  widget_group?: string; // Add this field
  display_order?: number; // Add this field
  show_in_builder?: boolean; // Add this field
}

// Define the structure of the organized response
export interface OrganizedComponentsResponse {
  groups: string[];
  total_components: number;
  components: { [groupName: string]: BackendComponentTemplate[] };
}

@Injectable({
  providedIn: 'root'
})
export class ComponentTemplateService {
  constructor(private api: ApiService) {}

  // This method should now fetch the organized data
  getOrganizedComponents(): Observable<OrganizedComponentsResponse> {
    return this.api.get<OrganizedComponentsResponse>('api/projects/component-templates/organized/');
  }

  // Keep other methods if they are still used elsewhere
  getComponents(): Observable<BackendComponentTemplate[]> {
    return this.api.get<BackendComponentTemplate[]>('api/projects/component-templates/');
  }

  getComponentsByCategory(): Observable<any> {
    return this.api.get('api/projects/component-templates/by_category/');
  }

  getComponentsForBuilder(): Observable<BackendComponentTemplate[]> {
    return this.api.get<BackendComponentTemplate[]>('api/projects/component-templates/components/');
  }

  getWidgetGroups(): Observable<{ widget_groups: string[]; count: number }> {
    return this.api.get<{ widget_groups: string[]; count: number }>('api/projects/component-templates/widget-groups/');
  }

  getCategories(): Observable<{ categories: string[]; count: number }> {
    return this.api.get<{ categories: string[]; count: number }>('api/projects/component-templates/categories/');
  }
}
