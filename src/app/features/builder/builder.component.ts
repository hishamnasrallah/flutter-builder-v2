// src/app/features/builder/builder.component.ts

import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { CanvasComponent } from './components/canvas/canvas.component';
import { WidgetPaletteComponent } from './components/widget-palette/widget-palette.component';
import { WidgetTreeComponent } from './components/widget-tree/widget-tree.component';
import { PropertiesPanelComponent } from './components/properties-panel/properties-panel.component';
import { ScreenTabsComponent } from './components/screen-tabs/screen-tabs.component';
import { ScreenManagerComponent } from './components/screen-manager/screen-manager.component';
import { ActivatedRoute, Router } from '@angular/router';
import { CanvasStateService } from '../../core/services/canvas-state.service';
import { NotificationService } from '../../core/services/notification.service';
import { ScreenService } from '../../core/services/screen.service';

@Component({
  selector: 'app-builder',
  standalone: true,
  imports: [
    CommonModule,
    CanvasComponent,
    WidgetPaletteComponent,
    WidgetTreeComponent,
    PropertiesPanelComponent,
    ScreenTabsComponent,
    ScreenManagerComponent,
    DragDropModule
  ],
  template: `
    <div class="builder-container">
      <!-- Header -->
      <header class="builder-header">
        <div class="flex items-center gap-4">
          <button
            class="back-btn"
            (click)="goBack()">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
            </svg>
          </button>
          <h1 class="text-xl font-semibold text-gray-800">Flutter UI Builder</h1>
          <span class="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">Phase 6: Screen Management</span>
        </div>
        <div class="flex items-center gap-2">
          <button
            class="btn-secondary"
            (click)="saveProject()">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V2"></path>
            </svg>
            Save All
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

      <!-- Screen Tabs -->
      <app-screen-tabs
        [projectId]="projectId!"
        (openScreenManager)="showScreenManager = true">
      </app-screen-tabs>

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
          <span class="text-xs text-gray-500">
            @if (projectId) {
              Project ID: {{ projectId }}
            }
          </span>
          <span class="text-xs text-gray-400">|</span>
          <span class="text-xs text-gray-500">
            @if (canvasState.getHasUnsavedChanges()) {
              <span class="text-yellow-600">● Unsaved changes</span>
            } @else {
              <span class="text-green-600">✓ All changes saved</span>
            }
          </span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs text-green-600">✓ Phase 6: Screen Management</span>
        </div>
      </footer>

      <!-- Screen Manager Modal -->
      @if (showScreenManager) {
        <div class="modal-overlay" (click)="showScreenManager = false">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <app-screen-manager
              [projectId]="projectId!"
              (screenSelected)="onScreenSelected($event)"
              (closeManager)="showScreenManager = false">
            </app-screen-manager>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .builder-container {
      @apply h-screen flex flex-col bg-gray-100;
    }

    .builder-header {
      @apply flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shadow-sm;
    }

    .back-btn {
      @apply p-1.5 hover:bg-gray-100 rounded transition-colors;
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

    .modal-overlay {
      @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50;
    }

    .modal-content {
      @apply relative;
    }
  `]
})
export class BuilderComponent implements OnInit {
  leftTab: 'palette' | 'tree' = 'palette';
  projectId: number | null = null;
  showScreenManager = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public canvasState: CanvasStateService,
    private notification: NotificationService,
    private screenService: ScreenService
  ) {}

  ngOnInit() {
    // Get project ID from query params
    this.route.queryParams.subscribe(params => {
      if (params['projectId']) {
        this.projectId = Number(params['projectId']);
        this.canvasState.setCurrentProject(this.projectId);
        this.initializeProject();
      }
    });

    // Auto-save on changes
    this.setupAutoSave();
  }

  initializeProject() {
    if (!this.projectId) return;

    // Check if project has screens
    this.screenService.getScreens(this.projectId).subscribe({
      next: (screens) => {
        if (screens.length === 0) {
          // Create initial home screen
          this.createInitialScreen();
        }
      },
      error: (error: any) => {
        console.error('Error loading screens:', error);
        this.notification.showError('Failed to load project screens');
      }
    });
  }

  createInitialScreen() {
    const screen = {
      project: this.projectId!,
      name: 'Home Screen',
      route: '/home',
      is_home: true,
      ui_structure: {
        type: 'Scaffold',
        id: 'scaffold-root',
        properties: {
          backgroundColor: '#FFFFFF'
        },
        children: []
      }
    };

    this.screenService.createScreen(screen).subscribe({
      next: (created) => {
        this.notification.showSuccess('Created initial home screen');
        this.canvasState.loadScreen(created.id);
      },
      error: (error: any) => {
        console.error('Error creating initial screen:', error);
      }
    });
  }

  setupAutoSave() {
    // Auto-save every 30 seconds if there are changes
    setInterval(() => {
      if (this.canvasState.getHasUnsavedChanges()) {
        this.saveProject();
      }
    }, 30000);
  }

  saveProject() {
    this.canvasState.saveToBackend().subscribe({
      next: () => {
        this.notification.showSuccess('Project saved');
      },
      error: (error: any) => {
        this.notification.showError('Failed to save project');
      }
    });
  }

  onScreenSelected(screen: any) {
    this.showScreenManager = false;
    this.canvasState.loadScreen(screen.id);
  }

  goBack() {
    if (this.canvasState.getHasUnsavedChanges()) {
      if (confirm('You have unsaved changes. Do you want to save before leaving?')) {
        this.saveProject();
      }
    }
    this.router.navigate(['/projects']);
  }
}
