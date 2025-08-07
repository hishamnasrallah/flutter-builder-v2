// src/app/core/services/property-editor.service.ts

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {
  FlutterWidget,
  WidgetType,
  WidgetProperties,
  Alignment,
  MainAxisAlignment,
  CrossAxisAlignment,
  MainAxisSize,
  FontWeight,
  FontStyle,
  TextAlign
} from '../models/flutter-widget.model';
import { CanvasStateService } from './canvas-state.service';
import { WidgetTreeService } from './widget-tree.service';
import { NotificationService } from './notification.service';

export interface PropertyDefinition {
  key: string;
  label: string;
  type: 'text' | 'number' | 'color' | 'select' | 'spacing' | 'boolean' | 'alignment';
  category: string;
  defaultValue: any;
  options?: { label: string; value: any }[];
  validation?: ValidationRule[];
  dependsOn?: string[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

export interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'pattern' | 'custom';
  value?: any;
  message: string;
  validator?: (value: any) => boolean;
}

export interface PropertyCategory {
  name: string;
  icon: string;
  properties: PropertyDefinition[];
  expanded: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PropertyEditorService {
  private propertySchemas = new Map<WidgetType, PropertyDefinition[]>();
  private currentWidgetSubject = new BehaviorSubject<FlutterWidget | null>(null);
  public currentWidget$ = this.currentWidgetSubject.asObservable();

  constructor(
    private canvasState: CanvasStateService,
    private treeService: WidgetTreeService,
    private notification: NotificationService
  ) {
    this.initializePropertySchemas();
    this.subscribeToSelection();
  }

  private subscribeToSelection() {
    this.canvasState.getSelectedWidget$().subscribe(widget => {
      this.currentWidgetSubject.next(widget);
    });
  }

  private initializePropertySchemas() {
    // Container Properties
    this.propertySchemas.set(WidgetType.CONTAINER, [
      // Layout Category
      {
        key: 'width',
        label: 'Width',
        type: 'number',
        category: 'Layout',
        defaultValue: 200,
        min: 0,
        max: 1000,
        step: 10,
        unit: 'px',
        validation: [
          { type: 'min', value: 0, message: 'Width must be positive' }
        ]
      },
      {
        key: 'height',
        label: 'Height',
        type: 'number',
        category: 'Layout',
        defaultValue: 200,
        min: 0,
        max: 1000,
        step: 10,
        unit: 'px',
        validation: [
          { type: 'min', value: 0, message: 'Height must be positive' }
        ]
      },
      {
        key: 'alignment',
        label: 'Alignment',
        type: 'alignment',
        category: 'Layout',
        defaultValue: Alignment.TOP_LEFT,
        options: Object.entries(Alignment).map(([key, value]) => ({
          label: key.replace(/_/g, ' ').toLowerCase(),
          value
        }))
      },
      // Spacing Category
      {
        key: 'padding',
        label: 'Padding',
        type: 'spacing',
        category: 'Spacing',
        defaultValue: { top: 8, right: 8, bottom: 8, left: 8 }
      },
      {
        key: 'margin',
        label: 'Margin',
        type: 'spacing',
        category: 'Spacing',
        defaultValue: { top: 0, right: 0, bottom: 0, left: 0 }
      },
      // Appearance Category
      {
        key: 'color',
        label: 'Background Color',
        type: 'color',
        category: 'Appearance',
        defaultValue: '#FFFFFF'
      },
      {
        key: 'decoration.borderRadius',
        label: 'Border Radius',
        type: 'number',
        category: 'Appearance',
        defaultValue: 0,
        min: 0,
        max: 100,
        step: 1,
        unit: 'px'
      },
      {
        key: 'decoration.border.width',
        label: 'Border Width',
        type: 'number',
        category: 'Appearance',
        defaultValue: 0,
        min: 0,
        max: 20,
        step: 1,
        unit: 'px'
      },
      {
        key: 'decoration.border.color',
        label: 'Border Color',
        type: 'color',
        category: 'Appearance',
        defaultValue: '#000000',
        dependsOn: ['decoration.border.width']
      }
    ]);

    // Text Properties
    this.propertySchemas.set(WidgetType.TEXT, [
      {
        key: 'text',
        label: 'Text Content',
        type: 'text',
        category: 'Content',
        defaultValue: 'Hello World',
        validation: [
          { type: 'required', message: 'Text cannot be empty' }
        ]
      },
      {
        key: 'fontSize',
        label: 'Font Size',
        type: 'number',
        category: 'Typography',
        defaultValue: 16,
        min: 8,
        max: 72,
        step: 1,
        unit: 'px'
      },
      {
        key: 'textColor',
        label: 'Text Color',
        type: 'color',
        category: 'Typography',
        defaultValue: '#000000'
      },
      {
        key: 'fontWeight',
        label: 'Font Weight',
        type: 'select',
        category: 'Typography',
        defaultValue: FontWeight.W400,
        options: [
          { label: 'Thin (100)', value: FontWeight.W100 },
          { label: 'Light (300)', value: FontWeight.W300 },
          { label: 'Normal (400)', value: FontWeight.W400 },
          { label: 'Medium (500)', value: FontWeight.W500 },
          { label: 'Bold (700)', value: FontWeight.W700 },
          { label: 'Black (900)', value: FontWeight.W900 }
        ]
      },
      {
        key: 'fontStyle',
        label: 'Font Style',
        type: 'select',
        category: 'Typography',
        defaultValue: FontStyle.NORMAL,
        options: [
          { label: 'Normal', value: FontStyle.NORMAL },
          { label: 'Italic', value: FontStyle.ITALIC }
        ]
      },
      {
        key: 'textAlign',
        label: 'Text Align',
        type: 'select',
        category: 'Typography',
        defaultValue: TextAlign.LEFT,
        options: [
          { label: 'Left', value: TextAlign.LEFT },
          { label: 'Center', value: TextAlign.CENTER },
          { label: 'Right', value: TextAlign.RIGHT },
          { label: 'Justify', value: TextAlign.JUSTIFY }
        ]
      }
    ]);

    // Column Properties
    this.propertySchemas.set(WidgetType.COLUMN, [
      {
        key: 'mainAxisAlignment',
        label: 'Main Axis Alignment',
        type: 'select',
        category: 'Layout',
        defaultValue: MainAxisAlignment.START,
        options: [
          { label: 'Start', value: MainAxisAlignment.START },
          { label: 'End', value: MainAxisAlignment.END },
          { label: 'Center', value: MainAxisAlignment.CENTER },
          { label: 'Space Between', value: MainAxisAlignment.SPACE_BETWEEN },
          { label: 'Space Around', value: MainAxisAlignment.SPACE_AROUND },
          { label: 'Space Evenly', value: MainAxisAlignment.SPACE_EVENLY }
        ]
      },
      {
        key: 'crossAxisAlignment',
        label: 'Cross Axis Alignment',
        type: 'select',
        category: 'Layout',
        defaultValue: CrossAxisAlignment.CENTER,
        options: [
          { label: 'Start', value: CrossAxisAlignment.START },
          { label: 'End', value: CrossAxisAlignment.END },
          { label: 'Center', value: CrossAxisAlignment.CENTER },
          { label: 'Stretch', value: CrossAxisAlignment.STRETCH },
          { label: 'Baseline', value: CrossAxisAlignment.BASELINE }
        ]
      },
      {
        key: 'mainAxisSize',
        label: 'Main Axis Size',
        type: 'select',
        category: 'Layout',
        defaultValue: MainAxisSize.MAX,
        options: [
          { label: 'Min', value: MainAxisSize.MIN },
          { label: 'Max', value: MainAxisSize.MAX }
        ]
      }
    ]);

    // Row Properties (similar to Column)
    this.propertySchemas.set(WidgetType.ROW, [
      {
        key: 'mainAxisAlignment',
        label: 'Main Axis Alignment',
        type: 'select',
        category: 'Layout',
        defaultValue: MainAxisAlignment.START,
        options: [
          { label: 'Start', value: MainAxisAlignment.START },
          { label: 'End', value: MainAxisAlignment.END },
          { label: 'Center', value: MainAxisAlignment.CENTER },
          { label: 'Space Between', value: MainAxisAlignment.SPACE_BETWEEN },
          { label: 'Space Around', value: MainAxisAlignment.SPACE_AROUND },
          { label: 'Space Evenly', value: MainAxisAlignment.SPACE_EVENLY }
        ]
      },
      {
        key: 'crossAxisAlignment',
        label: 'Cross Axis Alignment',
        type: 'select',
        category: 'Layout',
        defaultValue: CrossAxisAlignment.CENTER,
        options: [
          { label: 'Start', value: CrossAxisAlignment.START },
          { label: 'End', value: CrossAxisAlignment.END },
          { label: 'Center', value: CrossAxisAlignment.CENTER },
          { label: 'Stretch', value: CrossAxisAlignment.STRETCH },
          { label: 'Baseline', value: CrossAxisAlignment.BASELINE }
        ]
      },
      {
        key: 'mainAxisSize',
        label: 'Main Axis Size',
        type: 'select',
        category: 'Layout',
        defaultValue: MainAxisSize.MAX,
        options: [
          { label: 'Min', value: MainAxisSize.MIN },
          { label: 'Max', value: MainAxisSize.MAX }
        ]
      }
    ]);

    // Padding Properties
    this.propertySchemas.set(WidgetType.PADDING, [
      {
        key: 'padding',
        label: 'Padding',
        type: 'spacing',
        category: 'Spacing',
        defaultValue: { top: 16, right: 16, bottom: 16, left: 16 }
      }
    ]);

    // SizedBox Properties
    this.propertySchemas.set(WidgetType.SIZED_BOX, [
      {
        key: 'width',
        label: 'Width',
        type: 'number',
        category: 'Layout',
        defaultValue: 100,
        min: 0,
        max: 1000,
        step: 10,
        unit: 'px'
      },
      {
        key: 'height',
        label: 'Height',
        type: 'number',
        category: 'Layout',
        defaultValue: 100,
        min: 0,
        max: 1000,
        step: 10,
        unit: 'px'
      }
    ]);

    // Scaffold Properties
    this.propertySchemas.set(WidgetType.SCAFFOLD, [
      {
        key: 'color',
        label: 'Background Color',
        type: 'color',
        category: 'Appearance',
        defaultValue: '#FFFFFF'
      }
    ]);

    // AppBar Properties
    this.propertySchemas.set(WidgetType.APP_BAR, [
      {
        key: 'title',
        label: 'Title',
        type: 'text',
        category: 'Content',
        defaultValue: 'App Title'
      },
      {
        key: 'backgroundColor',
        label: 'Background Color',
        type: 'color',
        category: 'Appearance',
        defaultValue: '#2196F3'
      },
      {
        key: 'elevation',
        label: 'Elevation',
        type: 'number',
        category: 'Appearance',
        defaultValue: 4,
        min: 0,
        max: 24,
        step: 1
      }
    ]);

    // Stack Properties
    this.propertySchemas.set(WidgetType.STACK, [
      {
        key: 'alignment',
        label: 'Alignment',
        type: 'alignment',
        category: 'Layout',
        defaultValue: Alignment.TOP_LEFT,
        options: Object.entries(Alignment).map(([key, value]) => ({
          label: key.replace(/_/g, ' ').toLowerCase(),
          value
        }))
      }
    ]);

    // Center Properties - usually doesn't have specific properties
    this.propertySchemas.set(WidgetType.CENTER, []);

    // Card Properties
    this.propertySchemas.set(WidgetType.CARD, [
      {
        key: 'elevation',
        label: 'Elevation',
        type: 'number',
        category: 'Appearance',
        defaultValue: 4,
        min: 0,
        max: 24,
        step: 1
      },
      {
        key: 'color',
        label: 'Background Color',
        type: 'color',
        category: 'Appearance',
        defaultValue: '#FFFFFF'
      },
      {
        key: 'borderRadius',
        label: 'Border Radius',
        type: 'number',
        category: 'Appearance',
        defaultValue: 8,
        min: 0,
        max: 50,
        step: 1,
        unit: 'px'
      },
      {
        key: 'margin',
        label: 'Margin',
        type: 'spacing',
        category: 'Spacing',
        defaultValue: { top: 8, right: 8, bottom: 8, left: 8 }
      },
      {
        key: 'padding',
        label: 'Padding',
        type: 'spacing',
        category: 'Spacing',
        defaultValue: { top: 16, right: 16, bottom: 16, left: 16 }
      }
    ]);

    // Icon Properties
    this.propertySchemas.set(WidgetType.ICON, [
      {
        key: 'icon',
        label: 'Icon Name',
        type: 'select',
        category: 'Content',
        defaultValue: 'star',
        options: [
          { label: 'Star', value: 'star' },
          { label: 'Heart', value: 'heart' },
          { label: 'Home', value: 'home' },
          { label: 'Settings', value: 'settings' },
          { label: 'User', value: 'user' },
          { label: 'Search', value: 'search' },
          { label: 'Menu', value: 'menu' },
          { label: 'Close', value: 'close' },
          { label: 'Check', value: 'check' },
          { label: 'Arrow Back', value: 'arrow_back' },
          { label: 'Arrow Forward', value: 'arrow_forward' }
        ]
      },
      {
        key: 'size',
        label: 'Size',
        type: 'number',
        category: 'Appearance',
        defaultValue: 24,
        min: 8,
        max: 128,
        step: 1,
        unit: 'px'
      },
      {
        key: 'color',
        label: 'Color',
        type: 'color',
        category: 'Appearance',
        defaultValue: '#000000'
      }
    ]);

    // ListView Properties
    this.propertySchemas.set(WidgetType.LIST_VIEW, [
      {
        key: 'scrollDirection',
        label: 'Scroll Direction',
        type: 'select',
        category: 'Layout',
        defaultValue: 'vertical',
        options: [
          { label: 'Vertical', value: 'vertical' },
          { label: 'Horizontal', value: 'horizontal' }
        ]
      },
      {
        key: 'height',
        label: 'Height',
        type: 'number',
        category: 'Layout',
        defaultValue: 300,
        min: 100,
        max: 800,
        step: 10,
        unit: 'px'
      },
      {
        key: 'padding',
        label: 'Padding',
        type: 'spacing',
        category: 'Spacing',
        defaultValue: { top: 0, right: 0, bottom: 0, left: 0 }
      },
      {
        key: 'separatorHeight',
        label: 'Item Spacing',
        type: 'number',
        category: 'Layout',
        defaultValue: 0,
        min: 0,
        max: 50,
        step: 1,
        unit: 'px'
      }
    ]);

    // Expanded Properties
    this.propertySchemas.set(WidgetType.EXPANDED, [
      {
        key: 'flex',
        label: 'Flex Factor',
        type: 'number',
        category: 'Layout',
        defaultValue: 1,
        min: 1,
        max: 10,
        step: 1
      }
    ]);

    // TextField Properties
    this.propertySchemas.set(WidgetType.TEXT_FIELD, [
      {
        key: 'hintText',
        label: 'Hint Text',
        type: 'text',
        category: 'Content',
        defaultValue: 'Enter text...'
      },
      {
        key: 'text',
        label: 'Initial Value',
        type: 'text',
        category: 'Content',
        defaultValue: ''
      },
      {
        key: 'fontSize',
        label: 'Font Size',
        type: 'number',
        category: 'Typography',
        defaultValue: 16,
        min: 8,
        max: 72,
        step: 1,
        unit: 'px'
      },
      {
        key: 'color',
        label: 'Text Color',
        type: 'color',
        category: 'Typography',
        defaultValue: '#000000'
      },
      {
        key: 'backgroundColor',
        label: 'Background Color',
        type: 'color',
        category: 'Appearance',
        defaultValue: '#FFFFFF'
      },
      {
        key: 'borderColor',
        label: 'Border Color',
        type: 'color',
        category: 'Appearance',
        defaultValue: '#D1D5DB'
      },
      {
        key: 'borderWidth',
        label: 'Border Width',
        type: 'number',
        category: 'Appearance',
        defaultValue: 1,
        min: 0,
        max: 5,
        step: 1,
        unit: 'px'
      },
      {
        key: 'borderRadius',
        label: 'Border Radius',
        type: 'number',
        category: 'Appearance',
        defaultValue: 6,
        min: 0,
        max: 20,
        step: 1,
        unit: 'px'
      },
      {
        key: 'autofocus',
        label: 'Autofocus',
        type: 'boolean',
        category: 'Behavior',
        defaultValue: false
      }
    ]);
  }

  getPropertiesForWidget(widget: FlutterWidget | null): PropertyCategory[] {
    if (!widget) return [];

    const schema = this.propertySchemas.get(widget.type) || [];
    const categories = new Map<string, PropertyDefinition[]>();

    // Group properties by category
    schema.forEach(prop => {
      if (!categories.has(prop.category)) {
        categories.set(prop.category, []);
      }
      categories.get(prop.category)!.push(prop);
    });

    // Convert to PropertyCategory array
    return Array.from(categories.entries()).map(([name, properties]) => ({
      name,
      icon: this.getCategoryIcon(name),
      properties,
      expanded: true
    }));
  }

  private getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      'Layout': '📐',
      'Spacing': '↔️',
      'Appearance': '🎨',
      'Content': '📝',
      'Typography': '🔤'
    };
    return icons[category] || '📋';
  }

