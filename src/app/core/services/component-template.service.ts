import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface ComponentTemplate {
  id: number;
  name: string;
  category: string;
  widget_type: string;
  widget_group: string;
  properties: any;
  is_container: boolean;
  max_children?: number;
  description?: string;
  flutter_widget?: string;
  icon?: string;
  display_order?: number;
  show_in_builder?: boolean;
}

export interface OrganizedComponentsResponse {
  groups: string[];
  total_components: number;
  components: Record<string, ComponentTemplate[]>;
}

@Injectable({
  providedIn: 'root'
})
export class ComponentTemplateService {
  constructor(private api: ApiService) {}

  getComponents(): Observable<ComponentTemplate[]> {
    return this.api.get<ComponentTemplate[]>('api/projects/component-templates/');
  }

  getComponentsByCategory(): Observable<any> {
    return this.api.get('api/projects/component-templates/by_category/');
  }

  getComponentsForBuilder(): Observable<ComponentTemplate[]> {
    return this.api.get<ComponentTemplate[]>('api/projects/component-templates/components/');
  }

  getOrganizedComponents(): Observable<OrganizedComponentsResponse> {
    return this.api.get<OrganizedComponentsResponse>('api/projects/component-templates/organized/');
  }

  getWidgetGroups(): Observable<{ widget_groups: string[]; count: number }> {
    return this.api.get<{ widget_groups: string[]; count: number }>('api/projects/component-templates/widget-groups/');
  }

  getCategories(): Observable<{ categories: string[]; count: number }> {
    return this.api.get<{ categories: string[]; count: number }>('api/projects/component-templates/categories/');
  }
}
