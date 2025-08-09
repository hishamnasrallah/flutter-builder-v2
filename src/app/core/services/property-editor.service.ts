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
  TextAlign,
  EdgeInsets,
} from '../models/flutter-widget.model';
import { CanvasStateService } from './canvas-state.service';
import { WidgetTreeService } from './widget-tree.service';
import { NotificationService } from './notification.service';
import { WidgetRegistryService, PropertyMetadata } from './widget-registry.service';

export interface PropertyDefinition {
  key: string;
  label: string;
  type: 'text' | 'number' | 'color' | 'select' | 'spacing' | 'boolean' | 'alignment' | 'icon' | 'decoration' | 'border';
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
  private currentWidgetSubject = new BehaviorSubject<FlutterWidget | null>(null);
  public currentWidget$ = this.currentWidgetSubject.asObservable();

  // Cache for property definitions to improve performance
  private propertyCache = new Map<string, PropertyCategory[]>();

  constructor(
    private canvasState: CanvasStateService,
    private treeService: WidgetTreeService,
    private notification: NotificationService,
    private widgetRegistry: WidgetRegistryService
  ) {
    this.subscribeToSelection();
  }

  private subscribeToSelection() {
    this.canvasState.getSelectedWidget$().subscribe(widget => {
      this.currentWidgetSubject.next(widget);
    });
  }

  getPropertiesForWidget(widget: FlutterWidget | null): PropertyCategory[] {
    if (!widget) return [];

    // Check cache first
    const cacheKey = `${widget.type}_${JSON.stringify(Object.keys(widget.properties))}`;
    if (this.propertyCache.has(cacheKey)) {
      return this.propertyCache.get(cacheKey)!;
    }

    const definition = this.widgetRegistry.getWidgetDefinition(widget.type);
    if (!definition) {
      console.warn(`No widget definition found for type: ${widget.type}`);
      return this.generateFallbackProperties(widget);
    }

    const categories = new Map<string, PropertyDefinition[]>();

    // Get metadata from enhanced widget definition
    if (definition.propertyMetadata) {
      definition.propertyMetadata.forEach((metadata, key) => {
        // Check if property exists in widget
        const currentValue = this.getNestedProperty(widget.properties, key);

        const propertyDef = this.createPropertyDefinition(
          metadata,
          currentValue !== undefined ? currentValue : metadata.defaultValue
        );

        if (!categories.has(metadata.category)) {
          categories.set(metadata.category, []);
        }
        categories.get(metadata.category)!.push(propertyDef);
      });
    }

    // Also check for any properties in the widget that aren't in the definition
    this.addDynamicProperties(widget, definition, categories);

    // Convert to PropertyCategory array
    const result = this.convertToPropertyCategories(categories);

    // Cache the result
    this.propertyCache.set(cacheKey, result);

    return result;
  }

  private createPropertyDefinition(metadata: PropertyMetadata, currentValue: any): PropertyDefinition {
    return {
      key: metadata.key,
      label: this.humanizePropertyLabel(metadata.key),
      type: metadata.type,
      category: metadata.category,
      defaultValue: metadata.defaultValue,
      options: metadata.options,
      min: metadata.min,
      max: metadata.max,
      step: metadata.step,
      unit: metadata.unit,
      validation: this.generateValidation(metadata),
      dependsOn: metadata.dependsOn
    };
  }

  private generateValidation(metadata: PropertyMetadata): ValidationRule[] | undefined {
    const rules: ValidationRule[] = [];

    // Add validation based on property type and metadata
    if (metadata.type === 'text' && metadata.key.toLowerCase().includes('name')) {
      rules.push({
        type: 'required',
        message: `${this.humanizePropertyLabel(metadata.key)} is required`
      });
    }

    if (metadata.type === 'number') {
      if (metadata.min !== undefined) {
        rules.push({
          type: 'min',
          value: metadata.min,
          message: `Value must be at least ${metadata.min}`
        });
      }
      if (metadata.max !== undefined) {
        rules.push({
          type: 'max',
          value: metadata.max,
          message: `Value must be at most ${metadata.max}`
        });
      }
    }

    return rules.length > 0 ? rules : undefined;
  }

