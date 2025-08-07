// src/app/core/authentication/initializers/auth.initializer.ts

import { APP_INITIALIZER, Provider } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { firstValueFrom } from 'rxjs';

export function initializeAuth(authService: AuthService): () => Promise<boolean> {
  return () => firstValueFrom(authService.waitForInitialization());
}

export const authInitializerProvider: Provider = {
  provide: APP_INITIALIZER,
  useFactory: initializeAuth,
  deps: [AuthService],
  multi: true
};
