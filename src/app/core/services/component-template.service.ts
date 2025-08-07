import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

interface ComponentTemplate {
  id: number;
  name: string;
  category: string;
  widget_type: string;
  widget_group: string;
  properties: any;
  is_container: boolean;
  max_children?: number;
  description?: string;
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

  getOrganizedComponents(): Observable<any> {
    return this.api.get('api/projects/component-templates/organized/');
  }

  getWidgetGroups(): Observable<string[]> {
    return this.api.get<string[]>('api/projects/component-templates/widget-groups/');
  }

  getCategories(): Observable<string[]> {
    return this.api.get<string[]>('api/projects/component-templates/categories/');
  }
}
