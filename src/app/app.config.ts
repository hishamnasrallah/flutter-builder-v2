// src/app/app.config.ts

import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './core/authentication/interceptors/auth.interceptor';
import { authInitializerProvider } from './core/authentication/initializers/auth.initializer';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withHashLocation()), // Using hash location for better SPA support
    provideHttpClient(
      withInterceptors([authInterceptor])
    ),
    authInitializerProvider // Add the auth initializer
  ]
};