  private addDynamicProperties(
    widget: FlutterWidget,
    definition: any,
    categories: Map<string, PropertyDefinition[]>
  ): void {
    // Check for properties in the widget that aren't in the definition
    for (const key in widget.properties) {
      if (!definition.propertyMetadata || !definition.propertyMetadata.has(key)) {
        // This is a dynamic property not in the definition
        const value = widget.properties[key];
        const propertyDef = this.inferPropertyDefinition(key, value);

        if (!categories.has(propertyDef.category)) {
          categories.set(propertyDef.category, []);
        }
        categories.get(propertyDef.category)!.push(propertyDef);
      }
    }
  }

  private inferPropertyDefinition(key: string, value: any): PropertyDefinition {
    const type = this.inferPropertyType(key, value);
    const category = this.inferPropertyCategory(key);

    return {
      key: key,
      label: this.humanizePropertyLabel(key),
      type: type,
      category: category,
      defaultValue: value,
      options: this.inferPropertyOptions(key, type),
      min: this.inferMin(key, type),
      max: this.inferMax(key, type),
      step: this.inferStep(key, type),
      unit: this.inferUnit(key, type)
    };
  }

  private inferPropertyType(key: string, value: any): PropertyDefinition['type'] {
    const keyLower = key.toLowerCase();

    // Check key patterns first
    if (keyLower.includes('color')) return 'color';
    if (keyLower.includes('padding') || keyLower.includes('margin')) return 'spacing';
    if (keyLower === 'alignment') return 'alignment';
    if (keyLower === 'icon') return 'select';
    if (keyLower.includes('decoration') && !keyLower.includes('color')) return 'decoration';
    if (keyLower.includes('border') && !keyLower.includes('color') && !keyLower.includes('width') && !keyLower.includes('radius')) return 'border';

    // Check value type
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') return 'number';

    // Check if value matches known enum patterns
    if (typeof value === 'string') {
      if (this.isAlignmentValue(value)) return 'select';
      if (this.isFontWeightValue(value)) return 'select';
      if (this.isFontStyleValue(value)) return 'select';
      if (this.isTextAlignValue(value)) return 'select';
      if (value.startsWith('#') || value.startsWith('rgb')) return 'color';
    }

    // Check specific property names
    if (keyLower === 'mainaxisalignment' || keyLower === 'crossaxisalignment' ||
        keyLower === 'mainaxissize' || keyLower === 'fontweight' ||
        keyLower === 'fontstyle' || keyLower === 'textalign' ||
        keyLower === 'scrolldirection') {
      return 'select';
    }

    return 'text';
  }

  private inferPropertyCategory(key: string): string {
    const keyLower = key.toLowerCase();

    if (keyLower.includes('width') || keyLower.includes('height') ||
        keyLower.includes('flex') || keyLower.includes('alignment') ||
        keyLower.includes('axis') || keyLower.includes('size') && !keyLower.includes('font')) {
      return 'Layout';
    }

    if (keyLower.includes('padding') || keyLower.includes('margin')) {
      return 'Spacing';
    }

    if (keyLower.includes('color') || keyLower.includes('decoration') ||
        keyLower.includes('elevation') || keyLower.includes('radius') ||
        keyLower.includes('border') || keyLower.includes('shadow')) {
      return 'Appearance';
    }

    if (keyLower.includes('text') || keyLower.includes('title') ||
        keyLower.includes('icon') || keyLower.includes('hint') ||
        keyLower.includes('label') || keyLower.includes('placeholder')) {
      return 'Content';
    }

    if (keyLower.includes('font')) {
      return 'Typography';
    }

    if (keyLower.includes('enabled') || keyLower.includes('visible') ||
        keyLower.includes('autofocus') || keyLower.includes('readonly') ||
        keyLower.includes('obscure')) {
      return 'Behavior';
    }

    return 'General';
  }

