// src/app/core/authentication/services/auth.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, of, catchError, map } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';

interface LoginResponse {
  access: string;
  refresh: string;
  user: {
    id: number;
    username: string;
    email: string;
  };
}

interface User {
  id: number;
  username: string;
  email: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  // Add a ready state to track initialization
  private isInitializedSubject = new BehaviorSubject<boolean>(false);
  public isInitialized$ = this.isInitializedSubject.asObservable();

  private tokenKey = 'flutter_builder_token';
  private refreshKey = 'flutter_builder_refresh';
  private userKey = 'flutter_builder_user';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.initializeAuth();
  }

  private initializeAuth(): void {
    // Load stored user and token on service initialization
    const token = this.getToken();
    const userStr = localStorage.getItem(this.userKey);

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        this.currentUserSubject.next(user);

        // Verify token is still valid by checking if it's not expired
        if (!this.isTokenExpired(token)) {
          // Token appears valid, keep the user logged in
          this.isInitializedSubject.next(true);
        } else {
          // Token expired, try to refresh
          this.refreshToken().subscribe({
            next: () => {
              this.isInitializedSubject.next(true);
            },
            error: () => {
              this.clearStorage();
              this.isInitializedSubject.next(true);
            }
          });
        }
      } catch (e) {
        console.error('Error loading stored user:', e);
        this.clearStorage();
        this.isInitializedSubject.next(true);
      }
    } else {
      // No stored authentication
      this.isInitializedSubject.next(true);
    }
  }

  private isTokenExpired(token: string): boolean {
    try {
      // Parse JWT token
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiry = payload.exp;

      if (!expiry) {
        return false; // No expiry, assume valid
      }

      // Check if token is expired (with 5 minute buffer)
      const now = Date.now() / 1000;
      return now > (expiry - 300); // 5 minutes before actual expiry
    } catch (e) {
      console.error('Error checking token expiry:', e);
      return true; // Assume expired if can't parse
    }
  }

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login/`, {
      username,
      password
    }).pipe(
      tap(response => {
        // Store authentication data
        this.storeAuthData(response);
      })
    );
  }

  private storeAuthData(response: LoginResponse): void {
    localStorage.setItem(this.tokenKey, response.access);
    localStorage.setItem(this.refreshKey, response.refresh);
    localStorage.setItem(this.userKey, JSON.stringify(response.user));
    this.currentUserSubject.next(response.user);
  }

  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register/`, userData);
  }

  logout(): void {
    // Optional: Call backend logout endpoint if exists
    const refresh = this.getRefreshToken();
    if (refresh) {
      // Fire and forget - don't wait for response
      this.http.post(`${this.apiUrl}/logout/`, { refresh }).subscribe({
        error: (err) => console.log('Logout backend call failed:', err)
      });
    }

    this.clearStorage();
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  private clearStorage(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshKey);
    localStorage.removeItem(this.userKey);
    // Also clear session storage if used
    sessionStorage.clear();
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshKey);
  }

  refreshToken(): Observable<any> {
    const refresh = this.getRefreshToken();

    if (!refresh) {
      return of(null);
    }

    return this.http.post(`${this.apiUrl}/token/refresh/`, { refresh }).pipe(
      tap((response: any) => {
        localStorage.setItem(this.tokenKey, response.access);

        // If the response includes a new refresh token, update it
        if (response.refresh) {
          localStorage.setItem(this.refreshKey, response.refresh);
        }
      })
    );
  }

  isAuthenticated(): boolean {
    const token = this.getToken();

    if (!token) {
      return false;
    }

    // Check if token is expired
    if (this.isTokenExpired(token)) {
      // Token expired, clear storage
      this.clearStorage();
      return false;
    }

    return true;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  // Method to wait for initialization
  waitForInitialization(): Observable<boolean> {
    return this.isInitialized$;
  }

  // Method to manually verify authentication status
verifyAuth(): Observable<boolean> {
  const token = this.getToken();

  if (!token) {
    return of(false);
  }

  // Make a simple authenticated request to verify token
  return this.http.get(`${this.apiUrl}/verify/`).pipe(
    map(() => {
      // Token is valid, return true
      return true;
    }),
    catchError(() => {
      // Token is invalid or request failed
      return of(false);
    })
  );
}
}
