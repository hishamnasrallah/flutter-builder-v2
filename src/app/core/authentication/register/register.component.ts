import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="register-container">
      <div class="register-card">
        <h1 class="register-title">Create Account</h1>
        <h2 class="register-subtitle">Join Flutter Builder</h2>

        <form (ngSubmit)="onSubmit()" #registerForm="ngForm">
          <div class="form-group">
            <label for="username">Username</label>
            <input
              type="text"
              id="username"
              [(ngModel)]="userData.username"
              name="username"
              required
              class="form-input"
              placeholder="Choose a username">
          </div>

          <div class="form-group">
            <label for="email">Email</label>
            <input
              type="email"
              id="email"
              [(ngModel)]="userData.email"
              name="email"
              required
              class="form-input"
              placeholder="Enter your email">
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input
              type="password"
              id="password"
              [(ngModel)]="userData.password"
              name="password"
              required
              minlength="8"
              class="form-input"
              placeholder="Create a password">
          </div>

          <div class="form-group">
            <label for="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              [(ngModel)]="userData.confirmPassword"
              name="confirmPassword"
              required
              class="form-input"
              placeholder="Confirm your password">
          </div>

          @if (error) {
            <div class="error-message">
              {{ error }}
            </div>
          }

          <button
            type="submit"
            [disabled]="!registerForm.form.valid || loading"
            class="btn-primary">
            {{ loading ? 'Creating Account...' : 'Create Account' }}
          </button>
        </form>

        <div class="register-footer">
          <p>Already have an account?
            <a routerLink="/login" class="link">Sign In</a>
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .register-container {
      @apply min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8;
    }

    .register-card {
      @apply max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-lg;
    }

    .register-title {
      @apply text-3xl font-bold text-center text-gray-900;
    }

    .register-subtitle {
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

    .register-footer {
      @apply text-center text-sm text-gray-600 mt-4;
    }

    .link {
      @apply font-medium text-blue-600 hover:text-blue-500;
    }
  `]
})
export class RegisterComponent {
  userData = {
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  };
  loading = false;
  error = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit() {
    if (this.userData.password !== this.userData.confirmPassword) {
      this.error = 'Passwords do not match';
      return;
    }

    this.loading = true;
    this.error = '';

    this.authService.register(this.userData).subscribe({
      next: () => {
        // Auto-login after registration
        this.authService.login(this.userData.username, this.userData.password).subscribe({
          next: () => {
            this.router.navigate(['/projects']);
          }
        });
      },
      error: (error) => {
        this.error = error.error?.detail || 'Registration failed';
        this.loading = false;
      }
    });
  }
}
