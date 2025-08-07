// src/app/core/services/selection.service.ts

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { FlutterWidget } from '../models/flutter-widget.model';
import { CanvasStateService } from './canvas-state.service';
import { WidgetTreeService } from './widget-tree.service';
import { WidgetRegistryService } from './widget-registry.service';
import { NotificationService } from './notification.service';
import { v4 as uuidv4 } from 'uuid';

export interface SelectionState {
  selectedIds: Set<string>;
  selectionBounds: DOMRect | null;
  isMultiSelect: boolean;
  copiedWidgets: FlutterWidget[] | null;
  lastSelectedId: string | null;
  isDragging: boolean;
  dragStartPosition: { x: number; y: number } | null;
}

export interface SelectionRect {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

@Injectable({
  providedIn: 'root'
})
export class SelectionService {
  private initialState: SelectionState = {
    selectedIds: new Set<string>(),
    selectionBounds: null,
    isMultiSelect: false,
    copiedWidgets: null,
    lastSelectedId: null,
    isDragging: false,
    dragStartPosition: null
  };

  private stateSubject = new BehaviorSubject<SelectionState>(this.initialState);
  public state$ = this.stateSubject.asObservable();

  // Selection rectangle for drag selection
  private selectionRect: SelectionRect | null = null;
  private keyboardListener: ((event: KeyboardEvent) => void) | null = null;

  constructor(
    private canvasState: CanvasStateService,
    private treeService: WidgetTreeService,
    private widgetRegistry: WidgetRegistryService,
    private notification: NotificationService
  ) {
    this.initializeKeyboardShortcuts();
  }

  get currentState(): SelectionState {
    return this.stateSubject.value;
  }

  private updateState(updates: Partial<SelectionState>): void {
    this.stateSubject.next({
      ...this.stateSubject.value,
      ...updates
    });
  }

  /**
   * Initialize keyboard shortcuts
   */
  private initializeKeyboardShortcuts(): void {
    this.keyboardListener = (event: KeyboardEvent) => {
      // Ignore if typing in an input field
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
        return;
      }

      const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform);
      const modKey = isMac ? event.metaKey : event.ctrlKey;

