import { Routes } from '@angular/router';
import { authGuard } from './core/authentication/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'projects',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./core/authentication/login/login.component')
      .then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./core/authentication/register/register.component')
      .then(m => m.RegisterComponent)
  },
  {
    path: 'projects',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/project-management/project-list/project-list.component')
          .then(m => m.ProjectListComponent)
      },
      {
        path: 'create',
        loadComponent: () => import('./features/project-management/project-create/project-create.component')
          .then(m => m.ProjectCreateComponent)
      },
      {
        path: ':id/settings',
        loadComponent: () => import('./features/project-management/project-settings/project-settings.component')
          .then(m => m.ProjectSettingsComponent)
      },
      {
        path: ':id/build',
        loadComponent: () => import('./features/build-management/build-history/build-history.component')
          .then(m => m.BuildHistoryComponent)
      }
    ]
  },
  {
    path: 'builder',
    canActivate: [authGuard],
    loadComponent: () => import('./features/builder/builder.component')
      .then(m => m.BuilderComponent)
  }
];
