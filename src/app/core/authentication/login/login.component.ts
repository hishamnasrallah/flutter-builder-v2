import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <h1 class="login-title">Flutter Builder</h1>
        <h2 class="login-subtitle">Sign in to your account</h2>

        <form (ngSubmit)="onSubmit()" #loginForm="ngForm">
          <div class="form-group">
            <label for="username">Username</label>
            <input
              type="text"
              id="username"
              [(ngModel)]="credentials.username"
              name="username"
              required
              class="form-input"
              placeholder="Enter your username">
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input
              type="password"
              id="password"
              [(ngModel)]="credentials.password"
              name="password"
              required
              class="form-input"
              placeholder="Enter your password">
          </div>

          @if (error) {
            <div class="error-message">
              {{ error }}
            </div>
          }

          <button
            type="submit"
            [disabled]="!loginForm.form.valid || loading"
            class="btn-primary">
            {{ loading ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>

        <div class="login-footer">
          <p>Don't have an account?
            <a routerLink="/register" class="link">Register</a>
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      @apply min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8;
    }

    .login-card {
      @apply max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-lg;
    }

    .login-title {
      @apply text-3xl font-bold text-center text-gray-900;
    }

    .login-subtitle {
      @apply text-center text-gray-600 mt-2;
    }

    .form-group {
      @apply mb-4;
    }

    .form-group label {
      @apply block text-sm font-medium text-gray-700 mb-2;
    }

    .form-input {
      @apply w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500;
    }

    .btn-primary {
      @apply w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed;
    }

    .error-message {
      @apply text-red-600 text-sm mb-4;
    }

    .login-footer {
      @apply text-center text-sm text-gray-600 mt-4;
    }

    .link {
      @apply font-medium text-blue-600 hover:text-blue-500;
    }
  `]
})
export class LoginComponent {
  credentials = {
    username: '',
    password: ''
  };
  loading = false;
  error = '';
  returnUrl = '/projects';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/projects';
  }

  onSubmit() {
    this.loading = true;
    this.error = '';

    this.authService.login(this.credentials.username, this.credentials.password).subscribe({
      next: () => {
        this.router.navigate([this.returnUrl]);
      },
      error: (error) => {
        this.error = error.error?.detail || 'Invalid username or password';
        this.loading = false;
      }
    });
  }
}
