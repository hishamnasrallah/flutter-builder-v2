// src/app/features/builder/components/selection-overlay/selection-overlay.component.ts

import { Component, OnInit, OnDestroy, ElementRef, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { SelectionService, SelectionState, SelectionRect } from '../../../../core/services/selection.service';
import { CanvasStateService } from '../../../../core/services/canvas-state.service';
import { FlutterWidget } from '../../../../core/models/flutter-widget.model';

interface ResizeHandle {
  position: 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';
  cursor: string;
  x: number;
  y: number;
}

@Component({
  selector: 'app-selection-overlay',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="selection-overlay" #overlay>
      <!-- Selection Rectangle (for drag selection) -->
      @if (isSelecting && selectionRect) {
        <div
          class="selection-rectangle"
          [style.left.px]="getSelectionRectLeft()"
          [style.top.px]="getSelectionRectTop()"
          [style.width.px]="getSelectionRectWidth()"
          [style.height.px]="getSelectionRectHeight()">
        </div>
      }

      <!-- Selection Outlines for each selected widget -->
      @for (widgetId of selectedWidgetIds; track widgetId) {
        <div
          class="selection-outline"
          [attr.data-selection-for]="widgetId"
          [style.left.px]="getWidgetBounds(widgetId)?.left"
          [style.top.px]="getWidgetBounds(widgetId)?.top"
          [style.width.px]="getWidgetBounds(widgetId)?.width"
          [style.height.px]="getWidgetBounds(widgetId)?.height">

          <!-- Resize Handles (only for single selection) -->
          @if (selectedWidgetIds.length === 1) {
            @for (handle of resizeHandles; track handle.position) {
              <div
                class="resize-handle"
                [class]="'handle-' + handle.position"
                [style.cursor]="handle.cursor"
                (mousedown)="onResizeStart($event, handle)">
              </div>
            }
          }

          <!-- Widget Label -->
          <div class="widget-label">
            {{ getWidgetType(widgetId) }}
          </div>

          <!-- Size Indicators -->
          @if (selectedWidgetIds.length === 1 && showDimensions) {
            <div class="dimension-label dimension-width">
              {{ getWidgetBounds(widgetId)?.width | number:'1.0-0' }}px
            </div>
            <div class="dimension-label dimension-height">
              {{ getWidgetBounds(widgetId)?.height | number:'1.0-0' }}px
            </div>
          }
        </div>
      }

      <!-- Multi-selection Bounds -->
      @if (selectedWidgetIds.length > 1 && combinedBounds) {
        <div
          class="multi-selection-bounds"
          [style.left.px]="combinedBounds.left"
          [style.top.px]="combinedBounds.top"
          [style.width.px]="combinedBounds.width"
          [style.height.px]="combinedBounds.height">
          <div class="multi-selection-label">
            {{ selectedWidgetIds.length }} widgets selected
          </div>
        </div>
      }

      <!-- Context Menu -->
      @if (showContextMenu && contextMenuPosition) {
        <div
          class="context-menu"
          [style.left.px]="contextMenuPosition.x"
          [style.top.px]="contextMenuPosition.y"
          (click)="$event.stopPropagation()">

          <button class="context-menu-item" (click)="cut()">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
            </svg>
            Cut
            <span class="shortcut">Ctrl+X</span>
          </button>

          <button class="context-menu-item" (click)="copy()">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
            </svg>
            Copy
            <span class="shortcut">Ctrl+C</span>
          </button>

          <button class="context-menu-item" (click)="paste()">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
            </svg>
            Paste
            <span class="shortcut">Ctrl+V</span>
          </button>

          <button class="context-menu-item" (click)="duplicate()">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"></path>
            </svg>
            Duplicate
            <span class="shortcut">Ctrl+D</span>
          </button>

          <div class="context-menu-divider"></div>

          <button class="context-menu-item text-red-600" (click)="deleteSelected()">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
            Delete
            <span class="shortcut">Del</span>
          </button>

          @if (selectedWidgetIds.length > 1) {
            <div class="context-menu-divider"></div>

            <button class="context-menu-item" (click)="groupSelected()">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
              Group
              <span class="shortcut">Ctrl+G</span>
            </button>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .selection-overlay {
      @apply fixed inset-0 pointer-events-none z-50;
    }

    .selection-rectangle {
      @apply absolute border-2 border-blue-500 bg-blue-500 bg-opacity-10 pointer-events-none;
    }

    .selection-outline {
      @apply absolute border-2 border-blue-500 pointer-events-auto;
    }

    .multi-selection-bounds {
      @apply absolute border-2 border-dashed border-blue-400 pointer-events-none;
    }

    .widget-label {
      @apply absolute -top-6 left-0 text-xs bg-blue-500 text-white px-2 py-0.5 rounded;
    }

    .multi-selection-label {
      @apply absolute -top-6 left-0 text-xs bg-blue-400 text-white px-2 py-0.5 rounded;
    }

    .dimension-label {
      @apply absolute text-xs bg-gray-800 text-white px-1 py-0.5 rounded;
      font-size: 10px;
    }

    .dimension-width {
      @apply -bottom-6 left-1/2 transform -translate-x-1/2;
    }

    .dimension-height {
      @apply -right-12 top-1/2 transform -translate-y-1/2;
    }

    /* Resize Handles */
    .resize-handle {
      @apply absolute w-2 h-2 bg-white border-2 border-blue-500 rounded-full;
    }

    .handle-nw { @apply -top-1 -left-1 cursor-nw-resize; }
    .handle-n { @apply -top-1 left-1/2 transform -translate-x-1/2 cursor-n-resize; }
    .handle-ne { @apply -top-1 -right-1 cursor-ne-resize; }
    .handle-e { @apply top-1/2 -right-1 transform -translate-y-1/2 cursor-e-resize; }
    .handle-se { @apply -bottom-1 -right-1 cursor-se-resize; }
    .handle-s { @apply -bottom-1 left-1/2 transform -translate-x-1/2 cursor-s-resize; }
    .handle-sw { @apply -bottom-1 -left-1 cursor-sw-resize; }
    .handle-w { @apply top-1/2 -left-1 transform -translate-y-1/2 cursor-w-resize; }

    /* Context Menu */
    .context-menu {
      @apply absolute bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-60 pointer-events-auto;
      min-width: 200px;
    }

    .context-menu-item {
      @apply w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 transition-colors;
    }

    .context-menu-item .shortcut {
      @apply ml-auto text-xs text-gray-400;
    }

    .context-menu-divider {
      @apply border-t border-gray-200 my-1;
    }
  `]
})
export class SelectionOverlayComponent implements OnInit, OnDestroy {
  @ViewChild('overlay', { static: true }) overlay!: ElementRef<HTMLDivElement>;

  selectedWidgetIds: string[] = [];
  combinedBounds: DOMRect | null = null;
  showDimensions = true;

  // Drag selection
  isSelecting = false;
  selectionRect: SelectionRect | null = null;

  // Context menu
  showContextMenu = false;
  contextMenuPosition: { x: number; y: number } | null = null;

  // Resize handles
  resizeHandles: ResizeHandle[] = [
    { position: 'nw', cursor: 'nw-resize', x: 0, y: 0 },
    { position: 'n', cursor: 'n-resize', x: 0.5, y: 0 },
    { position: 'ne', cursor: 'ne-resize', x: 1, y: 0 },
    { position: 'e', cursor: 'e-resize', x: 1, y: 0.5 },
    { position: 'se', cursor: 'se-resize', x: 1, y: 1 },
    { position: 's', cursor: 's-resize', x: 0.5, y: 1 },
    { position: 'sw', cursor: 'sw-resize', x: 0, y: 1 },
    { position: 'w', cursor: 'w-resize', x: 0, y: 0.5 }
  ];

  private destroy$ = new Subject<void>();
  private widgetBoundsCache = new Map<string, DOMRect>();
  private resizing = false;
  private resizeStartData: any = null;

  constructor(
    private selectionService: SelectionService,
    private canvasState: CanvasStateService
  ) {}

  ngOnInit() {
    // Subscribe to selection state
    this.selectionService.state$
      .pipe(takeUntil(this.destroy$))
      .subscribe((state: SelectionState) => {
        this.selectedWidgetIds = Array.from(state.selectedIds);
        this.combinedBounds = state.selectionBounds;
        this.updateWidgetBounds();
      });

    // Set up mouse event listeners for drag selection
    this.setupDragSelection();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('document:contextmenu', ['$event'])
  onContextMenu(event: MouseEvent) {
    // Check if right-clicking on a widget
    const target = event.target as HTMLElement;
    const widgetElement = target.closest('[data-widget-id]');

    if (widgetElement) {
      event.preventDefault();
      const widgetId = widgetElement.getAttribute('data-widget-id');

      if (widgetId) {
        // If not selected, select it
        if (!this.selectionService.isSelected(widgetId)) {
          this.selectionService.selectWidget(widgetId);
        }

        // Show context menu
        this.showContextMenuAt(event.clientX, event.clientY);
      }
    }
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.hideContextMenu();
  }

  private setupDragSelection() {
    let startX = 0, startY = 0;
    let isDragging = false;

    const handleMouseDown = (event: MouseEvent) => {
      // Only start drag selection on canvas background
      const target = event.target as HTMLElement;
      if (target.closest('.device-screen') && !target.closest('[data-widget-id]')) {
        startX = event.clientX;
        startY = event.clientY;
        isDragging = true;
        this.isSelecting = true;
        this.selectionRect = {
          startX,
          startY,
          endX: startX,
          endY: startY
        };
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (isDragging && this.selectionRect) {
        this.selectionRect = {
          ...this.selectionRect,
          endX: event.clientX,
          endY: event.clientY
        };

        // Update selection in real-time
        const addToExisting = event.ctrlKey || event.metaKey;
        this.selectionService.selectInRectangle(this.selectionRect, addToExisting);
      }
    };

    const handleMouseUp = () => {
      if (isDragging) {
        isDragging = false;
        this.isSelecting = false;
        this.selectionRect = null;
      }
    };

    // Add event listeners
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    // Clean up on destroy
    this.destroy$.subscribe(() => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    });
  }

  private updateWidgetBounds() {
    this.widgetBoundsCache.clear();

    this.selectedWidgetIds.forEach(id => {
      const element = document.querySelector(`[data-widget-id="${id}"]`);
      if (element) {
        const rect = element.getBoundingClientRect();
        this.widgetBoundsCache.set(id, rect);
      }
    });
  }

  getWidgetBounds(widgetId: string): DOMRect | null {
    return this.widgetBoundsCache.get(widgetId) || null;
  }

  getWidgetType(widgetId: string): string {
    const root = this.canvasState.currentState.rootWidget;
    if (!root) return '';

    const widget = this.findWidget(root, widgetId);
    return widget?.type || '';
  }

  private findWidget(widget: FlutterWidget, id: string): FlutterWidget | null {
    if (widget.id === id) return widget;

    for (const child of widget.children) {
      const found = this.findWidget(child, id);
      if (found) return found;
    }

    return null;
  }

  // Selection rectangle calculations
  getSelectionRectLeft(): number {
    if (!this.selectionRect) return 0;
    return Math.min(this.selectionRect.startX, this.selectionRect.endX);
  }

  getSelectionRectTop(): number {
    if (!this.selectionRect) return 0;
    return Math.min(this.selectionRect.startY, this.selectionRect.endY);
  }

  getSelectionRectWidth(): number {
    if (!this.selectionRect) return 0;
    return Math.abs(this.selectionRect.endX - this.selectionRect.startX);
  }

  getSelectionRectHeight(): number {
    if (!this.selectionRect) return 0;
    return Math.abs(this.selectionRect.endY - this.selectionRect.startY);
  }

  // Resize handlers
  onResizeStart(event: MouseEvent, handle: ResizeHandle) {
    event.preventDefault();
    event.stopPropagation();

    this.resizing = true;
    this.resizeStartData = {
      handle,
      startX: event.clientX,
      startY: event.clientY,
      originalBounds: this.widgetBoundsCache.get(this.selectedWidgetIds[0])
    };

    // Add document listeners for resize
    const handleMouseMove = (e: MouseEvent) => this.onResize(e);
    const handleMouseUp = () => {
      this.resizing = false;
      this.resizeStartData = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }

  private onResize(event: MouseEvent) {
    if (!this.resizing || !this.resizeStartData) return;

    const deltaX = event.clientX - this.resizeStartData.startX;
    const deltaY = event.clientY - this.resizeStartData.startY;

    // Calculate new dimensions based on handle position
    // This would update the widget's actual dimensions
    // For Phase 5, we're preparing the interface
    console.log('Resizing:', this.resizeStartData.handle.position, deltaX, deltaY);
  }

  // Context menu actions
  showContextMenuAt(x: number, y: number) {
    this.contextMenuPosition = { x, y };
    this.showContextMenu = true;
  }

  hideContextMenu() {
    this.showContextMenu = false;
    this.contextMenuPosition = null;
  }

  cut() {
    this.selectionService.cutSelected();
    this.hideContextMenu();
  }

  copy() {
    this.selectionService.copySelected();
    this.hideContextMenu();
  }

  paste() {
    this.selectionService.paste();
    this.hideContextMenu();
  }

  duplicate() {
    this.selectionService.duplicateSelected();
    this.hideContextMenu();
  }

  deleteSelected() {
    this.selectionService.deleteSelected();
    this.hideContextMenu();
  }

  groupSelected() {
    // Placeholder for grouping functionality
    console.log('Group selected widgets');
    this.hideContextMenu();
  }
}
