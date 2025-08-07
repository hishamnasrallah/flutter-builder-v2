// src/app/features/builder/builder.component.ts

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { CanvasComponent } from './components/canvas/canvas.component';
import { WidgetPaletteComponent } from './components/widget-palette/widget-palette.component';
import { WidgetTreeComponent } from './components/widget-tree/widget-tree.component';
import { PropertiesPanelComponent } from './components/properties-panel/properties-panel.component';

@Component({
  selector: 'app-builder',
  standalone: true,
  imports: [
    CommonModule,
    CanvasComponent,
    WidgetPaletteComponent,
    WidgetTreeComponent,
    PropertiesPanelComponent,
    DragDropModule
  ],
  template: `
    <div class="builder-container">
      <!-- Header -->
      <header class="builder-header">
        <div class="flex items-center gap-4">
          <h1 class="text-xl font-semibold text-gray-800">Flutter UI Builder</h1>
          <span class="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">Phase 4: Properties Panel</span>
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
        <!-- Left Sidebar - Widget Palette -->
        <aside class="builder-sidebar-left">
          <div class="sidebar-tabs">
            <button
              class="tab-button"
              [class.active]="leftTab === 'palette'"
              (click)="leftTab = 'palette'">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z">
                </path>
              </svg>
              Widgets
            </button>
            <button
              class="tab-button"
              [class.active]="leftTab === 'tree'"
              (click)="leftTab = 'tree'">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z">
                </path>
              </svg>
              Tree
            </button>
          </div>
          <div class="sidebar-panel">
            @if (leftTab === 'palette') {
              <app-widget-palette></app-widget-palette>
            } @else if (leftTab === 'tree') {
              <app-widget-tree></app-widget-tree>
            }
          </div>
        </aside>

        <!-- Center - Canvas -->
        <main class="builder-main">
          <app-canvas></app-canvas>
        </main>

        <!-- Right Sidebar - Properties -->
        <aside class="builder-sidebar-right">
          <app-properties-panel></app-properties-panel>
        </aside>
      </div>

      <!-- Status Bar -->
      <footer class="builder-footer">
        <div class="flex items-center gap-4">
          <span class="text-xs text-gray-500">Ready</span>
          <span class="text-xs text-gray-400">|</span>
          <span class="text-xs text-gray-500">Drag widgets into containers to nest them</span>
          <span class="text-xs text-gray-400">|</span>
          <span class="text-xs text-gray-500">Flutter SDK: 3.16.0</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs text-green-600">✓ Phase 1: Static Display</span>
          <span class="text-xs text-green-600">✓ Phase 2: Drag & Drop</span>
          <span class="text-xs text-green-600">✓ Phase 3: Nesting & Tree</span>
          <span class="text-xs text-green-600">✓ Phase 4: Properties Panel</span>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .builder-container {
      @apply h-screen flex flex-col bg-gray-100;
    }

    .builder-header {
      @apply flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shadow-sm;
    }

    .builder-content {
      @apply flex-1 flex overflow-hidden;
    }

    .builder-sidebar-left {
      @apply w-80 bg-white border-r border-gray-200 flex flex-col shadow-sm;
    }

    .builder-sidebar-right {
      @apply w-80 bg-white border-l border-gray-200 flex flex-col shadow-sm;
    }

    .sidebar-tabs {
      @apply flex border-b border-gray-200;
    }

    .tab-button {
      @apply flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 transition-colors border-b-2 border-transparent;
    }

    .tab-button.active {
      @apply text-blue-600 border-blue-600 bg-blue-50;
    }

    .sidebar-panel {
      @apply flex-1 overflow-hidden flex flex-col;
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
      @apply flex items-center justify-between px-4 py-2 bg-white border-t border-gray-200 shadow-sm;
    }

    .btn-primary {
      @apply px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors flex items-center gap-1.5 font-medium;
    }

    .btn-secondary {
      @apply px-3 py-1.5 bg-white text-gray-700 text-sm rounded border border-gray-300 hover:bg-gray-50 transition-colors flex items-center gap-1.5;
    }
  `]
})
export class BuilderComponent {
  leftTab: 'palette' | 'tree' = 'palette';
}
