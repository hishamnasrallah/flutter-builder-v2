// src/app/core/services/notification.service.ts

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  showSuccess(message: string, duration: number = 3000): void {
    this.show('success', message, duration);
  }

  showError(message: string, duration: number = 5000): void {
    this.show('error', message, duration);
  }

  showWarning(message: string, duration: number = 4000): void {
    this.show('warning', message, duration);
  }

  showInfo(message: string, duration: number = 3000): void {
    this.show('info', message, duration);
  }

  private show(type: Notification['type'], message: string, duration: number): void {
    const notification: Notification = {
      id: Date.now().toString(),
      type,
      message,
      duration
    };

    const current = this.notificationsSubject.value;
    this.notificationsSubject.next([...current, notification]);

    if (duration > 0) {
      setTimeout(() => this.remove(notification.id), duration);
    }
  }

  remove(id: string): void {
    const current = this.notificationsSubject.value;
    this.notificationsSubject.next(current.filter(n => n.id !== id));
  }

  clear(): void {
    this.notificationsSubject.next([]);
  }
}
