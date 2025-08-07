// src/app/features/builder/components/widget-tree/widget-tree.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { Subject, takeUntil } from 'rxjs';
import {
  FlutterWidget,
  WidgetType
} from '../../../../core/models/flutter-widget.model';
import { CanvasStateService, CanvasState, DragData } from '../../../../core/services/canvas-state.service';
import { WidgetTreeService, TreeNode } from '../../../../core/services/widget-tree.service';
import { WidgetRegistryService } from '../../../../core/services/widget-registry.service';
import { SelectionService } from '../../../../core/services/selection.service';

@Component({
  selector: 'app-widget-tree',
  standalone: true,
  imports: [CommonModule, CdkDrag, CdkDropList],
  template: `
    <div class="widget-tree">
      <div class="tree-header">
        <h3 class="text-sm font-semibold text-gray-700">Widget Tree</h3>
        <div class="tree-actions">
          <button
            class="icon-btn"
            (click)="expandAll()"
            title="Expand All">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>
          <button
            class="icon-btn"
            (click)="collapseAll()"
            title="Collapse All">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 5l7 7-7 7"></path>
            </svg>
          </button>
        </div>
      </div>

      <div class="tree-content">
        @if (treeNodes.length === 0) {
          <div class="empty-tree">
            <svg class="w-12 h-12 text-gray-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
            </svg>
            <p class="text-sm text-gray-500 mt-2">No widgets in tree</p>
            <p class="text-xs text-gray-400 mt-1">Drag widgets from palette to canvas</p>

          </div>
        }

        <div
          class="tree-list"
          cdkDropList
          [cdkDropListData]="'tree'"
          (cdkDropListDropped)="onTreeDrop($event)">

          @for (node of treeNodes; track node.widget.id) {
            <div

              class="tree-node"
              [class.selected]="node.widget.id === selectedWidgetId"
              [style.padding-left.px]="node.level * 20 + 8"
              cdkDrag
              [cdkDragData]="createDragData(node.widget)"
              (click)="selectWidget(node.widget.id, $event)">

              <!-- Expand/Collapse Toggle -->
              @if (node.hasChildren) {
                <button
                  class="expand-toggle"
                  (click)="toggleExpand(node.widget.id, $event)"
                  [class.expanded]="node.expanded">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M9 5l7 7-7 7"></path>
                  </svg>
                </button>
              } @else {
                <span class="expand-spacer"></span>
              }

              <!-- Widget Icon -->
              <span class="widget-icon">
                {{ getWidgetIcon(node.widget.type) }}
              </span>

              <!-- Widget Info -->
              <div class="widget-info">
                <span class="widget-name">{{ node.widget.type }}</span>
                @if (node.widget.properties.text) {
                  <span class="widget-text">"{{ truncateText(node.widget.properties.text) }}"</span>
                }
                @if (node.widget.id === selectedWidgetId) {
                  <span class="selected-badge">selected</span>
                }@if (selectionService.isSelected(node.widget.id)) {
                  <span class="selected-indicator">✓</span>
                }


              </div>

              <!-- Actions -->
              <div class="node-actions">
                @if (node.hasChildren) {
                  <span class="child-count">{{ node.widget.children.length }}</span>
                }
                <button
                  class="delete-btn"
                  (click)="deleteWidget(node.widget.id, $event)"
                  title="Delete Widget">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>

              <!-- Drop Indicator -->
              <div class="drop-indicator" *cdkDragPlaceholder></div>
            </div>
          }
        </div>
      </div>

      <div class="tree-footer">
        <div class="tree-stats">
          <span class="stat-item">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
            </svg>
            {{ treeStats.total }} widgets
          </span>
          <span class="stat-item">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
            </svg>
            Depth: {{ treeStats.maxDepth }}
          </span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .widget-tree {
      @apply h-full flex flex-col bg-white;
    }

    .tree-header {
      @apply flex items-center justify-between px-4 py-3 border-b border-gray-200;
    }

    .tree-actions {
      @apply flex items-center gap-1;
    }

    .icon-btn {
      @apply p-1 rounded hover:bg-gray-100 transition-colors text-gray-600;
    }

    .tree-content {
      @apply flex-1 overflow-y-auto;
    }

    .empty-tree {
      @apply py-12 text-center;
    }

    .tree-list {
      @apply py-2;
    }

    .tree-node {
      @apply flex items-center gap-2 py-1.5 px-2 hover:bg-gray-50 cursor-pointer transition-colors relative;
    }

    .tree-node.selected {
      @apply bg-blue-50 hover:bg-blue-100;
    }

    .tree-node.cdk-drag-preview {
      @apply bg-blue-100 rounded shadow-lg opacity-90;
    }

    .expand-toggle {
      @apply p-0.5 rounded hover:bg-gray-200 transition-all text-gray-500;
    }

    .expand-toggle.expanded {
      @apply rotate-90;
    }

    .expand-spacer {
      @apply w-4;
    }

    .widget-icon {
      @apply text-sm font-bold text-blue-600 w-5 text-center;
    }

    .widget-info {
      @apply flex-1 flex items-center gap-2;
    }

    .widget-name {
      @apply text-sm font-medium text-gray-800;
    }

    .widget-text {
      @apply text-xs text-gray-500 italic;
    }

    .selected-badge {
      @apply text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded;
    }

    .node-actions {
      @apply flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity;
    }

    .tree-node:hover .node-actions {
      @apply opacity-100;
    }

    .child-count {
      @apply text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full;
    }

    .delete-btn {
      @apply p-1 rounded hover:bg-red-100 text-red-500 transition-colors;
    }

    .drop-indicator {
      @apply h-0.5 bg-blue-500 absolute left-0 right-0;
    }

    .tree-footer {
      @apply px-4 py-2 border-t border-gray-200 bg-gray-50;
    }

    .tree-stats {
      @apply flex items-center gap-4;
    }

    .stat-item {
      @apply flex items-center gap-1 text-xs text-gray-600;
    }

    /* CDK Drag styles */
    .cdk-drag-placeholder {
      @apply opacity-40;
    }

    .cdk-drop-list-dragging .tree-node:not(.cdk-drag-placeholder) {
      @apply transition-transform;
    }

    .cdk-drag-animating {
    @apply transition-transform duration-200;
    }
  `]
})
export class WidgetTreeComponent implements OnInit, OnDestroy {
  treeNodes: TreeNode[] = [];
  expandedIds = new Set<string>();
  selectedWidgetId: string | null = null;
  treeStats = { total: 0, maxDepth: 0 };

