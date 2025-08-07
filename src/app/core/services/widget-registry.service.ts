// src/app/core/services/widget-registry.service.ts

import { Injectable } from '@angular/core';
import {
  WidgetType,
  WidgetDefinition,
  WidgetCategory,
  FlutterWidget,
  MainAxisAlignment,
  CrossAxisAlignment,
  MainAxisSize,
  Alignment,
  createEdgeInsets
} from '../models/flutter-widget.model';
import { v4 as uuidv4 } from 'uuid';

@Injectable({
  providedIn: 'root'
})
export class WidgetRegistryService {
  private widgetDefinitions: Map<WidgetType, WidgetDefinition> = new Map();

  constructor() {
    this.initializeWidgetDefinitions();
  }

  private initializeWidgetDefinitions(): void {
    // Layout Widgets
    this.registerWidget({
      type: WidgetType.CONTAINER,
      displayName: 'Container',
      icon: '□',
      category: WidgetCategory.LAYOUT,
      isContainer: true,
      acceptsChildren: true,
      maxChildren: 1,
      defaultProperties: {
        width: 200,
        height: 200,
        color: '#FFFFFF',
        padding: createEdgeInsets(8),
        alignment: Alignment.TOP_LEFT
      }
    });

    this.registerWidget({
      type: WidgetType.COLUMN,
      displayName: 'Column',
      icon: '⬇',
      category: WidgetCategory.LAYOUT,
      isContainer: true,
      acceptsChildren: true,
      defaultProperties: {
        mainAxisAlignment: MainAxisAlignment.START,
        crossAxisAlignment: CrossAxisAlignment.CENTER,
        mainAxisSize: MainAxisSize.MAX
      }
    });

    this.registerWidget({
      type: WidgetType.ROW,
      displayName: 'Row',
      icon: '➡',
      category: WidgetCategory.LAYOUT,
      isContainer: true,
      acceptsChildren: true,
      defaultProperties: {
        mainAxisAlignment: MainAxisAlignment.START,
        crossAxisAlignment: CrossAxisAlignment.CENTER,
        mainAxisSize: MainAxisSize.MAX
      }
    });

    this.registerWidget({
      type: WidgetType.STACK,
      displayName: 'Stack',
      icon: '⬚',
      category: WidgetCategory.LAYOUT,
      isContainer: true,
      acceptsChildren: true,
      defaultProperties: {
        alignment: Alignment.TOP_LEFT
      }
    });

    this.registerWidget({
      type: WidgetType.PADDING,
      displayName: 'Padding',
      icon: '▫',
      category: WidgetCategory.LAYOUT,
      isContainer: true,
      acceptsChildren: true,
      maxChildren: 1,
      defaultProperties: {
        padding: createEdgeInsets(16)
      }
    });

    this.registerWidget({
      type: WidgetType.CENTER,
      displayName: 'Center',
      icon: '⊕',
      category: WidgetCategory.LAYOUT,
      isContainer: true,
      acceptsChildren: true,
      maxChildren: 1,
      defaultProperties: {}
    });

    this.registerWidget({
      type: WidgetType.SIZED_BOX,
      displayName: 'SizedBox',
      icon: '▭',
      category: WidgetCategory.LAYOUT,
      isContainer: true,
      acceptsChildren: true,
      maxChildren: 1,
      defaultProperties: {
        width: 100,
        height: 100
      }
    });

    // Basic Widgets
    this.registerWidget({
      type: WidgetType.TEXT,
      displayName: 'Text',
      icon: 'T',
      category: WidgetCategory.BASIC,
      isContainer: false,
      acceptsChildren: false,
      defaultProperties: {
        text: 'Hello World',
        fontSize: 16,
        textColor: '#000000'
      }
    });

    // Material Widgets
    this.registerWidget({
      type: WidgetType.SCAFFOLD,
      displayName: 'Scaffold',
      icon: '📱',
      category: WidgetCategory.MATERIAL,
      isContainer: true,
      acceptsChildren: true,
      defaultProperties: {
        color: '#FFFFFF'
      }
    });

    this.registerWidget({
      type: WidgetType.APP_BAR,
      displayName: 'AppBar',
      icon: '━',
      category: WidgetCategory.MATERIAL,
      isContainer: false,
      acceptsChildren: false,
      defaultProperties: {
        title: 'App Title',
        backgroundColor: '#2196F3',
        elevation: 4
      }
    });
  }

