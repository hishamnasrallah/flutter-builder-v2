// src/app/features/builder/components/widget-renderer/widget-renderer.component.ts

import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDropList, CdkDragDrop } from '@angular/cdk/drag-drop';
import {
  FlutterWidget,
  WidgetType,
  MainAxisAlignment,
  CrossAxisAlignment,
  Alignment
} from '../../../../core/models/flutter-widget.model';
import { CanvasStateService, DragData } from '../../../../core/services/canvas-state.service';
import { WidgetRegistryService } from '../../../../core/services/widget-registry.service';

@Component({
  selector: 'app-widget-renderer',
  standalone: true,
  imports: [CommonModule, CdkDropList],
  template: `
    <div
      [ngClass]="getWidgetClasses()"
      [ngStyle]="getWidgetStyles()"
      (click)="handleClick($event)"
      [class.widget-selected]="isSelected"
      [class.widget-hoverable]="true"
      [class.can-accept-children]="canAcceptChildren">

      @switch (widget.type) {
        <!-- Container Widget -->
        @case (WidgetType.CONTAINER) {
          <div
            class="widget-drop-zone"
            cdkDropList
            [cdkDropListData]="widget"
            [id]="'drop-' + widget.id"
            (cdkDropListDropped)="onDrop($event)"
            [cdkDropListEnterPredicate]="canDropPredicate"
            [class.drop-zone-active]="isDropTarget">

            @if (widget.children.length > 0) {
              @for (child of widget.children; track child.id; let i = $index) {
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
            cdkDropList
            [cdkDropListData]="widget"
            [id]="'drop-' + widget.id"
            [cdkDropListOrientation]="'vertical'"
            (cdkDropListDropped)="onDrop($event)"
            [cdkDropListEnterPredicate]="canDropPredicate"
            [class.drop-zone-active]="isDropTarget">

            @if (widget.children.length > 0) {
              @for (child of widget.children; track child.id; let i = $index) {
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
            cdkDropList
            [cdkDropListData]="widget"
            [id]="'drop-' + widget.id"
            [cdkDropListOrientation]="'horizontal'"
            (cdkDropListDropped)="onDrop($event)"
            [cdkDropListEnterPredicate]="canDropPredicate"
            [class.drop-zone-active]="isDropTarget">

            @if (widget.children.length > 0) {
              @for (child of widget.children; track child.id; let i = $index) {
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
            cdkDropList
            [cdkDropListData]="widget"
            [id]="'drop-' + widget.id"
            (cdkDropListDropped)="onDrop($event)"
            [cdkDropListEnterPredicate]="canDropPredicate"
            [class.drop-zone-active]="isDropTarget">

            @if (widget.children.length > 0) {
              @for (child of widget.children; track child.id) {
                <div class="absolute" [ngStyle]="getStackChildPosition($index, child)">
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
            cdkDropList
            [cdkDropListData]="widget"
            [id]="'drop-' + widget.id"
            (cdkDropListDropped)="onDrop($event)"
            [cdkDropListEnterPredicate]="canDropPredicate"
            [class.drop-zone-active]="isDropTarget">

            @if (widget.children.length > 0) {
              @for (child of widget.children; track child.id) {
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
            cdkDropList
            [cdkDropListData]="widget"
            [id]="'drop-' + widget.id"
            (cdkDropListDropped)="onDrop($event)"
            [cdkDropListEnterPredicate]="canDropPredicate"
            [class.drop-zone-active]="isDropTarget">

            @if (widget.children.length > 0) {
              @for (child of widget.children; track child.id) {
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
            cdkDropList
            [cdkDropListData]="widget"
            [id]="'drop-' + widget.id"
            (cdkDropListDropped)="onDrop($event)"
            [cdkDropListEnterPredicate]="canDropPredicate"
            [class.drop-zone-active]="isDropTarget">

            @if (widget.children.length > 0) {
              @for (child of widget.children; track child.id) {
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
            cdkDropList
            [cdkDropListData]="widget"
            [id]="'drop-' + widget.id"
            (cdkDropListDropped)="onDrop($event)"
            [cdkDropListEnterPredicate]="canDropPredicate"
            [class.drop-zone-active]="isDropTarget">

            @for (child of widget.children; track child.id) {
              <app-widget-renderer
                [widget]="child"
                [selectedId]="selectedId"
                [parentWidget]="widget"
                (widgetClick)="bubbleClick($event)">
              </app-widget-renderer>
            }
          </div>
        }

        <!-- AppBar Widget -->
        @case (WidgetType.APP_BAR) {
          <div class="w-full h-14 flex items-center px-4" [ngStyle]="getAppBarStyles()">
            <span class="text-white text-lg font-medium">{{ widget.properties.title || 'AppBar' }}</span>
          </div>
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

    .widget-hoverable:hover {
      @apply outline outline-2 outline-blue-300 outline-offset-2;
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

    /* CDK Drop List styles */
    .cdk-drop-list-dragging {
      @apply cursor-move;
    }

    .cdk-drag-placeholder {
      @apply opacity-50;
    }

    .cdk-drag-animating {
    @apply transition-transform duration-200;
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

  constructor(
    private canvasState: CanvasStateService,
    private widgetRegistry: WidgetRegistryService
  ) {}

  ngOnInit() {
    this.updateCanAcceptChildren();
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
    this.widgetClick.emit(this.widget.id);
  }

  bubbleClick(widgetId: string) {
    this.widgetClick.emit(widgetId);
  }

  canDropPredicate = (drag: any): boolean => {
    const dragData = drag.data as DragData;
    return this.canvasState.canDropWidget(dragData, this.widget.id, this.widget);
  }

  onDrop(event: CdkDragDrop<any>) {
  // Remove the stopPropagation line - it's not needed
  const dragData = event.item.data as DragData;
  const dropWidget = event.container.data as FlutterWidget;

  console.log('Drop event:', dragData, 'on', dropWidget.type);

  // Calculate drop index based on position
  const dropIndex = event.currentIndex || dropWidget.children.length;

  if (dragData.type === 'new-widget' && dragData.widgetType) {
    // Add new widget
    this.canvasState.addWidgetAtDropPosition(
      dragData.widgetType,
      dropWidget.id,
      dropIndex
    );
  } else if (dragData.type === 'existing-widget' && dragData.widgetId) {
    // Move existing widget
    this.canvasState.moveWidget(
      dragData.widgetId,
      dropWidget.id,
      dropIndex
    );
  }
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

  // ... Rest of the styling methods remain the same ...

  getWidgetClasses(): string[] {
    const classes = ['flutter-widget'];

    if (this.widget.type === WidgetType.CONTAINER && this.widget.children.length === 0) {
      classes.push('flutter-container');
    }

    return classes;
  }

  getWidgetStyles(): any {
    const styles: any = {};
    const props = this.widget.properties;

    if (props.width) {
      styles.width = `${props.width}px`;
    }
    if (props.height) {
      styles.height = `${props.height}px`;
    }

    if (this.widget.type === WidgetType.CONTAINER) {
      if (props.color) {
        styles.backgroundColor = props.color;
      }
      if (props.padding) {
        styles.padding = `${props.padding.top}px ${props.padding.right}px ${props.padding.bottom}px ${props.padding.left}px`;
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
}
