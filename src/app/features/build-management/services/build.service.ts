import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, interval, switchMap, takeWhile } from 'rxjs';
import { environment } from '../../../../environments/environment';

interface Build {
  id: number;
  project: number;
  project_name: string;
  status: 'pending' | 'building' | 'success' | 'failed' | 'cancelled';
  build_type: 'debug' | 'release' | 'profile';
  version_number: string;
  build_number: number;
  apk_url?: string;
  apk_size?: number;
  error_message?: string;
  created_at: string;
  completed_at?: string;
  duration_seconds?: number;
}

interface BuildLog {
  id: number;
  timestamp: string;
  level: 'info' | 'warning' | 'error';
  stage: string;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class BuildService {
  private apiUrl = `${environment.apiUrl}/api/builds`;

  constructor(private http: HttpClient) {}

  startBuild(projectId: number, buildType: string = 'release'): Observable<Build> {
    return this.http.post<Build>(`${this.apiUrl}/`, {
      project_id: projectId,
      build_type: buildType,
      version_number: '1.0.0',
      build_number: 1
    });
  }

  getBuild(buildId: number): Observable<Build> {
    return this.http.get<Build>(`${this.apiUrl}/${buildId}/`);
  }

  getBuildHistory(projectId?: number): Observable<Build[]> {
    let params = new HttpParams();
    if (projectId) {
      params = params.set('project', projectId.toString());
    }
    return this.http.get<Build[]>(`${this.apiUrl}/`, { params });
  }

  getBuildLogs(buildId: number): Observable<BuildLog[]> {
    return this.http.get<BuildLog[]>(`${this.apiUrl}/${buildId}/logs/`);
  }

  cancelBuild(buildId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${buildId}/cancel/`, {});
  }

  downloadApk(buildId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${buildId}/download/`, {
      responseType: 'blob'
    });
  }

  pollBuildStatus(buildId: number): Observable<Build> {
    return interval(2000).pipe(
      switchMap(() => this.getBuild(buildId)),
      takeWhile(build =>
        build.status === 'pending' || build.status === 'building',
        true
      )
    );
  }
}
