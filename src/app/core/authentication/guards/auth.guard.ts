// src/app/core/authentication/guards/auth.guard.ts

import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take } from 'rxjs/operators';
import { Observable } from 'rxjs';

export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): Observable<boolean> | boolean => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Wait for auth service to initialize
  return authService.waitForInitialization().pipe(
    take(1),
    map(initialized => {
      if (!initialized) {
        // Still initializing, wait
        return false;
      }

      // Check if user is authenticated
      if (authService.isAuthenticated()) {
        return true;
      }

      // Not authenticated, redirect to login
      router.navigate(['/login'], {
        queryParams: { returnUrl: state.url }
      });
      return false;
    })
  );
};
