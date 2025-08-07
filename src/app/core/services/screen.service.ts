import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

interface Screen {
  id: number;
  project: number;
  name: string;
  route: string;
  is_home: boolean;
  ui_structure: any;
  created_at: string;
  updated_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class ScreenService {
  constructor(private api: ApiService) {}

  getScreens(projectId: number): Observable<Screen[]> {
    return this.api.get<Screen[]>('api/projects/screens/', { project: projectId });
  }

  getScreen(screenId: number): Observable<Screen> {
    return this.api.get<Screen>(`api/projects/screens/${screenId}/`);
  }

  createScreen(screen: Partial<Screen>): Observable<Screen> {
    return this.api.post<Screen>('api/projects/screens/', screen);
  }

  updateScreen(screenId: number, screen: Partial<Screen>): Observable<Screen> {
    return this.api.put<Screen>(`api/projects/screens/${screenId}/`, screen);
  }

  updateUiStructure(screenId: number, uiStructure: any): Observable<Screen> {
    return this.api.put<Screen>(`api/projects/screens/${screenId}/update_ui_structure/`, {
      ui_structure: uiStructure
    });
  }

  deleteScreen(screenId: number): Observable<void> {
    return this.api.delete<void>(`api/projects/screens/${screenId}/`);
  }

  setAsHome(screenId: number): Observable<any> {
    return this.api.post(`api/projects/screens/${screenId}/set_as_home/`, {});
  }

  duplicateScreen(screenId: number): Observable<Screen> {
    return this.api.post<Screen>(`api/projects/screens/${screenId}/duplicate/`, {});
  }

  addWidget(screenId: number, widgetData: any): Observable<any> {
    return this.api.post(`api/projects/screens/${screenId}/widgets/add/`, widgetData);
  }

  removeWidget(screenId: number, widgetId: string): Observable<any> {
    return this.api.delete(`api/projects/screens/${screenId}/widgets/${widgetId}/`);
  }

  moveWidget(screenId: number, moveData: any): Observable<any> {
    return this.api.post(`api/projects/screens/${screenId}/widgets/move/`, moveData);
  }

  updateWidgetProperties(screenId: number, updateData: any): Observable<any> {
    return this.api.post(`api/projects/screens/${screenId}/widgets/update-properties/`, updateData);
  }
}
