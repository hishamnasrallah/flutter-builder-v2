// src/app/core/services/canvas-state.service.ts

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { FlutterWidget, WidgetType } from '../models/flutter-widget.model';
import { WidgetRegistryService } from './widget-registry.service';
import { WidgetTreeService } from './widget-tree.service';
import { v4 as uuidv4 } from 'uuid';

export interface CanvasState {
  rootWidget: FlutterWidget | null;
  selectedWidgetId: string | null;
  hoveredWidgetId: string | null;
  isDragging: boolean;
  dragPreview: DragPreview | null;
  dropTargetId: string | null;
  dropTargetIndex: number | null;
}

export interface DragPreview {
  x: number;
  y: number;
  widget: FlutterWidget | null;
}

export interface DragData {
  type: 'new-widget' | 'existing-widget';
  widgetType?: WidgetType;
  widgetId?: string;
  sourceData?: any;
}

export interface DropTarget {
  widgetId: string;
  index: number;
  canDrop: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CanvasStateService {
  private initialState: CanvasState = {
    rootWidget: null,
    selectedWidgetId: null,
    hoveredWidgetId: null,
    isDragging: false,
    dragPreview: null,
    dropTargetId: null,
    dropTargetIndex: null
  };

  private stateSubject = new BehaviorSubject<CanvasState>(this.initialState);
  public state$ = this.stateSubject.asObservable();

  // History for undo/redo (preparing for future phases)
  private history: FlutterWidget[] = [];
  private historyIndex = -1;
  private maxHistorySize = 50;

  constructor(
    private widgetRegistry: WidgetRegistryService,
    private treeService: WidgetTreeService
  ) {
    // Initialize with sample widget tree for testing
    this.loadSampleWidgetTree();
  }

  /**
   * Load the sample widget tree from Phase 1
   */
  loadSampleWidgetTree(): void {
    const sampleTree = this.widgetRegistry.createSampleWidgetTree();
    this.updateState({ rootWidget: sampleTree });
    this.saveToHistory(sampleTree);
  }

  /**
   * Get current state snapshot
   */
  get currentState(): CanvasState {
    return this.stateSubject.value;
  }

  /**
   * Update state with partial updates
   */
  updateState(updates: Partial<CanvasState>): void {
    this.stateSubject.next({
      ...this.stateSubject.value,
      ...updates
    });
  }

  /**
   * Add a new widget to the canvas
   * @param widgetType Type of widget to add
   * @param parentId Optional parent widget ID
   * @param index Optional index within parent's children
   */
  addWidget(widgetType: WidgetType, parentId?: string | null, index?: number): void {
    try {
      const newWidget = this.widgetRegistry.createWidget(widgetType);

      const updatedRoot = this.treeService.addWidget(
        this.currentState.rootWidget,
        newWidget,
        parentId || null,
        index
      );

      if (updatedRoot !== this.currentState.rootWidget) {
        this.updateState({
          rootWidget: updatedRoot,
          selectedWidgetId: newWidget.id
        });
        this.saveToHistory(updatedRoot);
        console.log('Widget added:', newWidget.type, 'to parent:', parentId || 'root');
      } else {
        console.warn('Could not add widget:', widgetType, 'to parent:', parentId);
      }
    } catch (error) {
      console.error('Error adding widget:', error);
    }
  }

  /**
   * Add a widget with drop position (for drag and drop)
   */
  addWidgetAtDropPosition(
    widgetType: WidgetType,
    dropTargetId: string | null,
    dropIndex: number
  ): void {
    this.addWidget(widgetType, dropTargetId, dropIndex);
  }

  /**
   * Move an existing widget to a new position
   */
  moveWidget(widgetId: string, newParentId: string | null, index: number): void {
    if (!this.currentState.rootWidget) return;

    const updatedRoot = this.treeService.moveWidget(
      this.currentState.rootWidget,
      widgetId,
      newParentId,
      index
    );

    if (updatedRoot && updatedRoot !== this.currentState.rootWidget) {
      this.updateState({ rootWidget: updatedRoot });
      this.saveToHistory(updatedRoot);
      console.log('Widget moved:', widgetId, 'to parent:', newParentId);
    }
  }

  /**
   * Select a widget by ID
   */
  selectWidget(widgetId: string | null): void {
    this.updateState({ selectedWidgetId: widgetId });
  }

  /**
   * Set hover state for a widget
   */
  setHoveredWidget(widgetId: string | null): void {
    this.updateState({ hoveredWidgetId: widgetId });
  }

  /**
   * Update dragging state
   */
  setDragging(isDragging: boolean): void {
    this.updateState({
      isDragging,
      dragPreview: isDragging ? this.currentState.dragPreview : null,
      dropTargetId: null,
      dropTargetIndex: null
    });
  }

  /**
   * Update drop target during drag
   */
  setDropTarget(targetId: string | null, index: number | null): void {
    this.updateState({
      dropTargetId: targetId,
      dropTargetIndex: index
    });
  }

  /**
   * Update drag preview position
   */
  updateDragPreview(preview: DragPreview | null): void {
    this.updateState({ dragPreview: preview });
  }

  /**
   * Find a widget by ID in the tree
   */
  findWidget(widgetId: string): FlutterWidget | null {
    return this.treeService.findWidgetInTree(this.currentState.rootWidget, widgetId);
  }

  /**
   * Clear the canvas
   */
  clearCanvas(): void {
    this.updateState({
      rootWidget: null,
      selectedWidgetId: null,
      hoveredWidgetId: null,
      dropTargetId: null,
      dropTargetIndex: null
    });
    this.saveToHistory(null);
  }

  /**
   * Remove a widget by ID
   */
  removeWidget(widgetId: string): void {
    if (!this.currentState.rootWidget) return;

    const updatedRoot = this.treeService.removeWidget(
      this.currentState.rootWidget,
      widgetId
    );

    this.updateState({
      rootWidget: updatedRoot,
      selectedWidgetId: this.currentState.selectedWidgetId === widgetId ? null : this.currentState.selectedWidgetId
    });

    if (updatedRoot !== this.currentState.rootWidget) {
      this.saveToHistory(updatedRoot);
    }
  }

  /**
   * Check if a widget type can be dropped at target position
   */
  canDropWidget(
    dragData: DragData,
    targetId: string | null,
    targetWidget?: FlutterWidget
  ): boolean {
    // For new widgets
    if (dragData.type === 'new-widget' && dragData.widgetType) {
      // If no target, check if we can create as root
      if (!targetId) {
        return !this.currentState.rootWidget;
      }

      // Check if target can accept this widget type
      const target = targetWidget || this.findWidget(targetId);
      if (target) {
        return this.treeService.canAcceptChild(target.type, dragData.widgetType);
      }
    }

    // For existing widgets being moved
    if (dragData.type === 'existing-widget' && dragData.widgetId) {
      // Can't drop on self or descendants
      const draggedWidget = this.findWidget(dragData.widgetId);
      if (!draggedWidget) return false;

      // Check if we're dropping on a descendant
      if (targetId) {
        const path = this.treeService.getWidgetPath(draggedWidget, targetId);
        if (path.length > 0) return false; // Can't drop on descendant

        // Check if target can accept this widget type
        const target = targetWidget || this.findWidget(targetId);
        if (target) {
          return this.treeService.canAcceptChild(target.type, draggedWidget.type);
        }
      }
    }

    return false;
  }

  /**
   * Get valid drop zones for current drag operation
   */
  getValidDropZones(dragData: DragData): DropTarget[] {
    if (!this.currentState.rootWidget) return [];

    const dropTargets: DropTarget[] = [];

    if (dragData.type === 'new-widget' && dragData.widgetType) {
      const zones = this.treeService.getValidDropZones(
        this.currentState.rootWidget,
        dragData.widgetType
      );

      return zones.map(zone => ({
        widgetId: zone.parentId,
        index: zone.index,
        canDrop: zone.canDrop
      }));
    }

    return dropTargets;
  }

  /**
   * Get observable for specific state property
   */
  getSelectedWidget$(): Observable<FlutterWidget | null> {
    return new Observable(observer => {
      this.state$.subscribe(state => {
        const selected = state.selectedWidgetId ? this.findWidget(state.selectedWidgetId) : null;
        observer.next(selected);
      });
    });
  }

  /**
   * Save current state to history
   */
  private saveToHistory(root: FlutterWidget | null): void {
    // Remove any states after current index
    this.history = this.history.slice(0, this.historyIndex + 1);

    // Add new state
    if (root) {
      this.history.push(JSON.parse(JSON.stringify(root)));
    } else {
      this.history.push(null as any);
    }

    // Limit history size
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    } else {
      this.historyIndex++;
    }
  }

  /**
   * Undo last action
   */
  undo(): void {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      const previousState = this.history[this.historyIndex];
      this.updateState({
        rootWidget: previousState ? JSON.parse(JSON.stringify(previousState)) : null
      });
    }
  }

  /**
   * Redo last undone action
   */
  redo(): void {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      const nextState = this.history[this.historyIndex];
      this.updateState({
        rootWidget: nextState ? JSON.parse(JSON.stringify(nextState)) : null
      });
    }
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.historyIndex > 0;
  }

  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this.historyIndex < this.history.length - 1;
  }
}
