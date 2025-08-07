// src/app/features/builder/builder.component.ts

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CanvasComponent } from './components/canvas/canvas.component';

@Component({
  selector: 'app-builder',
  standalone: true,
  imports: [CommonModule, CanvasComponent],
  template: `
    <div class="builder-container">
      <!-- Header -->
      <header class="builder-header">
        <div class="flex items-center gap-4">
          <h1 class="text-xl font-semibold text-gray-800">Flutter UI Builder</h1>
          <span class="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">Phase 1</span>
        </div>
        <div class="flex items-center gap-2">
          <button class="btn-secondary">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
            New
          </button>
          <button class="btn-secondary">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V2"></path>
            </svg>
            Save
          </button>
          <button class="btn-primary">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
            </svg>
            Export Code
          </button>
        </div>
      </header>

      <!-- Main Content Area -->
      <div class="builder-content">
        <!-- Left Sidebar - Widget Palette (Placeholder for Phase 2) -->
        <aside class="builder-sidebar-left">
          <div class="sidebar-header">
            <h3 class="text-sm font-medium text-gray-700">Widgets</h3>
          </div>
          <div class="sidebar-content">
            <div class="text-center py-8 text-gray-400">
              <svg class="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
              </svg>
              <p class="text-sm">Widget Palette</p>
              <p class="text-xs mt-1">Coming in Phase 2</p>
            </div>
          </div>
        </aside>

        <!-- Center - Canvas -->
        <main class="builder-main">
          <app-canvas></app-canvas>
        </main>

        <!-- Right Sidebar - Properties (Placeholder for Phase 4) -->
        <aside class="builder-sidebar-right">
          <div class="sidebar-header">
            <h3 class="text-sm font-medium text-gray-700">Properties</h3>
          </div>
          <div class="sidebar-content">
            <div class="text-center py-8 text-gray-400">
              <svg class="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path>
              </svg>
              <p class="text-sm">Properties Panel</p>
              <p class="text-xs mt-1">Coming in Phase 4</p>
            </div>
          </div>
        </aside>
      </div>

      <!-- Status Bar -->
      <footer class="builder-footer">
        <div class="flex items-center gap-4">
          <span class="text-xs text-gray-500">Ready</span>
          <span class="text-xs text-gray-400">|</span>
          <span class="text-xs text-gray-500">Widgets: 8</span>
          <span class="text-xs text-gray-400">|</span>
          <span class="text-xs text-gray-500">Flutter SDK: 3.16.0</span>
        </div>
        <div class="text-xs text-gray-500">
          Phase 1: Static Widget Display ✓
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .builder-container {
      @apply h-screen flex flex-col bg-gray-100;
    }

    .builder-header {
      @apply flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200;
    }

    .builder-content {
      @apply flex-1 flex overflow-hidden;
    }

    .builder-sidebar-left {
      @apply w-64 bg-white border-r border-gray-200 flex flex-col;
    }

    .builder-sidebar-right {
      @apply w-80 bg-white border-l border-gray-200 flex flex-col;
    }

    .sidebar-header {
      @apply px-4 py-3 border-b border-gray-200;
    }

    .sidebar-content {
      @apply flex-1 overflow-y-auto p-4;
    }

    .builder-main {
      @apply flex-1 overflow-hidden;
    }

    .builder-footer {
      @apply flex items-center justify-between px-4 py-2 bg-white border-t border-gray-200;
    }

    .btn-primary {
      @apply px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors flex items-center gap-1.5;
    }

    .btn-secondary {
      @apply px-3 py-1.5 bg-white text-gray-700 text-sm rounded border border-gray-300 hover:bg-gray-50 transition-colors flex items-center gap-1.5;
    }
  `]
})
export class BuilderComponent {}