  updateProperty(widgetId: string, propertyPath: string, value: any): void {
    try {
      const widget = this.canvasState.findWidget(widgetId);
      if (!widget) {
        this.notification.showError('Widget not found');
        return;
      }

      // Deep clone the widget
      const updatedWidget = JSON.parse(JSON.stringify(widget));

      // Update the property using path (e.g., "decoration.border.width")
      this.setNestedProperty(updatedWidget.properties, propertyPath, value);

      // Update the widget tree
      const currentRoot = this.canvasState.currentState.rootWidget;
      if (currentRoot) {
        const updatedRoot = this.updateWidgetInTree(currentRoot, widgetId, updatedWidget);
        this.canvasState.updateState({ rootWidget: updatedRoot });
      }
    } catch (error) {
      console.error('Failed to update property:', error);
      this.notification.showError(`Failed to update property: ${propertyPath}`);
    }
  }

  private setNestedProperty(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!current[key]) {
        current[key] = {};
      }
      current = current[key];
    }

    current[keys[keys.length - 1]] = value;
  }

  private getNestedProperty(obj: any, path: string): any {
    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return undefined;
      }
    }

    return current;
  }

  getPropertyValue(widget: FlutterWidget, propertyPath: string): any {
    return this.getNestedProperty(widget.properties, propertyPath);
  }

  private updateWidgetInTree(root: FlutterWidget, widgetId: string, updatedWidget: FlutterWidget): FlutterWidget {
    if (root.id === widgetId) {
      return { ...updatedWidget, children: root.children };
    }

    return {
      ...root,
      children: root.children.map(child =>
        this.updateWidgetInTree(child, widgetId, updatedWidget)
      )
    };
  }

  validateProperty(property: PropertyDefinition, value: any): string | null {
    if (!property.validation) return null;

    for (const rule of property.validation) {
      switch (rule.type) {
        case 'required':
          if (!value || value === '') return rule.message;
          break;
        case 'min':
          if (value < rule.value) return rule.message;
          break;
        case 'max':
          if (value > rule.value) return rule.message;
          break;
        case 'pattern':
          if (!new RegExp(rule.value).test(value)) return rule.message;
          break;
        case 'custom':
          if (rule.validator && !rule.validator(value)) return rule.message;
          break;
      }
    }

    return null;
  }

  resetProperty(widgetId: string, propertyPath: string): void {
    const widget = this.canvasState.findWidget(widgetId);
    if (!widget) return;

    const schema = this.propertySchemas.get(widget.type);
    const property = schema?.find(p => p.key === propertyPath);

    if (property) {
      this.updateProperty(widgetId, propertyPath, property.defaultValue);
    }
  }

  resetAllProperties(widgetId: string): void {
    const widget = this.canvasState.findWidget(widgetId);
    if (!widget) return;

    const schema = this.propertySchemas.get(widget.type);
    if (schema) {
      schema.forEach(property => {
        this.updateProperty(widgetId, property.key, property.defaultValue);
      });
    }
  }
}
