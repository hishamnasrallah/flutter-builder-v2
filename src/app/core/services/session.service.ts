// src/app/core/services/session.service.ts

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private readonly SESSION_KEY = 'flutter_builder_session';
  private readonly ACTIVITY_KEY = 'flutter_builder_last_activity';
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  private sessionActiveSubject = new BehaviorSubject<boolean>(false);
  public sessionActive$ = this.sessionActiveSubject.asObservable();

  private activityTimer: any;

  constructor() {
    this.initializeSession();
    this.setupActivityListeners();
    this.setupStorageListener();
  }

  private initializeSession(): void {
    const lastActivity = this.getLastActivity();
    const now = Date.now();

    if (lastActivity && (now - lastActivity) < this.SESSION_TIMEOUT) {
      // Session is still valid
      this.sessionActiveSubject.next(true);
      this.updateActivity();
      this.startActivityTimer();
    } else {
      // Session expired or doesn't exist
      this.clearSession();
    }
  }

  private setupActivityListeners(): void {
    // Listen for user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];

    events.forEach(event => {
      document.addEventListener(event, () => this.updateActivity(), { passive: true });
    });

    // Also update on visibility change
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.updateActivity();
      }
    });
  }

  private setupStorageListener(): void {
    // Listen for storage changes from other tabs
    window.addEventListener('storage', (event) => {
      if (event.key === this.SESSION_KEY) {
        if (event.newValue === null) {
          // Session was cleared in another tab
          this.sessionActiveSubject.next(false);
          this.stopActivityTimer();
        } else {
          // Session was updated in another tab
          this.sessionActiveSubject.next(true);
          this.startActivityTimer();
        }
      }
    });
  }

  private updateActivity(): void {
    const now = Date.now();
    localStorage.setItem(this.ACTIVITY_KEY, now.toString());

    if (!this.sessionActiveSubject.value) {
      this.sessionActiveSubject.next(true);
    }

    this.resetActivityTimer();
  }

  private startActivityTimer(): void {
    this.stopActivityTimer();

    this.activityTimer = setInterval(() => {
      const lastActivity = this.getLastActivity();
      const now = Date.now();

      if (!lastActivity || (now - lastActivity) >= this.SESSION_TIMEOUT) {
        // Session timeout
        this.clearSession();
        this.sessionActiveSubject.next(false);
        this.stopActivityTimer();

        // Redirect to login
        window.location.href = '/login';
      }
    }, 60000); // Check every minute
  }

  private stopActivityTimer(): void {
    if (this.activityTimer) {
      clearInterval(this.activityTimer);
      this.activityTimer = null;
    }
  }

  private resetActivityTimer(): void {
    this.startActivityTimer();
  }

  private getLastActivity(): number | null {
    const activity = localStorage.getItem(this.ACTIVITY_KEY);
    return activity ? parseInt(activity, 10) : null;
  }

  public startSession(userId: number): void {
    const sessionData = {
      userId,
      startTime: Date.now()
    };

    localStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData));
    this.updateActivity();
    this.sessionActiveSubject.next(true);
    this.startActivityTimer();
  }

  public clearSession(): void {
    localStorage.removeItem(this.SESSION_KEY);
    localStorage.removeItem(this.ACTIVITY_KEY);
    this.stopActivityTimer();
    this.sessionActiveSubject.next(false);
  }

  public getSession(): any {
    const session = localStorage.getItem(this.SESSION_KEY);
    return session ? JSON.parse(session) : null;
  }

  public isSessionActive(): boolean {
    const lastActivity = this.getLastActivity();
    const now = Date.now();

    return lastActivity !== null && (now - lastActivity) < this.SESSION_TIMEOUT;
  }

  public extendSession(): void {
    this.updateActivity();
  }
}
