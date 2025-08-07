// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { BuilderComponent } from './features/builder/builder.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'builder',
    pathMatch: 'full'
  },
  {
    path: 'builder',
    component: BuilderComponent
  }
];

