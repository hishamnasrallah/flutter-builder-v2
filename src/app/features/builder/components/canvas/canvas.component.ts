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
import { SelectionOverlayComponent } from '../selection-overlay/selection-overlay.component';

@Component({
  selector: 'app-canvas',
  standalone: true,
  imports: [CommonModule, WidgetRendererComponent, SelectionOverlayComponent ],
  templateUrl:'canvas.component.html',
  styleUrl:'canvas.component.scss'
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
  // Only clear if clicking on empty canvas, not on widgets
  const target = event.target as HTMLElement;
  if (target.classList.contains('device-screen') &&
      !target.closest('[data-widget-id]')) {
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
