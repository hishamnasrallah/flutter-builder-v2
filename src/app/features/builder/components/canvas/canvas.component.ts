// src/app/features/builder/components/canvas/canvas.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDropList, CdkDragDrop } from '@angular/cdk/drag-drop';
import { WidgetRendererComponent } from '../widget-renderer/widget-renderer.component';
import { WidgetRegistryService } from '../../../../core/services/widget-registry.service';
import { CanvasStateService, CanvasState, DragData } from '../../../../core/services/canvas-state.service';
import { WidgetTreeService } from '../../../../core/services/widget-tree.service';
import { FlutterWidget } from '../../../../core/models/flutter-widget.model';
import { Subject, takeUntil } from 'rxjs';
import { SelectionService } from '../../../../core/services/selection.service';

@Component({
  selector: 'app-canvas',
  standalone: true,
  imports: [CommonModule, WidgetRendererComponent, CdkDropList],
  template: `
    <div class="canvas-container">
      <div class="canvas-header">
        <div class="flex items-center gap-4">
          <h3 class="text-sm font-medium text-gray-700">Canvas</h3>
          @if (selectedWidget) {
            <span class="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
              Selected: {{ selectedWidget.type }}
              @if (selectedWidget.properties.text) {
                - "{{ truncateText(selectedWidget.properties.text) }}"
              }
            </span>
          }
        </div>
        <div class="flex items-center gap-2">
          <!-- Undo/Redo buttons -->
          <div class="flex items-center gap-1 mr-2">
            <button
              class="icon-btn"
              (click)="undo()"
              [disabled]="!canUndo"
              title="Undo (Ctrl+Z)">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6">
                </path>
              </svg>
            </button>
            <button
              class="icon-btn"
              (click)="redo()"
              [disabled]="!canRedo"
              title="Redo (Ctrl+Y)">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6">
                </path>
              </svg>
            </button>
          </div>

          <button
            class="icon-btn"
            (click)="deleteSelected()"
            [disabled]="!selectedWidget"
            title="Delete Selected Widget">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16">
              </path>
            </svg>
          </button>

          <button
            class="icon-btn"
            (click)="clearCanvas()"
            title="Clear Canvas">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 13h6m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z">
              </path>
            </svg>
          </button>

          <div class="device-info ml-2">
            <span class="text-xs text-gray-500">Device: iPhone 14 (390 × 844)</span>
          </div>
        </div>
      </div>

      <div class="canvas-viewport" [class.dragging]="isDragging">
        <div class="device-frame">
          <div
            class="device-screen"
            (click)="onCanvasClick($event)"
            (dragover)="onDragOver($event)"
            (drop)="onDrop($event)"
            (dragleave)="onDragLeave($event)"
            [class.drag-over]="isDragOver && !rootWidget">

            @if (rootWidget) {
              <app-widget-renderer
                [widget]="rootWidget"
                (widgetClick)="onWidgetClick($event)"
                [selectedId]="selectedWidgetId">
              </app-widget-renderer>
            } @else {
              <div class="empty-canvas" [class.highlight]="isDragging">
                @if (isDragging) {
                  <div class="drop-zone-indicator">
                    <svg class="w-20 h-20 text-blue-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12">
                      </path>
                    </svg>
                    <p class="mt-4 text-lg font-medium text-blue-600">Drop widget here</p>
                    <p class="text-sm text-blue-500 mt-1">Release to add to canvas</p>
                  </div>
                } @else {
                  <svg class="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z">
                    </path>
                  </svg>
                  <p class="mt-4 text-sm text-gray-500">Canvas is empty</p>
                  <p class="text-xs text-gray-400 mt-1">Drag widgets from the palette to start</p>
                  <p class="text-xs text-gray-400 mt-1">Drop widgets into containers to nest them</p>
                }
              </div>
            }
          </div>
        </div>
      </div>

      <div class="canvas-footer">
        <div class="flex items-center justify-between w-full">
          <div class="zoom-controls">
            <button class="zoom-btn" (click)="zoomOut()" [disabled]="zoomLevel <= 50">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path>
              </svg>
            </button>
            <span class="zoom-level">{{ zoomLevel }}%</span>
            <button class="zoom-btn" (click)="zoomIn()" [disabled]="zoomLevel >= 200">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
              </svg>
            </button>
            <button class="zoom-btn ml-2" (click)="resetZoom()">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </button>
          </div>
          <div class="widget-info">
            <span class="text-xs text-gray-500">
              Widgets: {{ widgetCount }}
              | Depth: {{ treeDepth }}
              | Phase 3: Nesting ✓
            </span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .canvas-container {
      @apply h-full flex flex-col bg-gray-50;
    }

    .canvas-header {
      @apply flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200;
    }

    .canvas-viewport {
      @apply flex-1 overflow-auto p-8 flex items-center justify-center;
      background-image:
        linear-gradient(45deg, #f0f0f0 25%, transparent 25%),
        linear-gradient(-45deg, #f0f0f0 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, #f0f0f0 75%),
        linear-gradient(-45deg, transparent 75%, #f0f0f0 75%);
      background-size: 20px 20px;
      background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
    }

    .canvas-viewport.dragging {
      @apply bg-blue-50;
    }

    .device-frame {
      @apply bg-gray-900 rounded-3xl p-3 shadow-2xl relative;
      width: 390px;
      height: 844px;
      transform: scale(var(--zoom-level, 1));
      transform-origin: center;
      transition: transform 0.3s ease;
    }

    .device-screen {
      @apply bg-white rounded-2xl w-full h-full overflow-auto relative;
    }

    .device-screen.drag-over {
      @apply ring-4 ring-blue-400 ring-opacity-50;
    }

    .empty-canvas {
      @apply h-full flex flex-col items-center justify-center transition-all;
    }

    .empty-canvas.highlight {
      @apply bg-blue-50;
    }

    .drop-zone-indicator {
      @apply text-center;
    }

    .canvas-footer {
      @apply px-4 py-2 bg-white border-t border-gray-200;
    }

    .zoom-controls {
      @apply flex items-center gap-2;
    }

    .zoom-btn {
      @apply p-1 rounded hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed;
    }

    .zoom-btn:not(:disabled):hover {
      @apply bg-gray-100;
    }

    .zoom-level {
      @apply text-sm text-gray-600 min-w-[50px] text-center;
    }

    .icon-btn {
      @apply p-1.5 rounded hover:bg-gray-100 transition-colors text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed;
    }

    .icon-btn:not(:disabled):hover {
      @apply bg-gray-100 text-gray-800;
    }

    .widget-info {
      @apply text-xs text-gray-500;
    }

    /* CDK Drop List styles */
    :global(.cdk-drag-placeholder) {
      @apply opacity-50;
    }

    :global(.cdk-drop-list-dragging .cdk-drag) {
      @apply transition-transform;
    }
  `]
})
export class CanvasComponent implements OnInit, OnDestroy {
  rootWidget: FlutterWidget | null = null;
  selectedWidget: FlutterWidget | null = null;
  selectedWidgetId: string | null = null;
  isDragging = false;
  zoomLevel = 100;
  widgetCount = 0;
  treeDepth = 0;
  canUndo = false;
  canRedo = false;