  private inferPropertyOptions(key: string, type: PropertyDefinition['type']): { label: string; value: any }[] | undefined {
    const keyLower = key.toLowerCase();

    if (keyLower === 'mainaxisalignment') {
      return Object.entries(MainAxisAlignment).map(([k, v]) => ({
        label: this.humanizePropertyLabel(k),
        value: v
      }));
    }

    if (keyLower === 'crossaxisalignment') {
      return Object.entries(CrossAxisAlignment).map(([k, v]) => ({
        label: this.humanizePropertyLabel(k),
        value: v
      }));
    }

    if (keyLower === 'mainaxissize') {
      return Object.entries(MainAxisSize).map(([k, v]) => ({
        label: this.humanizePropertyLabel(k),
        value: v
      }));
    }

    if (keyLower === 'fontweight') {
      return Object.entries(FontWeight).map(([k, v]) => ({
        label: k,
        value: v
      }));
    }

    if (keyLower === 'fontstyle') {
      return Object.entries(FontStyle).map(([k, v]) => ({
        label: this.humanizePropertyLabel(k),
        value: v
      }));
    }

    if (keyLower === 'textalign') {
      return Object.entries(TextAlign).map(([k, v]) => ({
        label: this.humanizePropertyLabel(k),
        value: v
      }));
    }

    if (keyLower === 'scrolldirection') {
      return [
        { label: 'Vertical', value: 'vertical' },
        { label: 'Horizontal', value: 'horizontal' }
      ];
    }

    if (keyLower === 'icon') {
      return this.getIconOptions();
    }

    return undefined;
  }

  private inferMin(key: string, type: PropertyDefinition['type']): number | undefined {
    if (type !== 'number') return undefined;

    const keyLower = key.toLowerCase();
    const minValues: { [pattern: string]: number } = {
      'width': 0,
      'height': 0,
      'fontsize': 8,
      'elevation': 0,
      'borderradius': 0,
      'borderwidth': 0,
      'flex': 1,
      'size': 8,
      'opacity': 0,
      'blur': 0
    };

    for (const pattern in minValues) {
      if (keyLower.includes(pattern)) {
        return minValues[pattern];
      }
    }

    return 0;
  }

  private inferMax(key: string, type: PropertyDefinition['type']): number | undefined {
    if (type !== 'number') return undefined;

    const keyLower = key.toLowerCase();
    const maxValues: { [pattern: string]: number } = {
      'width': 1000,
      'height': 1000,
      'fontsize': 72,
      'elevation': 24,
      'borderradius': 100,
      'borderwidth': 20,
      'flex': 10,
      'size': 128,
      'opacity': 1,
      'blur': 20
    };

    for (const pattern in maxValues) {
      if (keyLower.includes(pattern)) {
        return maxValues[pattern];
      }
    }

    return 100;
  }

  private inferStep(key: string, type: PropertyDefinition['type']): number | undefined {
    if (type !== 'number') return undefined;

    const keyLower = key.toLowerCase();
    if (keyLower.includes('opacity')) return 0.1;
    if (keyLower.includes('flex')) return 1;

    return 1;
  }

  private inferUnit(key: string, type: PropertyDefinition['type']): string | undefined {
    if (type !== 'number') return undefined;

    const keyLower = key.toLowerCase();
    const unitMap: { [pattern: string]: string } = {
      'width': 'px',
      'height': 'px',
      'fontsize': 'px',
      'borderradius': 'px',
      'borderwidth': 'px',
      'size': 'px',
      'blur': 'px',
      'elevation': 'dp'
    };

    for (const pattern in unitMap) {
      if (keyLower.includes(pattern)) {
        return unitMap[pattern];
      }
    }

    return undefined;
  }

  private getIconOptions(): { label: string; value: any }[] {
    return [
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
      { label: 'Arrow Forward', value: 'arrow_forward' },
      { label: 'Phone', value: 'phone' },
      { label: 'Email', value: 'email' },
      { label: 'Camera', value: 'camera_alt' },
      { label: 'Location', value: 'location_on' },
      { label: 'Share', value: 'share' },
      { label: 'Favorite', value: 'favorite' },
      { label: 'Shopping Cart', value: 'shopping_cart' },
      { label: 'Notifications', value: 'notifications' },
      { label: 'Add', value: 'add' },
      { label: 'Remove', value: 'remove' },
      { label: 'Edit', value: 'edit' },
      { label: 'Delete', value: 'delete' }
    ];
  }