  private registerWidget(definition: WidgetDefinition): void {
    this.widgetDefinitions.set(definition.type, definition);
  }

  getWidgetDefinition(type: WidgetType): WidgetDefinition | undefined {
    return this.widgetDefinitions.get(type);
  }

  getAllWidgetDefinitions(): WidgetDefinition[] {
    return Array.from(this.widgetDefinitions.values());
  }

  getWidgetsByCategory(category: WidgetCategory): WidgetDefinition[] {
    return this.getAllWidgetDefinitions().filter(def => def.category === category);
  }

  createWidget(type: WidgetType, properties?: Partial<FlutterWidget['properties']>): FlutterWidget {
    const definition = this.getWidgetDefinition(type);
    if (!definition) {
      throw new Error(`Unknown widget type: ${type}`);
    }

    return {
      id: uuidv4(),
      type,
      properties: { ...definition.defaultProperties, ...properties },
      children: []
    };
  }

  // Create a sample widget tree for Phase 1
  createSampleWidgetTree(): FlutterWidget {
    const scaffold = this.createWidget(WidgetType.SCAFFOLD);

    const column = this.createWidget(WidgetType.COLUMN, {
      mainAxisAlignment: MainAxisAlignment.CENTER,
      crossAxisAlignment: CrossAxisAlignment.CENTER
    });

    const container1 = this.createWidget(WidgetType.CONTAINER, {
      width: 300,
      height: 100,
      color: '#E3F2FD',
      padding: createEdgeInsets(16),
      decoration: {
        borderRadius: 8,
        border: {
          color: '#2196F3',
          width: 2,
          style: 'solid'
        }
      }
    });

    const text1 = this.createWidget(WidgetType.TEXT, {
      text: 'Welcome to Flutter Builder',
      fontSize: 24,
      textColor: '#1976D2'
    });

    const row = this.createWidget(WidgetType.ROW, {
      mainAxisAlignment: MainAxisAlignment.SPACE_AROUND
    });

    const container2 = this.createWidget(WidgetType.CONTAINER, {
      width: 80,
      height: 80,
      color: '#C8E6C9',
      decoration: {
        borderRadius: 40
      }
    });

    const container3 = this.createWidget(WidgetType.CONTAINER, {
      width: 80,
      height: 80,
      color: '#FFCCBC',
      decoration: {
        borderRadius: 8
      }
    });

    const text2 = this.createWidget(WidgetType.TEXT, {
      text: 'Build beautiful UIs',
      fontSize: 18,
      textColor: '#424242'
    });

    // Build the tree structure
    container1.children.push(text1);
    row.children.push(container2, container3);
    column.children.push(container1, row, text2);
    scaffold.children.push(column);

    // Set parent references
    this.updateParentReferences(scaffold);

    return scaffold;
  }

  private updateParentReferences(widget: FlutterWidget, parentId?: string): void {
    if (parentId) {
      widget.parent = parentId;
    }
    widget.children.forEach(child => {
      this.updateParentReferences(child, widget.id);
    });
  }

  isContainer(type: WidgetType): boolean {
    const definition = this.getWidgetDefinition(type);
    return definition?.isContainer || false;
  }

  canAcceptChildren(type: WidgetType): boolean {
    const definition = this.getWidgetDefinition(type);
    return definition?.acceptsChildren || false;
  }

  getMaxChildren(type: WidgetType): number | undefined {
    const definition = this.getWidgetDefinition(type);
    return definition?.maxChildren;
  }
}