  private destroy$ = new Subject<void>();
  private keyboardListener: ((event: KeyboardEvent) => void) | null = null;

  constructor(
    private widgetRegistry: WidgetRegistryService,
    private canvasState: CanvasStateService,
    private treeService: WidgetTreeService,
      private selectionService: SelectionService
  ) {}
  // Add method for canvas background click
  onCanvasClick(event: MouseEvent) {
    // Clear selection if clicking on empty canvas
    const target = event.target as HTMLElement;
    if (target.classList.contains('device-screen')) {
      this.selectionService.clearSelection();
    }
  }
  getConnectedLists(): string[] {
    // Connect to all palette lists
    return ['palette-Layout', 'palette-Basic', 'palette-Material', 'palette-Form', 'palette-Navigation'];
  }
  ngOnInit() {
    // Subscribe to canvas state changes
    this.canvasState.state$
      .pipe(takeUntil(this.destroy$))
      .subscribe((state: CanvasState) => {
        this.rootWidget = state.rootWidget;
        this.selectedWidgetId = state.selectedWidgetId;
        this.isDragging = state.isDragging;
        this.updateStatistics();

        // Get selected widget details
        if (state.selectedWidgetId) {
          this.selectedWidget = this.canvasState.findWidget(state.selectedWidgetId);
        } else {
          this.selectedWidget = null;
        }

        // Update undo/redo state
        this.canUndo = this.canvasState.canUndo();
        this.canRedo = this.canvasState.canRedo();
      });

    // Setup keyboard shortcuts
    this.setupKeyboardShortcuts();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();

    // Remove keyboard listener to prevent memory leak
    if (this.keyboardListener) {
      document.removeEventListener('keydown', this.keyboardListener);
      this.keyboardListener = null;
    }
  }