  private destroy$ = new Subject<void>();
  private rootWidget: FlutterWidget | null = null;

  constructor(
    private canvasState: CanvasStateService,
    private treeService: WidgetTreeService,
    private widgetRegistry: WidgetRegistryService,
    private selectionService: SelectionService

  ) {}

  ngOnInit() {
    // Subscribe to canvas state changes
    this.canvasState.state$
      .pipe(takeUntil(this.destroy$))
      .subscribe((state: CanvasState) => {
        this.rootWidget = state.rootWidget;
        this.selectedWidgetId = state.selectedWidgetId;
        this.updateTree();
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateTree() {
    if (!this.rootWidget) {
      this.treeNodes = [];
      this.treeStats = { total: 0, maxDepth: 0 };
      return;
    }

    // Preserve expanded state or expand first two levels by default
    if (this.expandedIds.size === 0) {
      this.expandFirstTwoLevels(this.rootWidget);
    }

    // Build tree nodes
    this.treeNodes = this.treeService.buildTreeNodes(this.rootWidget, this.expandedIds);

    // Update statistics
    this.treeStats = this.treeService.getTreeStatistics(this.rootWidget);
  }

  private expandFirstTwoLevels(widget: FlutterWidget, level: number = 0) {
    if (level < 2) {
      this.expandedIds.add(widget.id);
      widget.children.forEach(child => {
        this.expandFirstTwoLevels(child, level + 1);
      });
    }
  }

  toggleExpand(widgetId: string, event: Event) {
    event.stopPropagation();

    if (this.expandedIds.has(widgetId)) {
      this.expandedIds.delete(widgetId);
    } else {
      this.expandedIds.add(widgetId);
    }

    this.updateTree();
  }

  expandAll() {
    const addAllIds = (widget: FlutterWidget) => {
      this.expandedIds.add(widget.id);
      widget.children.forEach(child => addAllIds(child));
    };

    if (this.rootWidget) {
      addAllIds(this.rootWidget);
      this.updateTree();
    }
  }

  collapseAll() {
    this.expandedIds.clear();
    this.updateTree();
  }

  selectWidget(widgetId: string, event?: MouseEvent) {
    const isMultiSelect = event && (event.ctrlKey || event.metaKey);
    this.selectionService.selectWidget(widgetId, isMultiSelect);
  }
  deleteWidget(widgetId: string, event: Event) {
    event.stopPropagation();

    if (confirm('Are you sure you want to delete this widget and all its children?')) {
      this.canvasState.removeWidget(widgetId);
    }
  }

  getWidgetIcon(type: WidgetType): string {
    const definition = this.widgetRegistry.getWidgetDefinition(type);
    return definition?.icon || '?';
  }

  truncateText(text: string, maxLength: number = 20): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  createDragData(widget: FlutterWidget): DragData {
    return {
      type: 'existing-widget',
      widgetId: widget.id,
      sourceData: widget
    };
  }

  onTreeDrop(event: CdkDragDrop<any>) {
    // Handle reordering within the tree
    const dragData = event.item.data as DragData;

    if (dragData.type === 'existing-widget' && dragData.widgetId) {
      // For Phase 3, implement basic reordering
      console.log('Tree reorder:', event.previousIndex, event.currentIndex);

      // Get the parent widget (for now, assume same parent)
      // Full implementation would determine the actual parent based on drop position
      if (this.rootWidget && event.previousIndex !== event.currentIndex) {
        const updatedRoot = this.treeService.reorderChildren(
          this.rootWidget,
          this.rootWidget.id,
          event.previousIndex,
          event.currentIndex
        );

        if (updatedRoot) {
          this.canvasState.updateState({ rootWidget: updatedRoot });
        }
      }
    }
  }
}
