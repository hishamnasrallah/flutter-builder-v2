// src/app/core/services/widget-tree.service.ts

import { Injectable } from '@angular/core';
import {
  FlutterWidget,
  WidgetType
} from '../models/flutter-widget.model';
import { WidgetRegistryService } from './widget-registry.service';
import { v4 as uuidv4 } from 'uuid';

export interface TreeNode {
  widget: FlutterWidget;
  expanded: boolean;
  level: number;
  hasChildren: boolean;
  path: string[];
}

export interface TreeOperations {
  addWidget(widget: FlutterWidget, parentId: string, index?: number): void;
  removeWidget(widgetId: string): void;
  moveWidget(widgetId: string, newParentId: string, index: number): void;
  canAcceptChild(parentType: WidgetType, childType: WidgetType): boolean;
  findWidget(widgetId: string): FlutterWidget | null;
  getWidgetPath(widgetId: string): string[];
}

export interface DropZoneInfo {
  parentId: string;
  index: number;
  canDrop: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class WidgetTreeService {

  constructor(private widgetRegistry: WidgetRegistryService) {}

  /**
   * Add a widget to the tree at specified parent and index
   */
  addWidget(
    root: FlutterWidget | null,
    newWidget: FlutterWidget,
    parentId: string | null,
    index?: number
  ): FlutterWidget | null {
    // If no root and no parent specified, make this the root
    if (!root && !parentId) {
      return newWidget;
    }

    // If trying to add to root level but root exists
    if (!parentId && root) {
      // Check if root can accept children
      if (this.canAcceptChild(root.type, newWidget.type)) {
        const updatedRoot = this.deepClone(root);
        newWidget.parent = updatedRoot.id;

        if (index !== undefined && index >= 0) {
          updatedRoot.children.splice(index, 0, newWidget);
        } else {
          updatedRoot.children.push(newWidget);
        }
        return updatedRoot;
      }
      return root;
    }

    // Add to specific parent
    if (root && parentId) {
      const updatedRoot = this.deepClone(root);
      const parent = this.findWidgetInTree(updatedRoot, parentId);

      if (parent && this.canAcceptChild(parent.type, newWidget.type)) {
        // Check max children constraint
        const maxChildren = this.widgetRegistry.getMaxChildren(parent.type);
        if (maxChildren !== undefined && parent.children.length >= maxChildren) {
          console.warn(`Parent widget ${parent.type} already has maximum children (${maxChildren})`);
          return root;
        }

        newWidget.parent = parent.id;

        if (index !== undefined && index >= 0) {
          parent.children.splice(index, 0, newWidget);
        } else {
          parent.children.push(newWidget);
        }
        return updatedRoot;
      }
    }

    return root;
  }

  /**
   * Remove a widget from the tree
   */
  removeWidget(root: FlutterWidget | null, widgetId: string): FlutterWidget | null {
    if (!root) return null;

    // Cannot remove root widget
    if (root.id === widgetId) {
      return null;
    }

    const updatedRoot = this.deepClone(root);
    this.removeWidgetFromTree(updatedRoot, widgetId);
    return updatedRoot;
  }

  /**
   * Move a widget to a new parent and position
   */
  moveWidget(
    root: FlutterWidget | null,
    widgetId: string,
    newParentId: string | null,
    index: number
  ): FlutterWidget | null {
    if (!root || root.id === widgetId) return root;

    // Find the widget to move
    const widgetToMove = this.findWidgetInTree(root, widgetId);
    if (!widgetToMove) return root;

    // Check if we can move to the new parent
    if (newParentId) {
      const newParent = this.findWidgetInTree(root, newParentId);
      if (!newParent || !this.canAcceptChild(newParent.type, widgetToMove.type)) {
        return root;
      }

      // Prevent moving a widget into its own descendant
      if (this.isDescendant(widgetToMove, newParentId)) {
        console.warn('Cannot move widget into its own descendant');
        return root;
      }
    }

    // Clone the tree and perform the move
    const updatedRoot = this.deepClone(root);

    // Remove widget from current position
    const widgetCopy = this.deepClone(widgetToMove);
    this.removeWidgetFromTree(updatedRoot, widgetId);

    // Add to new position
    if (newParentId) {
      const newParent = this.findWidgetInTree(updatedRoot, newParentId);
      if (newParent) {
        widgetCopy.parent = newParentId;
        newParent.children.splice(index, 0, widgetCopy);
      }
    } else {
      // Moving to root level - not supported in Flutter structure
      console.warn('Cannot move widget to root level when root already exists');
      return root;
    }

    return updatedRoot;
  }

  /**
   * Reorder children within the same parent
   */
  reorderChildren(
    root: FlutterWidget | null,
    parentId: string,
    oldIndex: number,
    newIndex: number
  ): FlutterWidget | null {
    if (!root) return null;

    const updatedRoot = this.deepClone(root);
    const parent = parentId ? this.findWidgetInTree(updatedRoot, parentId) : updatedRoot;

    if (parent && parent.children.length > oldIndex) {
      const [movedWidget] = parent.children.splice(oldIndex, 1);
      parent.children.splice(newIndex, 0, movedWidget);
    }

    return updatedRoot;
  }

  /**
   * Check if a parent type can accept a child type
   */
  canAcceptChild(parentType: WidgetType, childType: WidgetType): boolean {
    const parentDef = this.widgetRegistry.getWidgetDefinition(parentType);
    if (!parentDef || !parentDef.acceptsChildren) {
      return false;
    }

    // Add specific rules for widget combinations
    const rules = this.getWidgetCombinationRules();
    const rule = rules.get(parentType);

    if (rule) {
      if (rule.allowedChildren && !rule.allowedChildren.includes(childType)) {
        return false;
      }
      if (rule.disallowedChildren && rule.disallowedChildren.includes(childType)) {
        return false;
      }
    }

    // Special case: AppBar can only be in Scaffold
    if (childType === WidgetType.APP_BAR && parentType !== WidgetType.SCAFFOLD) {
      return false;
    }

    return true;
  }

  /**
   * Find a widget by ID in the tree
   */
  findWidgetInTree(root: FlutterWidget | null, widgetId: string): FlutterWidget | null {
    if (!root) return null;
    if (root.id === widgetId) return root;

    for (const child of root.children) {
      const found = this.findWidgetInTree(child, widgetId);
      if (found) return found;
    }

    return null;
  }

  /**
   * Get the path from root to a widget
   */
  getWidgetPath(root: FlutterWidget | null, widgetId: string): string[] {
    if (!root) return [];

    const path: string[] = [];

    const findPath = (widget: FlutterWidget, targetId: string, currentPath: string[]): boolean => {
      if (widget.id === targetId) {
        path.push(...currentPath, widget.id);
        return true;
      }

      for (const child of widget.children) {
        if (findPath(child, targetId, [...currentPath, widget.id])) {
          return true;
        }
      }

      return false;
    };

    findPath(root, widgetId, []);
    return path;
  }

  /**
   * Build a flat tree structure for display
   */
  buildTreeNodes(root: FlutterWidget | null, expandedIds: Set<string>): TreeNode[] {
    if (!root) return [];

    const nodes: TreeNode[] = [];

    const buildNodes = (widget: FlutterWidget, level: number, path: string[]) => {
      const node: TreeNode = {
        widget,
        expanded: expandedIds.has(widget.id),
        level,
        hasChildren: widget.children.length > 0,
        path: [...path, widget.id]
      };

      nodes.push(node);

      if (node.expanded && widget.children.length > 0) {
        widget.children.forEach(child => {
          buildNodes(child, level + 1, node.path);
        });
      }
    };

    buildNodes(root, 0, []);
    return nodes;
  }

  /**
   * Get valid drop zones for a widget type
   */
  getValidDropZones(root: FlutterWidget | null, draggedType: WidgetType): DropZoneInfo[] {
    if (!root) return [];

    const dropZones: DropZoneInfo[] = [];

    const findDropZones = (widget: FlutterWidget) => {
      if (this.canAcceptChild(widget.type, draggedType)) {
        // Add drop zones between children and at the end
        for (let i = 0; i <= widget.children.length; i++) {
          dropZones.push({
            parentId: widget.id,
            index: i,
            canDrop: true
          });
        }
      }

      // Recursively check children
      widget.children.forEach(child => findDropZones(child));
    };

    findDropZones(root);
    return dropZones;
  }

  /**
   * Check if a widget contains another widget as descendant
   */
  private isDescendant(widget: FlutterWidget, descendantId: string): boolean {
    if (widget.id === descendantId) return true;

    for (const child of widget.children) {
      if (this.isDescendant(child, descendantId)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Remove a widget from the tree recursively
   */
  private removeWidgetFromTree(parent: FlutterWidget, widgetId: string): boolean {
    const index = parent.children.findIndex(child => child.id === widgetId);

    if (index !== -1) {
      parent.children.splice(index, 1);
      return true;
    }

    for (const child of parent.children) {
      if (this.removeWidgetFromTree(child, widgetId)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Deep clone a widget tree
   */
  private deepClone(widget: FlutterWidget): FlutterWidget {
    return {
      ...widget,
      properties: { ...widget.properties },
      children: widget.children.map(child => this.deepClone(child))
    };
  }

  /**
   * Get widget combination rules
   */
  private getWidgetCombinationRules(): Map<WidgetType, { allowedChildren?: WidgetType[], disallowedChildren?: WidgetType[] }> {
    return new Map([
      [WidgetType.SCAFFOLD, {
        disallowedChildren: [WidgetType.SCAFFOLD] // No nested Scaffolds
      }],
      [WidgetType.APP_BAR, {
        allowedChildren: [] // AppBar typically doesn't accept children in this simplified version
      }],
      [WidgetType.PADDING, {
        disallowedChildren: [WidgetType.SCAFFOLD, WidgetType.APP_BAR]
      }],
      [WidgetType.CENTER, {
        disallowedChildren: [WidgetType.SCAFFOLD, WidgetType.APP_BAR]
      }],
      [WidgetType.SIZED_BOX, {
        disallowedChildren: [WidgetType.SCAFFOLD, WidgetType.APP_BAR]
      }]
    ]);
  }

  /**
   * Count total widgets in tree
   */
  countWidgets(widget: FlutterWidget | null): number {
    if (!widget) return 0;

    let count = 1;
    for (const child of widget.children) {
      count += this.countWidgets(child);
    }
    return count;
  }

  /**
   * Get widget statistics
   */
  getTreeStatistics(root: FlutterWidget | null): { total: number, byType: Map<WidgetType, number>, maxDepth: number } {
    const stats = {
      total: 0,
      byType: new Map<WidgetType, number>(),
      maxDepth: 0
    };

    if (!root) return stats;

    const analyze = (widget: FlutterWidget, depth: number) => {
      stats.total++;
      stats.maxDepth = Math.max(stats.maxDepth, depth);

      const count = stats.byType.get(widget.type) || 0;
      stats.byType.set(widget.type, count + 1);

      widget.children.forEach(child => analyze(child, depth + 1));
    };

    analyze(root, 1);
    return stats;
  }
}
