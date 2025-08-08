// src/app/features/builder/components/widget-renderer/widget-renderer.component.ts

import {Component, Input, Output, EventEmitter, OnInit, OnChanges, ChangeDetectionStrategy} from '@angular/core';
import {CommonModule} from '@angular/common';
import {
  FlutterWidget,
  WidgetType,
  MainAxisAlignment,
  CrossAxisAlignment,
  Alignment
} from '../../../../core/models/flutter-widget.model';
import {CanvasStateService, DragData} from '../../../../core/services/canvas-state.service';
import {WidgetRegistryService} from '../../../../core/services/widget-registry.service';
import {SelectionService} from '../../../../core/services/selection.service';

@Component({
  selector: 'app-widget-renderer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      [attr.data-widget-id]="widget.id"
      [ngClass]="getWidgetClasses()"
      [ngStyle]="getWidgetStyles()"
      (click)="handleClick($event)"
      [class.widget-selected]="isSelected || isMultiSelected"
      [class.widget-hoverable]="true"
      [class.can-accept-children]="canAcceptChildren"
      [draggable]="!isRootWidget"
      (dragstart)="onDragStart($event)"
      (dragend)="onDragEnd($event)"
      [class.dragging]="isDragging">

      @switch (widget.type) {
        <!-- Container Widget -->
        @case (WidgetType.CONTAINER) {
          <div
            class="widget-drop-zone"
            (dragover)="onDragOver($event)"
            (drop)="onDrop($event)"
            (dragleave)="onDragLeave($event)"
            [class.drop-zone-active]="isDragOver">

            @if (widget.children.length > 0) {
              @for (child of widget.children; track child; let i = $index) {
                <div class="child-wrapper">
                  @if (showDropIndicator(i)) {
                    <div class="drop-indicator"></div>
                  }
                  <app-widget-renderer
                    [widget]="child"
                    [selectedId]="selectedId"
                    [parentWidget]="widget"
                    (widgetClick)="bubbleClick($event)">
                  </app-widget-renderer>
                </div>
              }
              @if (showDropIndicator(widget.children.length)) {
                <div class="drop-indicator"></div>
              }
            } @else {
              <div class="empty-container">
                <span class="empty-text">Drop widgets here</span>
              </div>
            }
          </div>
        }

        <!-- Text Widget -->
        @case (WidgetType.TEXT) {
          <span [ngStyle]="getTextStyles()">{{ widget.properties.text || 'Text' }}</span>
        }

        <!-- Column Widget -->
        @case (WidgetType.COLUMN) {
          <div
            class="flutter-column widget-drop-zone"
            [ngStyle]="getFlexContainerStyles()"
            (dragover)="onDragOver($event)"
            (drop)="onDrop($event)"
            (dragleave)="onDragLeave($event)"
            [class.drop-zone-active]="isDragOver">

            @if (widget.children.length > 0) {
              @for (child of widget.children; track child; let i = $index) {
                <div class="child-wrapper">
                  @if (showDropIndicator(i)) {
                    <div class="drop-indicator-horizontal"></div>
                  }
                  <app-widget-renderer
                    [widget]="child"
                    [selectedId]="selectedId"
                    [parentWidget]="widget"
                    (widgetClick)="bubbleClick($event)">
                  </app-widget-renderer>
                </div>
              }
              @if (showDropIndicator(widget.children.length)) {
                <div class="drop-indicator-horizontal"></div>
              }
            } @else {
              <div class="empty-layout">
                <span class="empty-text">Drop widgets here</span>
              </div>
            }
          </div>
        }

        <!-- Row Widget -->
        @case (WidgetType.ROW) {
          <div
            class="flutter-row widget-drop-zone"
            [ngStyle]="getFlexContainerStyles()"
            (dragover)="onDragOver($event)"
            (drop)="onDrop($event)"
            (dragleave)="onDragLeave($event)"
            [class.drop-zone-active]="isDragOver">

            @if (widget.children.length > 0) {
              @for (child of widget.children; track child; let i = $index) {
                <div class="child-wrapper-horizontal">
                  @if (showDropIndicator(i)) {
                    <div class="drop-indicator-vertical"></div>
                  }
                  <app-widget-renderer
                    [widget]="child"
                    [selectedId]="selectedId"
                    [parentWidget]="widget"
                    (widgetClick)="bubbleClick($event)">
                  </app-widget-renderer>
                </div>
              }
              @if (showDropIndicator(widget.children.length)) {
                <div class="drop-indicator-vertical"></div>
              }
            } @else {
              <div class="empty-layout">
                <span class="empty-text">Drop widgets here</span>
              </div>
            }
          </div>
        }

        <!-- Stack Widget -->
        @case (WidgetType.STACK) {
          <div
            class="relative w-full h-full min-h-[100px] widget-drop-zone"
            (dragover)="onDragOver($event)"
            (drop)="onDrop($event)"
            (dragleave)="onDragLeave($event)"
            [class.drop-zone-active]="isDragOver">

            @if (widget.children.length > 0) {
              @for (child of widget.children; track child; let i = $index) {
                <div class="absolute" [ngStyle]="getStackChildPosition(i, child)">
                  <app-widget-renderer
                    [widget]="child"
                    [selectedId]="selectedId"
                    [parentWidget]="widget"
                    (widgetClick)="bubbleClick($event)">
                  </app-widget-renderer>
                </div>
              }
            } @else {
              <div class="empty-layout">
                <span class="empty-text">Drop widgets here</span>
              </div>
            }
          </div>
        }

        <!-- Padding Widget -->
        @case (WidgetType.PADDING) {
          <div
            [ngStyle]="getPaddingStyles()"
            class="widget-drop-zone"
            (dragover)="onDragOver($event)"
            (drop)="onDrop($event)"
            (dragleave)="onDragLeave($event)"
            [class.drop-zone-active]="isDragOver">

            @if (widget.children.length > 0) {
              @for (child of widget.children; track trackByChild; let i = $index) {
                <app-widget-renderer
                  [widget]="child"
                  [selectedId]="selectedId"
                  [parentWidget]="widget"
                  (widgetClick)="bubbleClick($event)">
                </app-widget-renderer>
              }
            } @else {
              <div class="empty-layout">
                <span class="empty-text">Drop widget here</span>
              </div>
            }
          </div>
        }

        <!-- Center Widget -->
        @case (WidgetType.CENTER) {
          <div
            class="flex items-center justify-center w-full h-full widget-drop-zone"
            (dragover)="onDragOver($event)"
            (drop)="onDrop($event)"
            (dragleave)="onDragLeave($event)"
            [class.drop-zone-active]="isDragOver">

            @if (widget.children.length > 0) {
              @for (child of widget.children; track trackByChild; let i = $index) {
                <app-widget-renderer
                  [widget]="child"
                  [selectedId]="selectedId"
                  [parentWidget]="widget"
                  (widgetClick)="bubbleClick($event)">
                </app-widget-renderer>
              }
            } @else {
              <div class="empty-layout">
                <span class="empty-text">Drop widget here</span>
              </div>
            }
          </div>
        }

        <!-- SizedBox Widget -->
        @case (WidgetType.SIZED_BOX) {
          <div
            [ngStyle]="getSizedBoxStyles()"
            class="widget-drop-zone"
            (dragover)="onDragOver($event)"
            (drop)="onDrop($event)"
            (dragleave)="onDragLeave($event)"
            [class.drop-zone-active]="isDragOver">

            @if (widget.children.length > 0) {
              @for (child of widget.children; track trackByChild; let i = $index) {
                <app-widget-renderer
                  [widget]="child"
                  [selectedId]="selectedId"
                  [parentWidget]="widget"
                  (widgetClick)="bubbleClick($event)">
                </app-widget-renderer>
              }
            } @else {
              <div class="empty-sized-box">
                <span class="empty-text">SizedBox</span>
              </div>
            }
          </div>
        }

        <!-- Scaffold Widget -->
        @case (WidgetType.SCAFFOLD) {
          <div
            class="w-full h-full bg-white widget-drop-zone"
            (dragover)="onDragOver($event)"
            (drop)="onDrop($event)"
            (dragleave)="onDragLeave($event)"
            [class.drop-zone-active]="isDragOver">

            @if (widget.children.length > 0) {
              @for (child of widget.children; track trackByChild; let i = $index) {
                <app-widget-renderer
                  [widget]="child"
                  [selectedId]="selectedId"
                  [parentWidget]="widget"
                  (widgetClick)="bubbleClick($event)">
                </app-widget-renderer>
              }
            } @else {
              <div class="empty-layout">
                <span class="empty-text">Drop widgets here</span>
              </div>
            }
          </div>
        }

        <!-- AppBar Widget -->
        @case (WidgetType.APP_BAR) {
          <div class="w-full h-14 flex items-center px-4" [ngStyle]="getAppBarStyles()">
            <span class="text-white text-lg font-medium">{{ widget.properties.title || 'AppBar' }}</span>
          </div>
        }

        <!-- Card Widget -->
        @case (WidgetType.CARD) {
          <div
            class="flutter-card widget-drop-zone"
            [ngStyle]="getCardStyles()"
            (dragover)="onDragOver($event)"
            (drop)="onDrop($event)"
            (dragleave)="onDragLeave($event)"
            [class.drop-zone-active]="isDragOver">
            @if (widget.children.length > 0) {
              @for (child of widget.children; track trackByChild; let i = $index) {
                <app-widget-renderer
                  [widget]="child"
                  [selectedId]="selectedId"
                  [parentWidget]="widget"
                  (widgetClick)="bubbleClick($event)">
                </app-widget-renderer>
              }
            } @else {
              <div class="empty-layout">
                <span class="empty-text">Drop widgets here</span>
              </div>
            }
          </div>
        }

        <!-- Icon Widget -->
        @case (WidgetType.ICON) {
          <span class="flutter-icon" [ngStyle]="getIconStyles()">
            @if (widget.properties.icon === 'star') {
              ⭐
            } @else if (widget.properties.icon === 'heart') {
              ❤️
            } @else if (widget.properties.icon === 'home') {
              🏠
            } @else if (widget.properties.icon === 'settings') {
              ⚙️
            } @else if (widget.properties.icon === 'user') {
              👤
            } @else if (widget.properties.icon === 'search') {
              🔍
            } @else if (widget.properties.icon === 'menu') {
              ☰
            } @else if (widget.properties.icon === 'close') {
              ✕
            } @else if (widget.properties.icon === 'check') {
              ✓
            } @else if (widget.properties.icon === 'arrow_back') {
              ←
            } @else if (widget.properties.icon === 'arrow_forward') {
              →
            } @else {
              {{ widget.properties.icon || '?' }}
            }
          </span>
        }

        <!-- ListView Widget -->
        @case (WidgetType.LIST_VIEW) {
          <div
            class="flutter-list-view widget-drop-zone"
            [ngStyle]="getListViewStyles()"
            (dragover)="onDragOver($event)"
            (drop)="onDrop($event)"
            (dragleave)="onDragLeave($event)"
            [class.drop-zone-active]="isDragOver">
            @if (widget.children.length > 0) {
              @for (child of widget.children; track child; let i = $index) {
                <div class="list-item-wrapper">
                  @if (showDropIndicator(i)) {
                    <div class="drop-indicator-horizontal"></div>
                  }
                  <app-widget-renderer
                    [widget]="child"
                    [selectedId]="selectedId"
                    [parentWidget]="widget"
                    (widgetClick)="bubbleClick($event)">
                  </app-widget-renderer>
                </div>
              }
              @if (showDropIndicator(widget.children.length)) {
                <div class="drop-indicator-horizontal"></div>
              }
            } @else {
              <div class="empty-layout">
                <span class="empty-text">Drop list items here</span>
              </div>
            }
          </div>
        }

        <!-- Expanded Widget -->
        @case (WidgetType.EXPANDED) {
          <div
            class="flutter-expanded widget-drop-zone"
            [ngStyle]="getExpandedStyles()"
            (dragover)="onDragOver($event)"
            (drop)="onDrop($event)"
            (dragleave)="onDragLeave($event)"
            [class.drop-zone-active]="isDragOver">
            @if (widget.children.length > 0) {
              @for (child of widget.children; track trackByChild; let i = $index) {
                <app-widget-renderer
                  [widget]="child"
                  [selectedId]="selectedId"
                  [parentWidget]="widget"
                  (widgetClick)="bubbleClick($event)">
                </app-widget-renderer>
              }
            } @else {
              <div class="empty-layout">
                <span class="empty-text">Drop a single child here</span>
              </div>
            }
          </div>
        }

        <!-- TextField Widget -->
        @case (WidgetType.TEXT_FIELD) {
          <input
            type="text"
            class="flutter-text-field"
            [placeholder]="widget.properties.hintText || 'Enter text...'"
            [value]="widget.properties.text || ''"
            [readonly]="true"
            [ngStyle]="getTextFieldStyles()"
            (click)="handleClick($event)">
        }

        <!-- Default/Unknown Widget -->
        @default {
          <div class="p-4 bg-gray-100 border border-gray-300">
            Unknown Widget: {{ widget.type }}
          </div>
        }
      }
    </div>
  `,
  styles: [`
    :host {
      display: contents;
    }

    .widget-hoverable {
      @apply transition-all duration-200 cursor-pointer relative;
    }

    .widget-hoverable:hover:not(.dragging) {
      @apply outline outline-2 outline-blue-300 outline-offset-2;
    }

    .dragging {
      @apply opacity-50 cursor-move;
    }

    /* Prevent text selection while dragging */
    [draggable="true"] {
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;
    }

    [draggable="true"]:not(.dragging) {
      @apply cursor-move;
    }

    .widget-selected {
      @apply outline outline-2 outline-blue-500 outline-offset-2 !important;
    }

    .widget-drop-zone {
      @apply min-h-[20px] relative;
    }

    .drop-zone-active {
      @apply bg-blue-50 border-2 border-dashed border-blue-400 !important;
    }

    .can-accept-children .empty-container,
    .can-accept-children .empty-layout {
      @apply border-2 border-dashed border-gray-300 bg-gray-50 transition-all;
    }

    .can-accept-children .empty-container:hover,
    .can-accept-children .empty-layout:hover {
      @apply border-blue-400 bg-blue-50;
    }

    .empty-container {
      @apply min-h-[60px] min-w-[60px] flex items-center justify-center p-4;
    }

    .empty-layout {
      @apply p-4 flex items-center justify-center min-h-[40px];
    }

    .empty-sized-box {
      @apply border border-dashed border-gray-300 w-full h-full flex items-center justify-center;
    }

    .empty-text {
      @apply text-xs text-gray-400;
    }

    .flutter-column {
      @apply flex flex-col gap-2 min-h-[50px];
    }

    .flutter-row {
      @apply flex flex-row gap-2 min-h-[50px];
    }

    .child-wrapper {
      @apply relative;
    }

    .child-wrapper-horizontal {
      @apply relative flex-shrink-0;
    }

    .drop-indicator {
      @apply absolute -top-1 left-0 right-0 h-0.5 bg-blue-500 opacity-0 transition-opacity;
    }

    .drop-indicator-horizontal {
      @apply absolute -top-1 left-0 right-0 h-0.5 bg-blue-500 opacity-0 transition-opacity;
    }

    .drop-indicator-vertical {
      @apply absolute -left-1 top-0 bottom-0 w-0.5 bg-blue-500 opacity-0 transition-opacity;
    }

    .drop-indicator.show,
    .drop-indicator-horizontal.show,
    .drop-indicator-vertical.show {
      @apply opacity-100;
    }

    .widget-multi-selected {
      @apply outline outline-2 outline-purple-500 outline-offset-2 !important;
    }

    .flutter-card {
      @apply bg-white rounded-lg shadow-md;
      min-height: 80px;
      min-width: 80px;
    }

    .flutter-icon {
      @apply inline-flex items-center justify-center;
      min-width: 24px;
      min-height: 24px;
    }

    .flutter-list-view {
      @apply flex overflow-auto border border-dashed border-gray-300 bg-gray-50;
      min-height: 100px;
    }

    .list-item-wrapper {
      @apply relative;
    }

    .flutter-expanded {
      @apply border border-dashed border-gray-200 bg-gray-50;
      min-height: 50px;
    }

    .flutter-text-field {
      @apply w-full px-3 py-2 border border-gray-300 rounded-md bg-white;
      cursor: pointer; /* Since it's read-only in the builder */
    }

    .flutter-text-field:hover {
      @apply border-blue-400;
    }
  `]
})
export class WidgetRendererComponent implements OnInit, OnChanges {
  @Input() widget!: FlutterWidget;
  @Input() selectedId: string | null = null;
  @Input() parentWidget: FlutterWidget | null = null;
  @Output() widgetClick = new EventEmitter<string>();

  readonly WidgetType = WidgetType;

  canAcceptChildren = false;
  isDropTarget = false;
  dropIndicatorIndex: number | null = null;
  isDragOver = false;
  isDragging = false;

  get isRootWidget(): boolean {
    return !this.parentWidget;
  }

  constructor(
    private canvasState: CanvasStateService,
    private widgetRegistry: WidgetRegistryService,
    private selectionService: SelectionService
  ) {
  }

  ngOnInit() {
    this.updateCanAcceptChildren();

    // DEBUG: Log widget being rendered
    console.log('WidgetRenderer - Rendering widget:', {
      id: this.widget.id,
      type: this.widget.type,
      properties: this.widget.properties,
      childrenCount: this.widget.children?.length || 0,
      parent: this.parentWidget?.id || 'no parent'
    });
  }

  ngOnChanges() {
    this.updateCanAcceptChildren();

    // Check if this widget is the current drop target
    const state = this.canvasState.currentState;
    this.isDropTarget = state.dropTargetId === this.widget.id;
    this.dropIndicatorIndex = this.isDropTarget ? state.dropTargetIndex : null;
  }

  private updateCanAcceptChildren() {
    this.canAcceptChildren = this.widgetRegistry.canAcceptChildren(this.widget.type);
  }

  get isSelected(): boolean {
    return this.widget.id === this.selectedId;
  }

  handleClick(event: MouseEvent) {
    event.stopPropagation();

    // Support multi-select with Ctrl/Cmd key
    const isMultiSelect = event.ctrlKey || event.metaKey;

    if (isMultiSelect) {
      this.selectionService.selectWidget(this.widget.id, true);
    } else {
      this.selectionService.selectWidget(this.widget.id, false);
    }
  }

  // Add method to check if widget is selected
  get isMultiSelected(): boolean {
    return this.selectionService.isSelected(this.widget.id);
  }


  bubbleClick(widgetId: string) {
    this.widgetClick.emit(widgetId);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer!.dropEffect = 'copy';

    // Check if this widget can accept children
    if (this.canAcceptChildren) {
      this.isDragOver = true;
    }
  }

  onDragLeave(event: DragEvent) {
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();

    console.log('WidgetRendererComponent: Drop event on widget:', this.widget.type, 'with id:', this.widget.id);
    this.isDragOver = false;

    try {
      const dataText = event.dataTransfer!.getData('application/json');
      console.log('WidgetRendererComponent: Raw data from dataTransfer:', dataText);

      if (!dataText) {
        console.error('WidgetRendererComponent: No data in dataTransfer');
        return;
      }

      const dragData = JSON.parse(dataText) as DragData;
      console.log('WidgetRendererComponent: Parsed dragData:', dragData);

      // Check max children constraint
      const maxChildren = this.widgetRegistry.getMaxChildren(this.widget.type);
      console.log('WidgetRendererComponent: Max children for', this.widget.type, ':', maxChildren);
      console.log('WidgetRendererComponent: Current children count:', this.widget.children.length);

      if (maxChildren !== undefined && this.widget.children.length >= maxChildren) {
        console.warn('WidgetRendererComponent: Max children reached');
        const notification = (window as any).notificationService;
        if (notification) {
          notification.showWarning(`${this.widget.type} can only have ${maxChildren} child widget(s)`);
        }
        return;
      }

      // Calculate drop index based on mouse position
      const dropIndex = this.calculateDropIndex(event);
      console.log('WidgetRendererComponent: Calculated drop index:', dropIndex);

      if (dragData.type === 'new-widget' && dragData.widgetType) {
        console.log('WidgetRendererComponent: Adding new widget of type:', dragData.widgetType);
        console.log('WidgetRendererComponent: Parent widget id:', this.widget.id);
        console.log('WidgetRendererComponent: Drop index:', dropIndex);

        // Add new widget at calculated position
        this.canvasState.addWidgetAtDropPosition(
          dragData.widgetType,
          this.widget.id,
          dropIndex
        );
      } else if (dragData.type === 'existing-widget' && dragData.widgetId) {
        console.log('WidgetRendererComponent: Moving existing widget:', dragData.widgetId);

        // Check if we're trying to drop a parent into its child
        if (this.isDescendantOf(dragData.widgetId)) {
          console.warn('Cannot drop parent into its own child');
          return;
        }

        // Move existing widget
        this.canvasState.moveWidget(
          dragData.widgetId,
          this.widget.id,
          dropIndex
        );
      } else {
        console.warn('WidgetRenderer Drop Handler: Unhandled drag data type or missing required fields. dragData:', dragData);
      }
    } catch (error) {
      console.error('Error handling drop:', error);
    }
  }

  private calculateDropIndex(event: DragEvent): number {
    // For Row widgets, calculate based on X position
    if (this.widget.type === WidgetType.ROW) {
      const container = event.currentTarget as HTMLElement;
      const children = Array.from(container.querySelectorAll(':scope > .child-wrapper-horizontal'));

      for (let i = 0; i < children.length; i++) {
        const rect = children[i].getBoundingClientRect();
        if (event.clientX < rect.left + rect.width / 2) {
          return i;
        }
      }
      return this.widget.children.length;
    }

    // For Column and other vertical layouts, calculate based on Y position
    const container = event.currentTarget as HTMLElement;
    const children = Array.from(container.querySelectorAll(':scope > .child-wrapper'));

    for (let i = 0; i < children.length; i++) {
      const rect = children[i].getBoundingClientRect();
      if (event.clientY < rect.top + rect.height / 2) {
        return i;
      }
    }

    return this.widget.children.length;
  }

  private isDescendantOf(ancestorId: string): boolean {
    let current = this.parentWidget;
    while (current) {
      if (current.id === ancestorId) {
        return true;
      }
      current = this.canvasState.findWidget(current.parent || '') || null;
    }
    return false;
  }


  onDragStart(event: DragEvent) {
    // Don't start drag if clicking on an empty container
    if ((event.target as HTMLElement).classList.contains('empty-container') ||
      (event.target as HTMLElement).classList.contains('empty-layout')) {
      event.preventDefault();
      return;
    }

    event.stopPropagation();

    // Create drag data for existing widget
    const dragData: DragData = {
      type: 'existing-widget',
      widgetId: this.widget.id,
      sourceData: this.widget
    };

    event.dataTransfer!.effectAllowed = 'move';
    event.dataTransfer!.setData('application/json', JSON.stringify(dragData));

    // Add visual feedback
    this.isDragging = true;
    this.canvasState.setDragging(true);

    // Create a custom drag image
    const dragImage = (event.target as HTMLElement).cloneNode(true) as HTMLElement;
    dragImage.style.opacity = '0.5';
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    document.body.appendChild(dragImage);
    event.dataTransfer!.setDragImage(dragImage, event.offsetX, event.offsetY);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  }

  onDragEnd(event: DragEvent) {
    event.stopPropagation();
    this.isDragging = false;
    this.canvasState.setDragging(false);
  }

  showDropIndicator(index: number): boolean {
    return this.isDropTarget && this.dropIndicatorIndex === index;
  }

  getStackChildPosition(index: number, child: FlutterWidget): any {
    // Position children in a cascade for visibility
    const offset = index * 20;
    return {
      top: `${offset}px`,
      left: `${offset}px`,
      zIndex: index
    };
  }

  getWidgetClasses(): string[] {
    const classes = ['flutter-widget'];

    if (this.widget.type === WidgetType.CONTAINER && this.widget.children.length === 0) {
      classes.push('flutter-container');
    }

    return classes;
  }

  getWidgetStyles(): any {
    const styles: any = {};

    if (!this.widget || !this.widget.properties) {
      return styles;
    }

    const props = this.widget.properties;

    if (props && props.width !== undefined && props.width !== null) {
      styles.width = `${props.width}px`;
    }

    if (props.width !== undefined && props.width !== null) {
      styles.width = `${props.width}px`;
    }
    if (props.height !== undefined && props.height !== null) {
      styles.height = `${props.height}px`;
    }

    if (this.widget.type === WidgetType.CONTAINER) {
      if (props.color) {
        styles.backgroundColor = props.color;
      }
      if (props.padding && typeof props.padding === 'object') {
        styles.padding = `${props.padding.top || 0}px ${props.padding.right || 0}px ${props.padding.bottom || 0}px ${props.padding.left || 0}px`;
      }
      if (props.margin) {
        styles.margin = `${props.margin.top}px ${props.margin.right}px ${props.margin.bottom}px ${props.margin.left}px`;
      }
      if (props.decoration) {
        if (props.decoration.borderRadius) {
          styles.borderRadius = `${props.decoration.borderRadius}px`;
        }
        if (props.decoration.border) {
          styles.border = `${props.decoration.border.width}px ${props.decoration.border.style} ${props.decoration.border.color}`;
        }
        if (props.decoration.boxShadow && props.decoration.boxShadow.length > 0) {
          const shadow = props.decoration.boxShadow[0];
          styles.boxShadow = `${shadow.offsetX}px ${shadow.offsetY}px ${shadow.blurRadius}px ${shadow.spreadRadius}px ${shadow.color}`;
        }
      }

      if (props.alignment) {
        styles.display = 'flex';
        const [vertical, horizontal] = this.parseAlignment(props.alignment);
        styles.justifyContent = horizontal;
        styles.alignItems = vertical;
      }
    }

    return styles;
  }

  getTextStyles(): any {
    const props = this.widget.properties;
    const styles: any = {};

    if (props.fontSize) styles.fontSize = `${props.fontSize}px`;
    if (props.textColor) styles.color = props.textColor;
    if (props.fontWeight) styles.fontWeight = props.fontWeight;
    if (props.fontStyle) styles.fontStyle = props.fontStyle;
    if (props.textAlign) styles.textAlign = props.textAlign;

    return styles;
  }

  getFlexContainerStyles(): any {
    const props = this.widget.properties;
    const styles: any = {};

    if (props.mainAxisAlignment) {
      const justifyMap: Record<MainAxisAlignment, string> = {
        [MainAxisAlignment.START]: 'flex-start',
        [MainAxisAlignment.END]: 'flex-end',
        [MainAxisAlignment.CENTER]: 'center',
        [MainAxisAlignment.SPACE_BETWEEN]: 'space-between',
        [MainAxisAlignment.SPACE_AROUND]: 'space-around',
        [MainAxisAlignment.SPACE_EVENLY]: 'space-evenly',
      };
      styles.justifyContent = justifyMap[props.mainAxisAlignment];
    }

    if (props.crossAxisAlignment) {
      const alignMap: Record<CrossAxisAlignment, string> = {
        [CrossAxisAlignment.START]: 'flex-start',
        [CrossAxisAlignment.END]: 'flex-end',
        [CrossAxisAlignment.CENTER]: 'center',
        [CrossAxisAlignment.STRETCH]: 'stretch',
        [CrossAxisAlignment.BASELINE]: 'baseline',
      };
      styles.alignItems = alignMap[props.crossAxisAlignment];
    }

    return styles;
  }

  getPaddingStyles(): any {
    const props = this.widget.properties;
    const styles: any = {};

    if (props.padding) {
      styles.padding = `${props.padding.top}px ${props.padding.right}px ${props.padding.bottom}px ${props.padding.left}px`;
    }

    return styles;
  }

  getSizedBoxStyles(): any {
    const props = this.widget.properties;
    const styles: any = {};

    if (props.width) styles.width = `${props.width}px`;
    if (props.height) styles.height = `${props.height}px`;

    return styles;
  }

  getAppBarStyles(): any {
    const props = this.widget.properties;
    const styles: any = {};

    if (props.backgroundColor) {
      styles.backgroundColor = props.backgroundColor;
    }
    if (props.elevation) {
      styles.boxShadow = `0 ${props.elevation}px ${props.elevation * 2}px rgba(0,0,0,0.1)`;
    }

    return styles;
  }

  private parseAlignment(alignment: Alignment): [string, string] {
    const alignmentMap: Record<Alignment, [string, string]> = {
      [Alignment.TOP_LEFT]: ['flex-start', 'flex-start'],
      [Alignment.TOP_CENTER]: ['flex-start', 'center'],
      [Alignment.TOP_RIGHT]: ['flex-start', 'flex-end'],
      [Alignment.CENTER_LEFT]: ['center', 'flex-start'],
      [Alignment.CENTER]: ['center', 'center'],
      [Alignment.CENTER_RIGHT]: ['center', 'flex-end'],
      [Alignment.BOTTOM_LEFT]: ['flex-end', 'flex-start'],
      [Alignment.BOTTOM_CENTER]: ['flex-end', 'center'],
      [Alignment.BOTTOM_RIGHT]: ['flex-end', 'flex-end'],
    };
    return alignmentMap[alignment] || ['flex-start', 'flex-start'];
  }

  getCardStyles(): any {
    const props = this.widget.properties;
    const styles: any = {};

    if (props.color) {
      styles.backgroundColor = props.color;
    }

    if (props.elevation) {
      const elevation = Math.min(24, Math.max(0, props.elevation));
      styles.boxShadow = `0 ${elevation}px ${elevation * 2}px rgba(0,0,0,${0.1 + (elevation * 0.01)})`;
    }

    if (props.margin) {
      styles.margin = `${props.margin.top}px ${props.margin.right}px ${props.margin.bottom}px ${props.margin.left}px`;
    }

    if (props.padding) {
      styles.padding = `${props.padding.top}px ${props.padding.right}px ${props.padding.bottom}px ${props.padding.left}px`;
    }

    if (props.borderRadius) {
      styles.borderRadius = `${props.borderRadius}px`;
    }

    return styles;
  }

  getIconStyles(): any {
    const props = this.widget.properties;
    const styles: any = {};

    if (props.size) {
      styles.fontSize = `${props.size}px`;
      styles.width = `${props.size}px`;
      styles.height = `${props.size}px`;
    }

    if (props.color) {
      styles.color = props.color;
    }

    styles.display = 'inline-flex';
    styles.alignItems = 'center';
    styles.justifyContent = 'center';

    return styles;
  }

  getListViewStyles(): any {
    const props = this.widget.properties;
    const styles: any = {};

    if (props.scrollDirection === 'horizontal') {
      styles.flexDirection = 'row';
      styles.overflowX = 'auto';
      styles.overflowY = 'hidden';
    } else {
      styles.flexDirection = 'column';
      styles.overflowY = 'auto';
      styles.overflowX = 'hidden';
    }

    if (props.padding) {
      styles.padding = `${props.padding.top}px ${props.padding.right}px ${props.padding.bottom}px ${props.padding.left}px`;
    }

    if (props.height) {
      styles.height = `${props.height}px`;
    } else {
      styles.maxHeight = '400px'; // Default max height for scrolling
    }

    return styles;
  }

  getExpandedStyles(): any {
    const props = this.widget.properties;
    const styles: any = {};

    const flex = props.flex || 1;
    styles.flex = `${flex} 1 0`;
    styles.minHeight = '50px';

    return styles;
  }

  getTextFieldStyles(): any {
    const props = this.widget.properties;
    const styles: any = {};

    if (props.fontSize) {
      styles.fontSize = `${props.fontSize}px`;
    }

    if (props.color) {
      styles.color = props.color;
    }

    if (props.backgroundColor) {
      styles.backgroundColor = props.backgroundColor;
    }

    if (props.borderColor) {
      styles.borderColor = props.borderColor;
    }

    if (props.borderWidth) {
      styles.borderWidth = `${props.borderWidth}px`;
    }

    if (props.borderRadius) {
      styles.borderRadius = `${props.borderRadius}px`;
    }

    return styles;
  }

  trackByChild(index: number, child: FlutterWidget): string {
    return child?.id || `index-${index}`;
  }

  trackByIndex(index: number): number {
    return index;
  }

}
