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
import {WidgetRegistryService, EnhancedWidgetDefinition} from '../../../../core/services/widget-registry.service';
import {SelectionService} from '../../../../core/services/selection.service';

@Component({
  selector: 'app-widget-renderer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      [attr.data-widget-id]="widget.id"
      [ngClass]="getWidgetClasses()"
      [ngStyle]="applyDynamicStyles(widget.properties)"
      (click)="handleClick($event)"
      [class.widget-selected]="isSelected || isMultiSelected"
      [class.widget-hoverable]="true"
      [class.can-accept-children]="canAcceptChildren"
      [draggable]="!isRootWidget"
      (dragstart)="onDragStart($event)"
      (dragend)="onDragEnd($event)"
      [class.dragging]="isDragging">

      <!-- Dynamic content based on widget definition -->
      @if (isLayoutWidget()) {
        <!-- Layout widgets (Column, Row, Stack, etc.) -->
        <div
          class="widget-drop-zone"
          [ngClass]="getLayoutClasses()"
          [ngStyle]="getLayoutStyles()"
          (dragover)="onDragOver($event)"
          (drop)="onDrop($event)"
          (dragleave)="onDragLeave($event)"
          [class.drop-zone-active]="isDragOver">

          @if (widget.children.length > 0) {
            @for (child of widget.children; track child; let i = $index) {
              <div [ngClass]="getChildWrapperClass()" [ngStyle]="getChildStyles(i, child)">
                @if (showDropIndicator(i)) {
                  <div [ngClass]="getDropIndicatorClass()"></div>
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
              <div [ngClass]="getDropIndicatorClass()"></div>
            }
          } @else {
            <div class="empty-container">
              <span class="empty-text">{{ getEmptyText() }}</span>
            </div>
          }
        </div>
      } @else if (isTextWidget()) {
        <!-- Text widgets -->
        <span [ngStyle]="getTextStyles()">
          {{ widget.properties.text || getDefaultText() }}
        </span>
      } @else if (isInputWidget()) {
        <!-- Input widgets -->
        @switch (widget.type) {
          @case (WidgetType.TEXT_FIELD) {
            <input
              type="text"
              class="flutter-text-field"
              [placeholder]="widget.properties.hintText || 'Enter text...'"
              [value]="widget.properties.text || ''"
              [readonly]="true"
              [ngStyle]="getInputStyles()">
          }
          @case (WidgetType.ELEVATED_BUTTON) {
            <button class="flutter-button elevated" [ngStyle]="getButtonStyles()">
              {{ widget.properties.text || 'Button' }}
            </button>
          }
          @case (WidgetType.TEXT_BUTTON) {
            <button class="flutter-button text" [ngStyle]="getButtonStyles()">
              {{ widget.properties.text || 'Text Button' }}
            </button>
          }
          @case (WidgetType.OUTLINED_BUTTON) {
            <button class="flutter-button outlined" [ngStyle]="getButtonStyles()">
              {{ widget.properties.text || 'Outlined Button' }}
            </button>
          }
          @case (WidgetType.CHECKBOX) {
            <input type="checkbox" [checked]="widget.properties.value" disabled>
          }
          @case (WidgetType.SWITCH) {
            <label class="flutter-switch">
              <input type="checkbox" [checked]="widget.properties.value" disabled>
              <span class="switch-slider"></span>
            </label>
          }
          @case (WidgetType.SLIDER) {
            <input type="range" [value]="widget.properties.value || 0" disabled class="flutter-slider">
          }
          @default {
            <div class="flutter-input-generic">
              {{ widget.type }}
            </div>
          }
        }
      } @else if (isDisplayWidget()) {
        <!-- Display widgets -->
        @switch (widget.type) {
          @case (WidgetType.ICON) {
            <span class="flutter-icon" [ngStyle]="getIconStyles()">
              {{ getIconContent() }}
            </span>
          }
          @case (WidgetType.IMAGE) {
            <img
              [src]="getImageSource()"
              [alt]="widget.properties['alt'] || 'Image'"
              [ngStyle]="getImageStyles()">
          }
          @case (WidgetType.DIVIDER) {
            <hr class="flutter-divider" [ngStyle]="getDividerStyles()">
          }
          @case (WidgetType.CIRCULAR_PROGRESS) {
            <div class="flutter-progress-circular" [ngStyle]="getProgressStyles()">
              <div class="spinner"></div>
            </div>
          }
          @case (WidgetType.LINEAR_PROGRESS) {
            <div class="flutter-progress-linear" [ngStyle]="getProgressStyles()">
              <div class="progress-bar"></div>
            </div>
          }
          @default {
            <div class="flutter-display-generic">
              {{ widget.type }}
            </div>
          }
        }
      } @else if (isContainerWidget()) {
        <!-- Container widgets that can have children -->
        <div
          class="widget-drop-zone"
          [ngStyle]="getContainerStyles()"
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
            <div class="empty-container">
              <span class="empty-text">{{ getEmptyText() }}</span>
            </div>
          }
        </div>
      } @else {
        <!-- Custom/Unknown widgets -->
        <div class="flutter-custom" [ngStyle]="applyDynamicStyles(widget.properties)">
          @if (canAcceptChildren && widget.children.length > 0) {
            @for (child of widget.children; track trackByChild) {
              <app-widget-renderer
                [widget]="child"
                [selectedId]="selectedId"
                [parentWidget]="widget"
                (widgetClick)="bubbleClick($event)">
              </app-widget-renderer>
            }
          } @else {
            <div class="unknown-widget">
              <span class="widget-type-label">{{ widget.type }}</span>
              @if (widget.properties.text) {
                <span class="widget-text-preview">{{ widget.properties.text }}</span>
              }
            </div>
          }
        </div>
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

    .empty-container {
      @apply min-h-[60px] min-w-[60px] flex items-center justify-center p-4;
      @apply border-2 border-dashed border-gray-300 bg-gray-50 transition-all;
    }

    .empty-container:hover {
      @apply border-blue-400 bg-blue-50;
    }

    .empty-text {
      @apply text-xs text-gray-400;
    }

    /* Layout styles */
    .flutter-column {
      @apply flex flex-col gap-2 min-h-[50px];
    }

    .flutter-row {
      @apply flex flex-row gap-2 min-h-[50px];
    }

    .flutter-stack {
      @apply relative min-h-[100px];
    }

    .flutter-wrap {
      @apply flex flex-wrap gap-2 min-h-[50px];
    }

    .child-wrapper {
      @apply relative;
    }

    .child-wrapper-horizontal {
      @apply relative flex-shrink-0;
    }

    .drop-indicator-horizontal {
      @apply absolute -top-1 left-0 right-0 h-0.5 bg-blue-500 opacity-0 transition-opacity;
    }

    .drop-indicator-vertical {
      @apply absolute -left-1 top-0 bottom-0 w-0.5 bg-blue-500 opacity-0 transition-opacity;
    }

    .drop-indicator-horizontal.show,
    .drop-indicator-vertical.show {
      @apply opacity-100;
    }

    /* Input styles */
    .flutter-text-field {
      @apply w-full px-3 py-2 border border-gray-300 rounded-md bg-white;
      cursor: pointer;
    }

    .flutter-button {
      @apply px-4 py-2 rounded transition-colors font-medium;
    }

    .flutter-button.elevated {
      @apply bg-blue-600 text-white hover:bg-blue-700;
    }

    .flutter-button.text {
      @apply text-blue-600 hover:bg-blue-50;
    }

    .flutter-button.outlined {
      @apply border-2 border-blue-600 text-blue-600 hover:bg-blue-50;
    }

    .flutter-switch {
      @apply relative inline-block w-12 h-6;
    }

    .switch-slider {
      @apply absolute inset-0 bg-gray-300 rounded-full transition-colors;
    }

    .flutter-switch input:checked + .switch-slider {
      @apply bg-blue-600;
    }

    .flutter-slider {
      @apply w-full;
    }

    /* Display styles */
    .flutter-icon {
      @apply inline-flex items-center justify-center;
      min-width: 24px;
      min-height: 24px;
    }

    .flutter-divider {
      @apply border-gray-300 my-2;
    }

    .flutter-progress-circular {
      @apply inline-flex items-center justify-center;
    }

    .spinner {
      @apply w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin;
    }

    .flutter-progress-linear {
      @apply w-full h-1 bg-gray-200 rounded overflow-hidden;
    }

    .progress-bar {
      @apply h-full w-1/3 bg-blue-600 animate-pulse;
    }

    /* Custom widget styles */
    .unknown-widget {
      @apply p-4 bg-gray-100 border border-gray-300 rounded;
    }

    .widget-type-label {
      @apply text-sm font-medium text-gray-700;
    }

    .widget-text-preview {
      @apply text-xs text-gray-500 ml-2;
    }

    .widget-multi-selected {
      @apply outline outline-2 outline-purple-500 outline-offset-2 !important;
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
  widgetDefinition: EnhancedWidgetDefinition | undefined;

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
    this.updateWidgetDefinition();
    this.updateCanAcceptChildren();
  }

  ngOnChanges() {
    this.updateWidgetDefinition();
    this.updateCanAcceptChildren();

    const state = this.canvasState.currentState;
    this.isDropTarget = state.dropTargetId === this.widget.id;
    this.dropIndicatorIndex = this.isDropTarget ? state.dropTargetIndex : null;
  }

  private updateWidgetDefinition() {
    this.widgetDefinition = this.widgetRegistry.getWidgetDefinition(this.widget.type);
  }

  private updateCanAcceptChildren() {
    this.canAcceptChildren = this.widgetRegistry.canAcceptChildren(this.widget.type);
  }

  get isSelected(): boolean {
    return this.widget.id === this.selectedId;
  }

  get isMultiSelected(): boolean {
    return this.selectionService.isSelected(this.widget.id);
  }

  // Widget type categorization methods
  isLayoutWidget(): boolean {
    return this.widgetDefinition?.renderType === 'layout' ||
      [WidgetType.COLUMN, WidgetType.ROW, WidgetType.STACK,
        WidgetType.WRAP, WidgetType.LIST_VIEW, WidgetType.GRID_VIEW,
        WidgetType.PADDING, WidgetType.CENTER, WidgetType.SIZED_BOX,
        WidgetType.EXPANDED, WidgetType.FLEXIBLE].includes(this.widget.type);
  }

  isTextWidget(): boolean {
    return this.widgetDefinition?.renderType === 'text' ||
      [WidgetType.TEXT].includes(this.widget.type);
  }

  isInputWidget(): boolean {
    return this.widgetDefinition?.renderType === 'input' ||
      [WidgetType.TEXT_FIELD, WidgetType.TEXT_FORM_FIELD,
        WidgetType.ELEVATED_BUTTON, WidgetType.TEXT_BUTTON, WidgetType.OUTLINED_BUTTON,
        WidgetType.ICON_BUTTON, WidgetType.FAB, WidgetType.CHECKBOX, WidgetType.SWITCH,
        WidgetType.RADIO, WidgetType.SLIDER, WidgetType.DROPDOWN_BUTTON].includes(this.widget.type);
  }

  isDisplayWidget(): boolean {
    return this.widgetDefinition?.renderType === 'display' ||
      [WidgetType.ICON, WidgetType.IMAGE, WidgetType.DIVIDER,
        WidgetType.CIRCULAR_PROGRESS, WidgetType.LINEAR_PROGRESS].includes(this.widget.type);
  }

  isContainerWidget(): boolean {
    return this.widgetDefinition?.renderType === 'container' ||
      [WidgetType.CONTAINER, WidgetType.CARD, WidgetType.SCAFFOLD,
        WidgetType.APP_BAR].includes(this.widget.type);
  }

  // Dynamic style application
  applyDynamicStyles(properties: any): any {
    const styles: any = {};

    // Apply common properties dynamically
    for (const key in properties) {
      const value = properties[key];
      const cssProperty = this.mapFlutterPropertyToCSS(key, value);
      if (cssProperty) {
        Object.assign(styles, cssProperty);
      }
    }

    return styles;
  }

  private mapFlutterPropertyToCSS(key: string, value: any): any {
    const styles: any = {};
    const keyLower = key.toLowerCase();

    // Dimensions
    if (keyLower === 'width' && value !== null && value !== undefined) {
      styles.width = typeof value === 'number' ? `${value}px` : value;
    }
    if (keyLower === 'height' && value !== null && value !== undefined) {
      styles.height = typeof value === 'number' ? `${value}px` : value;
    }

    // Colors
    if (keyLower.includes('color')) {
      if (keyLower === 'color' || keyLower === 'backgroundcolor' || keyLower === 'bgcolor') {
        styles.backgroundColor = value;
      } else if (keyLower === 'textcolor' || keyLower === 'fontcolor') {
        styles.color = value;
      } else if (keyLower === 'bordercolor') {
        styles.borderColor = value;
      }
    }

    // Spacing
    if (keyLower === 'padding' && value) {
      if (typeof value === 'object' && value.top !== undefined) {
        styles.padding = `${value.top || 0}px ${value.right || 0}px ${value.bottom || 0}px ${value.left || 0}px`;
      } else if (typeof value === 'number') {
        styles.padding = `${value}px`;
      }
    }
    if (keyLower === 'margin' && value) {
      if (typeof value === 'object' && value.top !== undefined) {
        styles.margin = `${value.top || 0}px ${value.right || 0}px ${value.bottom || 0}px ${value.left || 0}px`;
      } else if (typeof value === 'number') {
        styles.margin = `${value}px`;
      }
    }

    // Border
    if (keyLower === 'borderradius' && value !== null && value !== undefined) {
      styles.borderRadius = typeof value === 'number' ? `${value}px` : value;
    }
    if (keyLower === 'borderwidth' && value !== null && value !== undefined) {
      styles.borderWidth = typeof value === 'number' ? `${value}px` : value;
      styles.borderStyle = 'solid';
    }

    // Typography
    if (keyLower === 'fontsize' && value !== null && value !== undefined) {
      styles.fontSize = typeof value === 'number' ? `${value}px` : value;
    }
    if (keyLower === 'fontweight') {
      styles.fontWeight = value;
    }
    if (keyLower === 'fontstyle') {
      styles.fontStyle = value;
    }
    if (keyLower === 'textalign') {
      styles.textAlign = value;
    }

    // Effects
    if (keyLower === 'elevation' && value) {
      const shadow = Math.min(24, Math.max(0, value));
      styles.boxShadow = `0 ${shadow}px ${shadow * 2}px rgba(0,0,0,${0.1 + (shadow * 0.01)})`;
    }
    if (keyLower === 'opacity' && value !== null && value !== undefined) {
      styles.opacity = value;
    }

    // Decoration (complex property)
    if (keyLower === 'decoration' && value) {
      if (value.color) styles.backgroundColor = value.color;
      if (value.borderRadius) styles.borderRadius = `${value.borderRadius}px`;
      if (value.border) {
        styles.border = `${value.border.width}px ${value.border.style} ${value.border.color}`;
      }
      if (value.boxShadow && value.boxShadow.length > 0) {
        const shadow = value.boxShadow[0];
        styles.boxShadow = `${shadow.offsetX}px ${shadow.offsetY}px ${shadow.blurRadius}px ${shadow.spreadRadius}px ${shadow.color}`;
      }
    }

    // Alignment
    if (keyLower === 'alignment' && value) {
      styles.display = 'flex';
      const [vertical, horizontal] = this.parseAlignment(value);
      styles.justifyContent = horizontal;
      styles.alignItems = vertical;
    }

    return Object.keys(styles).length > 0 ? styles : null;
  }

  getLayoutClasses(): string {
    const classes = [];
    const type = this.widget.type;

    if (type === WidgetType.COLUMN) classes.push('flutter-column');
    if (type === WidgetType.ROW) classes.push('flutter-row');
    if (type === WidgetType.STACK) classes.push('flutter-stack');
    if (type === WidgetType.WRAP) classes.push('flutter-wrap');
    if (type === WidgetType.LIST_VIEW) classes.push('flutter-list-view');
    if (type === WidgetType.GRID_VIEW) classes.push('flutter-grid-view');

    return classes.join(' ');
  }

  getLayoutStyles(): any {
    const props = this.widget.properties;
    const styles: any = {};

    // Flexbox alignment for Column/Row
    if ([WidgetType.COLUMN, WidgetType.ROW].includes(this.widget.type)) {
      if (props.mainAxisAlignment) {
        const justifyMap: Record<string, string> = {
          'start': 'flex-start',
          'end': 'flex-end',
          'center': 'center',
          'spaceBetween': 'space-between',
          'spaceAround': 'space-around',
          'spaceEvenly': 'space-evenly'
        };
        styles.justifyContent = justifyMap[props.mainAxisAlignment] || 'flex-start';
      }

      if (props.crossAxisAlignment) {
        const alignMap: Record<string, string> = {
          'start': 'flex-start',
          'end': 'flex-end',
          'center': 'center',
          'stretch': 'stretch',
          'baseline': 'baseline'
        };
        styles.alignItems = alignMap[props.crossAxisAlignment] || 'stretch';
      }
    }

    // ListView specific styles
    if (this.widget.type === WidgetType.LIST_VIEW) {
      styles.flexDirection = props.scrollDirection === 'horizontal' ? 'row' : 'column';
      styles.overflow = props.scrollDirection === 'horizontal' ? 'auto hidden' : 'hidden auto';
      styles.maxHeight = props.height ? `${props.height}px` : '400px';
    }

    return {...styles, ...this.applyDynamicStyles(props)};
  }

  getContainerStyles(): any {
    return this.applyDynamicStyles(this.widget.properties);
  }

  getTextStyles(): any {
    const props = this.widget.properties;
    const styles: any = {};

    if (props.fontSize) styles.fontSize = `${props.fontSize}px`;
    if (props.textColor || props.color) styles.color = props.textColor || props.color;
    if (props.fontWeight) styles.fontWeight = props.fontWeight;
    if (props.fontStyle) styles.fontStyle = props.fontStyle;
    if (props.textAlign) styles.textAlign = props.textAlign;

    return styles;
  }

  getInputStyles(): any {
    return this.applyDynamicStyles(this.widget.properties);
  }

  getButtonStyles(): any {
    const styles = this.applyDynamicStyles(this.widget.properties);
    // Add button-specific styles if needed
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
    if (props.color) styles.color = props.color;

    return styles;
  }

  getImageStyles(): any {
    const props = this.widget.properties;
    const styles: any = {};

    if (props.width) styles.width = `${props.width}px`;
    if (props.height) styles.height = `${props.height}px`;
    if (props['fit']) styles.objectFit = props['fit'];

    return styles;
  }

  getDividerStyles(): any {
    const props = this.widget.properties;
    const styles: any = {};

    if (props['thickness']) styles.borderTopWidth = `${props['thickness']}px`;
    if (props.color) styles.borderColor = props.color;
    if (props['indent']) styles.marginLeft = `${props['indent']}px`;
    if (props['endIndent']) styles.marginRight = `${props['endIndent']}px`;

    return styles;
  }

  getProgressStyles(): any {
    const props = this.widget.properties;
    const styles: any = {};

    if (props.color) styles.color = props.color;
    if (props.backgroundColor) styles.backgroundColor = props.backgroundColor;

    return styles;
  }

  getChildWrapperClass(): string {
    if (this.widget.type === WidgetType.ROW) {
      return 'child-wrapper-horizontal';
    }
    return 'child-wrapper';
  }

  getChildStyles(index: number, child: FlutterWidget): any {
    if (this.widget.type === WidgetType.STACK) {
      // Position children in a cascade for visibility in Stack
      const offset = index * 20;
      return {
        position: 'absolute',
        top: `${offset}px`,
        left: `${offset}px`,
        zIndex: index
      };
    }

    // For Expanded/Flexible children in Row/Column
    if ([WidgetType.EXPANDED, WidgetType.FLEXIBLE].includes(child.type)) {
      const flex = child.properties.flex || 1;
      return {flex: `${flex} 1 0`};
    }

    return {};
  }

  getDropIndicatorClass(): string {
    if (this.widget.type === WidgetType.ROW) {
      return 'drop-indicator-vertical';
    }
    return 'drop-indicator-horizontal';
  }

  getEmptyText(): string {
    const emptyTextMap: { [key: string]: string } = {
      [WidgetType.CONTAINER]: 'Drop widgets here',
      [WidgetType.COLUMN]: 'Drop widgets vertically',
      [WidgetType.ROW]: 'Drop widgets horizontally',
      [WidgetType.STACK]: 'Drop widgets to stack',
      [WidgetType.LIST_VIEW]: 'Drop list items here',
      [WidgetType.GRID_VIEW]: 'Drop grid items here',
      [WidgetType.CARD]: 'Drop content here',
      [WidgetType.SCAFFOLD]: 'Drop app content here',
      [WidgetType.PADDING]: 'Drop widget here',
      [WidgetType.CENTER]: 'Drop widget to center',
      [WidgetType.SIZED_BOX]: 'SizedBox'
    };

    return emptyTextMap[this.widget.type] || 'Drop widgets here';
  }

  getDefaultText(): string {
    const textMap: { [key: string]: string } = {
      [WidgetType.TEXT]: 'Text',
      [WidgetType.APP_BAR]: 'AppBar'
    };

    return textMap[this.widget.type] || this.widget.type;
  }

  getIconContent(): string {
    const iconMap: { [key: string]: string } = {
      'star': '⭐',
      'heart': '❤️',
      'home': '🏠',
      'settings': '⚙️',
      'user': '👤',
      'search': '🔍',
      'menu': '☰',
      'close': '✕',
      'check': '✓',
      'arrow_back': '←',
      'arrow_forward': '→',
      'add': '+',
      'remove': '-',
      'edit': '✎',
      'delete': '🗑',
      'share': '↗',
      'favorite': '♥',
      'shopping_cart': '🛒',
      'notifications': '🔔'
    };

    const iconName = this.widget.properties.icon || 'help';
    return iconMap[iconName] || '?';
  }

  private parseAlignment(alignment: string): [string, string] {
    const alignmentMap: Record<string, [string, string]> = {
      'topLeft': ['flex-start', 'flex-start'],
      'topCenter': ['flex-start', 'center'],
      'topRight': ['flex-start', 'flex-end'],
      'centerLeft': ['center', 'flex-start'],
      'center': ['center', 'center'],
      'centerRight': ['center', 'flex-end'],
      'bottomLeft': ['flex-end', 'flex-start'],
      'bottomCenter': ['flex-end', 'center'],
      'bottomRight': ['flex-end', 'flex-end']
    };
    return alignmentMap[alignment] || ['flex-start', 'flex-start'];
  }

  getWidgetClasses(): string[] {
    const classes = ['flutter-widget'];

    if (this.widget.type === WidgetType.CONTAINER && this.widget.children.length === 0) {
      classes.push('flutter-container');
    }

    return classes;
  }

  showDropIndicator(index: number): boolean {
    return this.isDropTarget && this.dropIndicatorIndex === index;
  }

  handleClick(event: MouseEvent) {
    event.stopPropagation();
    const isMultiSelect = event.ctrlKey || event.metaKey;

    if (isMultiSelect) {
      this.selectionService.selectWidget(this.widget.id, true);
    } else {
      this.selectionService.selectWidget(this.widget.id, false);
    }
  }

  bubbleClick(widgetId: string) {
    this.widgetClick.emit(widgetId);
  }

  // Drag and Drop handlers
  onDragStart(event: DragEvent) {
    if ((event.target as HTMLElement).classList.contains('empty-container') ||
      (event.target as HTMLElement).classList.contains('empty-layout')) {
      event.preventDefault();
      return;
    }

    event.stopPropagation();

    const dragData: DragData = {
      type: 'existing-widget',
      widgetId: this.widget.id,
      sourceData: this.widget
    };

    event.dataTransfer!.effectAllowed = 'move';
    event.dataTransfer!.setData('application/json', JSON.stringify(dragData));

    this.isDragging = true;
    this.canvasState.setDragging(true);

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

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer!.dropEffect = 'copy';

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
    this.isDragOver = false;

    try {
      const dataText = event.dataTransfer!.getData('application/json');
      if (!dataText) return;

      const dragData = JSON.parse(dataText) as DragData;

      const maxChildren = this.widgetRegistry.getMaxChildren(this.widget.type);
      if (maxChildren !== undefined && this.widget.children.length >= maxChildren) {
        const notification = (window as any).notificationService;
        if (notification) {
          notification.showWarning(`${this.widget.type} can only have ${maxChildren} child widget(s)`);
        }
        return;
      }

      const dropIndex = this.calculateDropIndex(event);

      if (dragData.type === 'new-widget' && dragData.widgetType) {
        this.canvasState.addWidgetAtDropPosition(
          dragData.widgetType,
          this.widget.id,
          dropIndex
        );
      } else if (dragData.type === 'existing-widget' && dragData.widgetId) {
        if (this.isDescendantOf(dragData.widgetId)) {
          console.warn('Cannot drop parent into its own child');
          return;
        }

        this.canvasState.moveWidget(
          dragData.widgetId,
          this.widget.id,
          dropIndex
        );
      }
    } catch (error) {
      console.error('Error handling drop:', error);
    }
  }

  private calculateDropIndex(event: DragEvent): number {
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

  trackByChild(index: number, child: FlutterWidget): string {
    return child?.id || `index-${index}`;
  }

  getImageSource(): string {
    return this.widget.properties['src'] ||
      'data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27100%27 height=%27100%27%3E%3Crect width=%27100%27 height=%27100%27 fill=%27%23ddd%27/%3E%3Ctext x=%2750%25%27 y=%2750%25%27 text-anchor=%27middle%27 dy=%27.3em%27 fill=%27%23999%27%3EImage%3C/text%3E%3C/svg%3E';
  }
}
