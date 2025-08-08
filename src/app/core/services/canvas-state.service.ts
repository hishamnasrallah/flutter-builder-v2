// src/app/core/services/canvas-state.service.ts

import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable, of, throwError} from 'rxjs';
import {tap, catchError} from 'rxjs/operators';
import {FlutterWidget, WidgetType} from '../models/flutter-widget.model';
import {WidgetRegistryService} from './widget-registry.service';
import {WidgetTreeService} from './widget-tree.service';
import {v4 as uuidv4} from 'uuid';
import {ScreenService} from './screen.service';

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

  // History for undo/redo
  private history: FlutterWidget[] = [];
  private historyIndex = -1;
  private maxHistorySize = 50;

  // Screen management properties
  private currentScreenId: number | null = null;
  private currentProjectId: number | null = null;
  private autoSaveEnabled = true;
  private lastSaveTime: Date | null = null;
  private hasUnsavedChanges = false;

  constructor(
    private widgetRegistry: WidgetRegistryService,
    private treeService: WidgetTreeService,
    private screenService: ScreenService
  ) {
    // Initialize with sample widget tree for testing
    this.loadSampleWidgetTree();
  }

  // Project management methods
  setCurrentProject(projectId: number) {
    this.currentProjectId = projectId;
  }

  getCurrentProject(): number | null {
    return this.currentProjectId;
  }

  // Screen management methods
  loadScreen(screenId: number) {
    this.currentScreenId = screenId;

    // Clear current state
    this.updateState({
      rootWidget: null,
      selectedWidgetId: null,
      hoveredWidgetId: null
    });

    this.screenService.getScreen(screenId).subscribe({
      next: (screen) => {
        console.log('CanvasStateService - Raw screen from backend:', screen);

        let loadedUiStructure = screen.ui_structure;

        // Normalize the UI structure to ensure all 'children' properties are arrays
        // AND normalize widget types to PascalCase
        if (loadedUiStructure) {
          loadedUiStructure = this.normalizeUiStructure(loadedUiStructure);
          console.log('CanvasStateService - After normalization:', loadedUiStructure);
        } else {
          console.log('CanvasStateService - ui_structure is null/undefined, creating empty root');
        }

        // Load the UI structure
        const widgetToLoad = loadedUiStructure || this.createEmptyRoot();
        console.log('CanvasStateService - Final widget to load:', widgetToLoad);

        this.updateState({
          rootWidget: widgetToLoad
        });

        // Reset history for new screen
        this.history = [widgetToLoad];
        this.historyIndex = 0;
        this.hasUnsavedChanges = false;

        console.log(`Loaded screen: ${screen.name}`);
      },
      error: (error) => {
        console.error('Error loading screen:', error);
        // Create empty root on error
        this.updateState({
          rootWidget: this.createEmptyRoot()
        });
      }
    });
  }

  /**
   * Normalize widget type from backend format to frontend enum format
   * Converts lowercase types to PascalCase (e.g., "column" -> "Column")
   */
  private normalizeWidgetType(type: string): WidgetType {
    if (!type) {
      return WidgetType.CUSTOM; // Fallback for empty or null types
    }

    // Convert first letter to uppercase, rest to lowercase
    // This handles cases like "column" -> "Column" and "Scaffold" -> "Scaffold"
    const normalizedType = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();

    // Special cases mapping if backend uses different names than enum
    const typeMapping: Record<string, WidgetType> = {
      'appbar': WidgetType.APP_BAR,
      'sizedbox': WidgetType.SIZED_BOX,
      'listview': WidgetType.LIST_VIEW,
      'gridview': WidgetType.GRID_VIEW,
      'textfield': WidgetType.TEXT_FIELD,
      'textformfield': WidgetType.TEXT_FORM_FIELD,
      'elevatedbutton': WidgetType.ELEVATED_BUTTON,
      'textbutton': WidgetType.TEXT_BUTTON,
      'outlinedbutton': WidgetType.OUTLINED_BUTTON,
      'iconbutton': WidgetType.ICON_BUTTON,
      'listtile': WidgetType.LIST_TILE,
      'dropdownbutton': WidgetType.DROPDOWN_BUTTON,
      'circularprogressindicator': WidgetType.CIRCULAR_PROGRESS,
      'linearprogressindicator': WidgetType.LINEAR_PROGRESS,
      'bottomnavigationbar': WidgetType.BOTTOM_NAV_BAR,
      'tabbar': WidgetType.TAB_BAR,
      'floatingactionbutton': WidgetType.FAB,
      'popupmenubutton': WidgetType.POPUP_MENU,
      'aspectratio': WidgetType.ASPECT_RATIO,
      'fittedbox': WidgetType.FITTED_BOX
    };

    // Check if we have a special mapping for this type
    const lowerType = type.toLowerCase();
    if (typeMapping[lowerType]) {
      return typeMapping[lowerType];
    }

    // Otherwise, use the simple capitalized version
    return normalizedType as WidgetType;
  }

  /**
   * Recursively normalizes the UI structure:
   * - Ensures 'children' property is an array
   * - Converts widget 'type' to PascalCase
   */
  private normalizeUiStructure(widget: any): FlutterWidget {
    // Ensure widget has an ID
    if (!widget.id) {
      widget.id = uuidv4();
    }

    // Normalize the widget type
    widget.type = this.normalizeWidgetType(widget.type);

    // Ensure children is an array and recursively normalize children
    if (!Array.isArray(widget.children)) {
      widget.children = [];
    }

    widget.children = widget.children.map((child: any) => this.normalizeUiStructure(child));

    // Ensure properties object exists
    if (!widget.properties) {
      widget.properties = {};
    }

    return widget as FlutterWidget;
  }

  // Save current state to backend
  saveToBackend(): Observable<any> {
    if (!this.currentScreenId || !this.currentState.rootWidget) {
      return of(null);
    }

    return this.screenService.updateUiStructure(
      this.currentScreenId,
      this.currentState.rootWidget
    ).pipe(
      tap(() => {
        this.lastSaveTime = new Date();
        this.hasUnsavedChanges = false;
        console.log('Saved to backend at', this.lastSaveTime);
      }),
      catchError((error) => {
        console.error('Error saving to backend:', error);
        return throwError(() => error);
      })
    );
  }

  // Create empty root widget
  private createEmptyRoot(): FlutterWidget {
    return {
      id: uuidv4(),
      type: WidgetType.CONTAINER,
      properties: {
        width: undefined,
        height: undefined,
        color: '#FFFFFF'
      },
      children: [] // Always ensure this is an array
    };
  }

  // Get current screen ID
  getCurrentScreenId(): number | null {
    return this.currentScreenId;
  }

  // Check if there are unsaved changes
  getHasUnsavedChanges(): boolean {
    return this.hasUnsavedChanges;
  }

  // Mark as having unsaved changes
  markAsChanged(): void {
    this.hasUnsavedChanges = true;
  }

  // Enable/disable auto-save
  setAutoSaveEnabled(enabled: boolean): void {
    this.autoSaveEnabled = enabled;
  }

  /**
   * Load the sample widget tree from Phase 1
   */
  loadSampleWidgetTree(): void {
    const sampleTree = this.widgetRegistry.createSampleWidgetTree();
    this.updateState({rootWidget: sampleTree});
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

    // Mark as changed if widget structure updated
    if (updates.rootWidget !== undefined) {
      this.markAsChanged();
    }
  }

  /**
   * Add a new widget to the canvas
   */
  addWidget(widgetType: WidgetType, parentId?: string | null, index?: number): void {
    console.log('CanvasStateService: addWidget called with widgetType:', widgetType);
    console.log('  - typeof widgetType:', typeof widgetType);
    console.log('  - parentId:', parentId);
    console.log('  - index:', index);

    if (!widgetType) {
      console.error('CanvasStateService: ERROR! widgetType is undefined or null');
      return;
    }

    try {
      console.log('CanvasStateService: About to call createWidget with type:', widgetType);
      const newWidget = this.widgetRegistry.createWidget(widgetType);
      console.log('CanvasStateService: Created new widget:', newWidget);

      const updatedRoot = this.treeService.addWidget(
        this.currentState.rootWidget,
        newWidget,
        parentId || null,
        index
      );
      console.log('CanvasStateService: Tree service returned updatedRoot:', updatedRoot);

      if (updatedRoot !== this.currentState.rootWidget) {
        console.log('CanvasStateService: Root changed, updating state');
        this.updateState({
          rootWidget: updatedRoot,
          selectedWidgetId: newWidget.id
        });
        this.saveToHistory(updatedRoot);

        // Sync with backend if screen is loaded
        if (this.currentScreenId) {
          console.log('CanvasStateService: Syncing with backend for screen:', this.currentScreenId);
          this.screenService.addWidget(this.currentScreenId, {
            widget_type: widgetType,
            parent_id: parentId,
            index: index,
            properties: newWidget.properties
          }).subscribe({
            next: (response) => {
              console.log('CanvasStateService: Widget added to backend successfully');
            },
            error: (error) => {
              console.error('CanvasStateService: Error syncing with backend:', error);
            }
          });
        }
      } else {
        console.warn('CanvasStateService: Root did not change after adding widget');
      }
    } catch (error) {
      console.error('CanvasStateService: Error adding widget:', error);
      console.error('CanvasStateService: Error stack:', (error as Error).stack);
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
      this.updateState({rootWidget: updatedRoot});
      this.saveToHistory(updatedRoot);
    }
  }

  /**
   * Select a widget by ID
   */
  selectWidget(widgetId: string | null): void {
    this.updateState({selectedWidgetId: widgetId});
  }

  /**
   * Set hover state for a widget
   */
  setHoveredWidget(widgetId: string | null): void {
    this.updateState({hoveredWidgetId: widgetId});
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
    this.updateState({dragPreview: preview});
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