  private setupKeyboardShortcuts() {
    this.keyboardListener = (event: KeyboardEvent) => {
      // Ignore if typing in an input field
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      // Ctrl/Cmd + Z for undo
      if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        this.undo();
      }
      // Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z for redo
      else if ((event.ctrlKey || event.metaKey) && (event.key === 'y' || (event.key === 'z' && event.shiftKey))) {
        event.preventDefault();
        this.redo();
      }
      // Delete key to delete selected widget
      else if (event.key === 'Delete' && this.selectedWidget) {
        event.preventDefault();
        this.deleteSelected();
      }
    };

    document.addEventListener('keydown', this.keyboardListener);
  }

  isDragOver = false;

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'copy';

    if (!this.rootWidget) {
      this.isDragOver = true;
    }
  }

  onDragLeave(event: DragEvent) {
    // Check if we're actually leaving the drop zone
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const x = event.clientX;
    const y = event.clientY;

    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      this.isDragOver = false;
    }
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();

    this.isDragOver = false;

    try {
      const dataText = event.dataTransfer!.getData('application/json');
      if (!dataText) return;

      const dragData = JSON.parse(dataText) as DragData;

      if (!this.rootWidget && dragData.type === 'new-widget' && dragData.widgetType) {
        // Add as root widget
        this.canvasState.addWidget(dragData.widgetType, null);
      }
    } catch (error) {
      console.error('Error handling drop:', error);
    }
  }

  onWidgetClick(widgetId: string) {
    this.canvasState.selectWidget(widgetId);
  }

  deleteSelected() {
    if (this.selectedWidget) {
      if (this.selectedWidget.id === this.rootWidget?.id) {
        if (confirm('This will clear the entire canvas. Are you sure?')) {
          this.canvasState.clearCanvas();
        }
      } else {
        this.canvasState.removeWidget(this.selectedWidget.id);
      }
    }
  }

  clearCanvas() {
    if (confirm('Are you sure you want to clear the canvas?')) {
      this.canvasState.clearCanvas();
    }
  }

  undo() {
    this.canvasState.undo();
  }

  redo() {
    this.canvasState.redo();
  }

  zoomIn() {
    if (this.zoomLevel < 200) {
      this.zoomLevel += 10;
      this.updateZoom();
    }
  }

  zoomOut() {
    if (this.zoomLevel > 50) {
      this.zoomLevel -= 10;
      this.updateZoom();
    }
  }

  resetZoom() {
    this.zoomLevel = 100;
    this.updateZoom();
  }

  private updateZoom() {
    const deviceFrame = document.querySelector('.device-frame') as HTMLElement;
    if (deviceFrame) {
      deviceFrame.style.setProperty('--zoom-level', (this.zoomLevel / 100).toString());
    }
  }

  private updateStatistics() {
    if (!this.rootWidget) {
      this.widgetCount = 0;
      this.treeDepth = 0;
      return;
    }

    this.widgetCount = this.treeService.countWidgets(this.rootWidget);
    const stats = this.treeService.getTreeStatistics(this.rootWidget);
    this.treeDepth = stats.maxDepth;
  }

  truncateText(text: string, maxLength: number = 20): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }
}