  private isAlignmentValue(value: string): boolean {
    const alignmentValues = Object.values(Alignment);
    return alignmentValues.includes(value as any);
  }

  private isFontWeightValue(value: string): boolean {
    const fontWeightValues = Object.values(FontWeight);
    return fontWeightValues.includes(value as any);
  }

  private isFontStyleValue(value: string): boolean {
    const fontStyleValues = Object.values(FontStyle);
    return fontStyleValues.includes(value as any);
  }

  private isTextAlignValue(value: string): boolean {
    const textAlignValues = Object.values(TextAlign);
    return textAlignValues.includes(value as any);
  }

  private convertToPropertyCategories(categories: Map<string, PropertyDefinition[]>): PropertyCategory[] {
    const categoryOrder = ['Content', 'Layout', 'Spacing', 'Appearance', 'Typography', 'Behavior', 'General'];
    const result: PropertyCategory[] = [];

    // Add categories in order
    categoryOrder.forEach(categoryName => {
      if (categories.has(categoryName)) {
        result.push({
          name: categoryName,
          icon: this.getCategoryIcon(categoryName),
          properties: categories.get(categoryName)!.sort((a, b) => a.label.localeCompare(b.label)),
          expanded: true
        });
      }
    });

    // Add any remaining categories not in the order
    categories.forEach((properties, categoryName) => {
      if (!categoryOrder.includes(categoryName)) {
        result.push({
          name: categoryName,
          icon: this.getCategoryIcon(categoryName),
          properties: properties.sort((a, b) => a.label.localeCompare(b.label)),
          expanded: true
        });
      }
    });

    return result;
  }

  private generateFallbackProperties(widget: FlutterWidget): PropertyCategory[] {
    const categories = new Map<string, PropertyDefinition[]>();

    // Generate properties from the widget's current properties
    for (const key in widget.properties) {
      const value = widget.properties[key];
      const propertyDef = this.inferPropertyDefinition(key, value);

      if (!categories.has(propertyDef.category)) {
        categories.set(propertyDef.category, []);
      }
      categories.get(propertyDef.category)!.push(propertyDef);
    }

    return this.convertToPropertyCategories(categories);
  }

  private humanizePropertyLabel(key: string): string {
    return key.replace(/([A-Z])/g, ' $1')
      .replace(/([a-z])([0-9])/g, '$1 $2')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase())
      .trim();
  }

  private getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      'Layout': '📐',
      'Spacing': '↔️',
      'Appearance': '🎨',
      'Content': '📝',
      'Typography': '🔤',
      'Behavior': '⚙️',
      'General': '📋'
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

      // Clear cache for this widget type
      this.propertyCache.clear();

      const updatedWidget = JSON.parse(JSON.stringify(widget));
      this.setNestedProperty(updatedWidget.properties, propertyPath, value);

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

    const definition = this.widgetRegistry.getWidgetDefinition(widget.type);
    if (!definition) return;

    const metadata = this.widgetRegistry.getPropertyMetadata(widget.type, propertyPath);
    if (metadata) {
      this.updateProperty(widgetId, propertyPath, metadata.defaultValue);
    }
  }

  resetAllProperties(widgetId: string): void {
    const widget = this.canvasState.findWidget(widgetId);
    if (!widget) return;

    const definition = this.widgetRegistry.getWidgetDefinition(widget.type);
    if (!definition) return;

    const updatedWidget = JSON.parse(JSON.stringify(widget));
    updatedWidget.properties = JSON.parse(JSON.stringify(definition.defaultProperties));

    const currentRoot = this.canvasState.currentState.rootWidget;
    if (currentRoot) {
      const updatedRoot = this.updateWidgetInTree(currentRoot, widgetId, updatedWidget);
      this.canvasState.updateState({ rootWidget: updatedRoot });
    }
  }
}