      // Ctrl/Cmd + A - Select All
      if (modKey && event.key === 'a') {
        event.preventDefault();
        this.selectAll();
      }
      // Ctrl/Cmd + C - Copy
      else if (modKey && event.key === 'c') {
        event.preventDefault();
        this.copySelected();
      }
      // Ctrl/Cmd + X - Cut
      else if (modKey && event.key === 'x') {
        event.preventDefault();
        this.cutSelected();
      }
      // Ctrl/Cmd + V - Paste
      else if (modKey && event.key === 'v') {
        event.preventDefault();
        this.paste();
      }
      // Ctrl/Cmd + D - Duplicate
      else if (modKey && event.key === 'd') {
        event.preventDefault();
        this.duplicateSelected();
      }
      // Delete or Backspace - Delete selected
      else if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        this.deleteSelected();
      }
      // Escape - Clear selection
      else if (event.key === 'Escape') {
        event.preventDefault();
        this.clearSelection();
      }
      // Arrow keys - Nudge position
      else if (event.key.startsWith('Arrow')) {
        const shift = event.shiftKey;
        const distance = shift ? 10 : 1;
        this.nudgeSelected(event.key, distance);
        event.preventDefault();
      }
    };

    document.addEventListener('keydown', this.keyboardListener);
  }

  /**
   * Clean up keyboard listeners
   */
  destroy(): void {
    if (this.keyboardListener) {
      document.removeEventListener('keydown', this.keyboardListener);
      this.keyboardListener = null;
    }
  }

  /**
   * Select a single widget
   */
  selectWidget(widgetId: string, isMultiSelect: boolean = false): void {
    const currentIds = new Set(this.currentState.selectedIds);

    if (isMultiSelect) {
      // Toggle selection in multi-select mode
      if (currentIds.has(widgetId)) {
        currentIds.delete(widgetId);
      } else {
        currentIds.add(widgetId);
      }
    } else {
      // Single select mode - replace selection
      currentIds.clear();
      currentIds.add(widgetId);
    }

    this.updateState({
      selectedIds: currentIds,
      isMultiSelect,
      lastSelectedId: widgetId
    });

    // Update canvas state for backward compatibility
    if (currentIds.size === 1) {
      this.canvasState.selectWidget(widgetId);
    } else if (currentIds.size === 0) {
      this.canvasState.selectWidget(null);
    } else {
      // Multiple selection - use last selected
      this.canvasState.selectWidget(widgetId);
    }

    this.updateSelectionBounds();
  }

  /**
   * Add widget to selection
   */
  addToSelection(widgetId: string): void {
    const currentIds = new Set(this.currentState.selectedIds);
    currentIds.add(widgetId);

    this.updateState({
      selectedIds: currentIds,
      isMultiSelect: true,
      lastSelectedId: widgetId
    });

    this.updateSelectionBounds();
  }

  /**
   * Remove widget from selection
   */
  removeFromSelection(widgetId: string): void {
    const currentIds = new Set(this.currentState.selectedIds);
    currentIds.delete(widgetId);

    this.updateState({
      selectedIds: currentIds,
      lastSelectedId: currentIds.size > 0 ? Array.from(currentIds)[currentIds.size - 1] : null
    });

    this.updateSelectionBounds();
  }

  /**
   * Select all widgets
   */
  selectAll(): void {
    const root = this.canvasState.currentState.rootWidget;
    if (!root) return;

    const allIds = new Set<string>();
    const collectIds = (widget: FlutterWidget) => {
      allIds.add(widget.id);
      widget.children.forEach(child => collectIds(child));
    };

    collectIds(root);

    this.updateState({
      selectedIds: allIds,
      isMultiSelect: true,
      lastSelectedId: root.id
    });

    this.notification.showInfo(`Selected ${allIds.size} widgets`);
    this.updateSelectionBounds();
  }

  /**
   * Clear selection
   */
  clearSelection(): void {
    this.updateState({
      selectedIds: new Set(),
      isMultiSelect: false,
      lastSelectedId: null,
      selectionBounds: null
    });

    this.canvasState.selectWidget(null);
  }

  /**
   * Select widgets within rectangle
   */
  selectInRectangle(rect: SelectionRect, addToExisting: boolean = false): void {
    const root = this.canvasState.currentState.rootWidget;
    if (!root) return;

    const selectedIds = addToExisting ? new Set(this.currentState.selectedIds) : new Set<string>();

    // Find all widgets within the rectangle
    const elementsInRect = this.findWidgetsInRectangle(rect);
    elementsInRect.forEach(id => selectedIds.add(id));

    this.updateState({
      selectedIds,
      isMultiSelect: selectedIds.size > 1,
      lastSelectedId: selectedIds.size > 0 ? Array.from(selectedIds)[selectedIds.size - 1] : null
    });

    if (selectedIds.size === 1) {
      this.canvasState.selectWidget(Array.from(selectedIds)[0]);
    } else if (selectedIds.size === 0) {
      this.canvasState.selectWidget(null);
    }

    this.updateSelectionBounds();
  }

  /**
   * Copy selected widgets to clipboard
   */
  copySelected(): void {
    const selectedIds = this.currentState.selectedIds;
    if (selectedIds.size === 0) return;

    const root = this.canvasState.currentState.rootWidget;
    if (!root) return;

    const copiedWidgets: FlutterWidget[] = [];

    selectedIds.forEach(id => {
      const widget = this.treeService.findWidgetInTree(root, id);
      if (widget) {
        // Deep clone the widget
        const cloned = this.deepCloneWidget(widget);
        copiedWidgets.push(cloned);
      }
    });

    this.updateState({ copiedWidgets });
    this.notification.showSuccess(`Copied ${copiedWidgets.length} widget(s)`);

    // Also copy to system clipboard as JSON
    this.copyToSystemClipboard(copiedWidgets);
  }

  /**
   * Cut selected widgets
   */
  cutSelected(): void {
    this.copySelected();
    this.deleteSelected();
  }

  /**
   * Paste widgets from clipboard
   */
  paste(): void {
    const copiedWidgets = this.currentState.copiedWidgets;
    if (!copiedWidgets || copiedWidgets.length === 0) {
      this.notification.showWarning('Nothing to paste');
      return;
    }

    const root = this.canvasState.currentState.rootWidget;
    const selectedId = this.currentState.lastSelectedId;

    // Determine paste target
    let targetId: string | null = null;
    if (selectedId && root) {
      const target = this.treeService.findWidgetInTree(root, selectedId);
      if (target && this.widgetRegistry.canAcceptChildren(target.type)) {
        targetId = selectedId;
      } else if (target?.parent) {
        targetId = target.parent;
      }
    }

    // Paste each widget with new IDs
    const pastedIds = new Set<string>();
    copiedWidgets.forEach(widget => {
      const pastedWidget = this.deepCloneWidget(widget, true); // true = generate new IDs
      this.canvasState.addWidget(pastedWidget.type, targetId);
      pastedIds.add(pastedWidget.id);
    });

    // Select pasted widgets
    this.updateState({
      selectedIds: pastedIds,
      isMultiSelect: pastedIds.size > 1
    });

    this.notification.showSuccess(`Pasted ${copiedWidgets.length} widget(s)`);
  }

  /**
   * Duplicate selected widgets
   */
  duplicateSelected(): void {
    const selectedIds = this.currentState.selectedIds;
    if (selectedIds.size === 0) return;

    const root = this.canvasState.currentState.rootWidget;
    if (!root) return;

    const duplicatedIds = new Set<string>();

    selectedIds.forEach(id => {
      const widget = this.treeService.findWidgetInTree(root, id);
      if (widget && widget.parent) {
        const duplicated = this.deepCloneWidget(widget, true);

        // Add duplicated widget next to original
        const parent = this.treeService.findWidgetInTree(root, widget.parent);
        if (parent) {
          const index = parent.children.findIndex(c => c.id === widget.id);
          this.canvasState.addWidget(duplicated.type, widget.parent, index + 1);
          duplicatedIds.add(duplicated.id);
        }
      }
    });

    // Select duplicated widgets
    this.updateState({
      selectedIds: duplicatedIds,
      isMultiSelect: duplicatedIds.size > 1
    });

    this.notification.showSuccess(`Duplicated ${duplicatedIds.size} widget(s)`);
  }

  /**
   * Delete selected widgets
   */
  deleteSelected(): void {
    const selectedIds = this.currentState.selectedIds;
    if (selectedIds.size === 0) return;

    const root = this.canvasState.currentState.rootWidget;
    if (!root) return;

    // Check if trying to delete root
    if (selectedIds.has(root.id)) {
      if (confirm('This will clear the entire canvas. Are you sure?')) {
        this.canvasState.clearCanvas();
        this.clearSelection();
      }
      return;
    }

    // Delete each selected widget
    selectedIds.forEach(id => {
      this.canvasState.removeWidget(id);
    });

    this.clearSelection();
    this.notification.showSuccess(`Deleted ${selectedIds.size} widget(s)`);
  }

  /**
   * Nudge selected widgets
   */
  nudgeSelected(direction: string, distance: number): void {
    // This would update widget positions
    // For Phase 5, we'll prepare the interface but full implementation
    // would require position properties on widgets
    console.log(`Nudging ${direction} by ${distance}px`);
  }

  /**
   * Update selection bounds
   */
  private updateSelectionBounds(): void {
    const selectedIds = this.currentState.selectedIds;
    if (selectedIds.size === 0) {
      this.updateState({ selectionBounds: null });
      return;
    }

    // Calculate combined bounds of all selected widgets
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    selectedIds.forEach(id => {
      const element = document.querySelector(`[data-widget-id="${id}"]`);
      if (element) {
        const rect = element.getBoundingClientRect();
        minX = Math.min(minX, rect.left);
        minY = Math.min(minY, rect.top);
        maxX = Math.max(maxX, rect.right);
        maxY = Math.max(maxY, rect.bottom);
      }
    });

    if (minX !== Infinity) {
      const bounds = new DOMRect(minX, minY, maxX - minX, maxY - minY);
      this.updateState({ selectionBounds: bounds });
    }
  }

  /**
   * Find widgets within selection rectangle
   */
  private findWidgetsInRectangle(rect: SelectionRect): string[] {
    const widgetIds: string[] = [];
    const elements = document.querySelectorAll('[data-widget-id]');

    elements.forEach(element => {
      const bounds = element.getBoundingClientRect();
      if (this.rectanglesIntersect(rect, bounds)) {
        const id = element.getAttribute('data-widget-id');
        if (id) widgetIds.push(id);
      }
    });

    return widgetIds;
  }

  /**
   * Check if two rectangles intersect
   */
  private rectanglesIntersect(rect1: SelectionRect, rect2: DOMRect): boolean {
    const r1 = {
      left: Math.min(rect1.startX, rect1.endX),
      right: Math.max(rect1.startX, rect1.endX),
      top: Math.min(rect1.startY, rect1.endY),
      bottom: Math.max(rect1.startY, rect1.endY)
    };

    return !(rect2.left > r1.right ||
             rect2.right < r1.left ||
             rect2.top > r1.bottom ||
             rect2.bottom < r1.top);
  }

  /**
   * Deep clone a widget with optional new IDs
   */
  private deepCloneWidget(widget: FlutterWidget, generateNewIds: boolean = false): FlutterWidget {
    const cloned: FlutterWidget = {
      ...widget,
      id: generateNewIds ? uuidv4() : widget.id,
      properties: { ...widget.properties },
      children: widget.children.map(child => this.deepCloneWidget(child, generateNewIds))
    };

    // Update parent references if generating new IDs
    if (generateNewIds && cloned.children.length > 0) {
      cloned.children.forEach(child => {
        child.parent = cloned.id;
      });
    }

    return cloned;
  }

  /**
   * Copy widgets to system clipboard as JSON
   */
  private async copyToSystemClipboard(widgets: FlutterWidget[]): Promise<void> {
    try {
      const json = JSON.stringify(widgets, null, 2);
      await navigator.clipboard.writeText(json);
    } catch (error) {
      console.error('Failed to copy to system clipboard:', error);
    }
  }

  /**
   * Check if widget is selected
   */
  isSelected(widgetId: string): boolean {
    return this.currentState.selectedIds.has(widgetId);
  }

  /**
   * Get selected widgets
   */
  getSelectedWidgets(): FlutterWidget[] {
    const root = this.canvasState.currentState.rootWidget;
    if (!root) return [];

    const widgets: FlutterWidget[] = [];
    this.currentState.selectedIds.forEach(id => {
      const widget = this.treeService.findWidgetInTree(root, id);
      if (widget) widgets.push(widget);
    });

    return widgets;
  }
}
