// src/app/core/services/property-editor.service.ts
import {Injectable} from '@angular/core';
import {BehaviorSubject, combineLatest} from 'rxjs';
import {map, takeUntil} from 'rxjs/operators'; // Added map
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
  EdgeInsets, // Import EdgeInsets
} from '../models/flutter-widget.model';
import {CanvasStateService} from './canvas-state.service';
import {WidgetTreeService} from './widget-tree.service';
import {NotificationService} from './notification.service';
import {WidgetRegistryService} from './widget-registry.service'; // Import WidgetRegistryService

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
  private currentWidgetSubject = new BehaviorSubject<FlutterWidget | null>(null);
  public currentWidget$ = this.currentWidgetSubject.asObservable();

  constructor(
    private canvasState: CanvasStateService,
    private treeService: WidgetTreeService,
    private notification: NotificationService,
    private widgetRegistry: WidgetRegistryService // Inject WidgetRegistryService
  ) {
    this.subscribeToSelection();
  }

  private subscribeToSelection() {
    this.canvasState.getSelectedWidget$().subscribe(widget => {
      this.currentWidgetSubject.next(widget);
    });
  }

  // This method now dynamically generates properties based on the WidgetDefinition
  getPropertiesForWidget(widget: FlutterWidget | null): PropertyCategory[] {
    if (!widget) return [];

    const definition = this.widgetRegistry.getWidgetDefinition(widget.type);
    if (!definition) {
      console.warn(`No widget definition found for type: ${widget.type}`);
      return [];
    }

    const categories = new Map<string, PropertyDefinition[]>();

    // Iterate over default_properties from the definition
    for (const key in definition.defaultProperties) {
      if (definition.defaultProperties.hasOwnProperty(key)) {
        const defaultValue = definition.defaultProperties[key];
        const propertyType = this.determinePropertyType(key, defaultValue);
        const categoryName = this.determinePropertyCategory(key, widget.type); // Determine category dynamically

        if (!categories.has(categoryName)) {
          categories.set(categoryName, []);
        }

        // Create a basic PropertyDefinition. You'll need to expand this
        // to include validation, options, min/max, etc., based on your needs.
        // This is a simplified mapping.
        const propDef: PropertyDefinition = {
          key: key,
          label: this.humanizePropertyLabel(key),
          type: propertyType,
          category: categoryName,
          defaultValue: defaultValue,
          // Add more specific properties like options, min, max, step, unit, validation, dependsOn
          // based on your backend's `properties_mapping` or hardcoded rules for common types.
          options: this.getOptionsForProperty(key),
          min: this.getMinForProperty(key),
          max: this.getMaxForProperty(key),
          step: this.getStepForProperty(key),
          unit: this.getUnitForProperty(key),
          validation: this.getValidationForProperty(key),
          dependsOn: this.getDependsOnForProperty(key)
        };
        categories.get(categoryName)!.push(propDef);
      }
    }

    // Convert to PropertyCategory array and sort
    return Array.from(categories.entries()).map(([name, properties]) => ({
      name,
      icon: this.getCategoryIcon(name),
      properties: properties.sort((a, b) => a.label.localeCompare(b.label)), // Sort properties alphabetically
      expanded: true // Default to expanded
    })).sort((a, b) => a.name.localeCompare(b.name)); // Sort categories alphabetically
  }

  private determinePropertyType(key: string, value: any): PropertyDefinition['type'] {
    if (key.toLowerCase().includes('color')) return 'color';
    if (key.toLowerCase().includes('padding') || key.toLowerCase().includes('margin')) return 'spacing';
    if (key.toLowerCase().includes('alignment')) return 'alignment';
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'string' && (key.toLowerCase().includes('axisalignment') || key.toLowerCase().includes('axissize') || key.toLowerCase().includes('fontweight') || key.toLowerCase().includes('fontstyle') || key.toLowerCase().includes('textalign') || key.toLowerCase().includes('icon') || key.toLowerCase().includes('scrolldirection'))) return 'select';
    return 'text';
  }

  private determinePropertyCategory(key: string, widgetType: WidgetType): string {
    // This logic can be expanded based on your backend's `widget_group` or `category`
    // For now, a simple heuristic:
    if (key.toLowerCase().includes('width') || key.toLowerCase().includes('height') || key.toLowerCase().includes('axisalignment') || key.toLowerCase().includes('axissize') || key.toLowerCase().includes('flex') || key.toLowerCase().includes('scroll')) return 'Layout';
    if (key.toLowerCase().includes('padding') || key.toLowerCase().includes('margin')) return 'Spacing';
    if (key.toLowerCase().includes('color') || key.toLowerCase().includes('decoration') || key.toLowerCase().includes('elevation') || key.toLowerCase().includes('radius') || key.toLowerCase().includes('border')) return 'Appearance';
    if (key.toLowerCase().includes('text') || key.toLowerCase().includes('title') || key.toLowerCase().includes('icon') || key.toLowerCase().includes('hint')) return 'Content';
    if (key.toLowerCase().includes('font')) return 'Typography';
    if (key.toLowerCase().includes('autofocus')) return 'Behavior';
    return 'General';
  }

  private humanizePropertyLabel(key: string): string {
    return key.replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/([a-z])([0-9])/g, '$1 $2') // Add space between letter and number
      .replace(/_/g, ' ') // Replace underscores with spaces
      .replace(/\b\w/g, char => char.toUpperCase()) // Capitalize first letter of each word
      .replace('Id', 'ID') // Specific correction
      .trim();
  }

  private getOptionsForProperty(key: string): { label: string; value: any }[] | undefined {
    switch (key) {
      case 'mainAxisAlignment':
        return Object.entries(MainAxisAlignment).map(([k, v]) => ({label: this.humanizePropertyLabel(k), value: v}));
      case 'crossAxisAlignment':
        return Object.entries(CrossAxisAlignment).map(([k, v]) => ({label: this.humanizePropertyLabel(k), value: v}));
      case 'mainAxisSize':
        return Object.entries(MainAxisSize).map(([k, v]) => ({label: this.humanizePropertyLabel(k), value: v}));
      case 'alignment':
        return Object.entries(Alignment).map(([k, v]) => ({label: this.humanizePropertyLabel(k), value: v}));
      case 'fontWeight':
        return Object.entries(FontWeight).map(([k, v]) => ({label: this.humanizePropertyLabel(k), value: v}));
      case 'fontStyle':
        return Object.entries(FontStyle).map(([k, v]) => ({label: this.humanizePropertyLabel(k), value: v}));
      case 'textAlign':
        return Object.entries(TextAlign).map(([k, v]) => ({label: this.humanizePropertyLabel(k), value: v}));
      case 'scrollDirection':
        return [{label: 'Vertical', value: 'vertical'}, {label: 'Horizontal', value: 'horizontal'}];
      case 'icon': // For Icon widget's 'icon' property
        return [
          {label: 'Star', value: 'star'},
          {label: 'Heart', value: 'heart'},
          {label: 'Home', value: 'home'},
          {label: 'Settings', value: 'settings'},
          {label: 'User', value: 'user'},
          {label: 'Search', value: 'search'},
          {label: 'Menu', value: 'menu'},
          {label: 'Close', value: 'close'},
          {label: 'Check', value: 'check'},
          {label: 'Arrow Back', value: 'arrow_back'},
          {label: 'Arrow Forward', value: 'arrow_forward'},
          {label: 'Phone', value: 'phone'},
          {label: 'Laptop', value: 'laptop'},
          {label: 'Camera', value: 'camera_alt'},
          {label: 'Headphones', value: 'headphones'},
          {label: 'Watch', value: 'watch'},
          {label: 'Local Shipping', value: 'local_shipping'},
          {label: 'Local Offer', value: 'local_offer'},
          {label: 'Checkroom', value: 'checkroom'},
          {label: 'Lock', value: 'lock'},
          {label: 'Email', value: 'email'},
          {label: 'Access Time', value: 'access_time'},
          {label: 'Sort', value: 'sort'},
          {label: 'Tune', value: 'tune'},
          {label: 'Notifications', value: 'notifications'},
          {label: 'Visibility', value: 'visibility'},
          {label: 'Help', value: 'help'},
          {label: 'Error Outline', value: 'error_outline'},
          {label: 'Logout', value: 'logout'},
          {label: 'Payment', value: 'payment'},
          {label: 'Location On', value: 'location_on'},
          {label: 'Check Box', value: 'check_box'},
          {label: 'Check Box Outline Blank', value: 'check_box_outline_blank'},
          {label: 'Radio Button Checked', value: 'radio_button_checked'},
          {label: 'Radio Button Unchecked', value: 'radio_button_unchecked'},
          {label: 'Shopping Cart', value: 'shopping_cart'},
          {label: 'Person', value: 'person'},
          {label: 'Sports Basketball', value: 'sports_basketball'},
          {label: 'Music Note', value: 'music_note'},
          {label: 'Pets', value: 'pets'},
          {label: 'Shopping Basket', value: 'shopping_basket'},
          {label: 'Directions Car', value: 'directions_car'},
          {label: 'Sports Soccer', value: 'sports_soccer'},
          {label: 'Mic', value: 'mic'},
          {label: 'Speaker', value: 'speaker'},
          {label: 'Phone Android', value: 'phone_android'},
          {label: 'Gamepad', value: 'gamepad'},
          {label: 'History', value: 'history'},
          {label: 'Add', value: 'add'},
          {label: 'Remove', value: 'remove'},
          {label: 'Favorite Border', value: 'favorite_border'},
          {label: 'Favorite', value: 'favorite'},
          {label: 'Share', value: 'share'},
          {label: 'Image', value: 'image'},
          {label: 'Headset', value: 'headset'},
          {label: 'Camera Alt', value: 'camera_alt'},
          {label: 'Filter List', value: 'filter_list'},
          {label: 'Delete', value: 'delete'},
          {label: 'Edit', value: 'edit'},
          {label: 'Check Circle', value: 'check_circle'},
          {label: 'Remove Circle Outline', value: 'remove_circle_outline'},
          {label: 'Add Circle Outline', value: 'add_circle_outline'},
          {label: 'Visibility Off', value: 'visibility_off'},
          {label: 'Help Outline', value: 'help_outline'},
          {label: 'Menu Book', value: 'menu_book'},
          {label: 'Toys', value: 'toys'}
        ];
      default:
        return undefined;
    }
  }

  private getMinForProperty(key: string): number | undefined {
    const minValues: { [key: string]: number } = {
      'width': 0,
      'height': 0,
      'fontSize': 8,
      'elevation': 0,
      'borderRadius': 0,
      'borderWidth': 0,
      'flex': 1,
      'size': 8,
      'separatorHeight': 0
    };
    return minValues[key];
  }

  private getMaxForProperty(key: string): number | undefined {
    const maxValues: { [key: string]: number } = {
      'width': 1000,
      'height': 1000,
      'fontSize': 72,
      'elevation': 24,
      'borderRadius': 100,
      'borderWidth': 20,
      'flex': 10,
      'size': 128,
      'separatorHeight': 50
    };
    return maxValues[key];
  }

  private getStepForProperty(key: string): number | undefined {
    const stepValues: { [key: string]: number } = {
      'width': 10,
      'height': 10,
      'fontSize': 1,
      'elevation': 1,
      'borderRadius': 1,
      'borderWidth': 1,
      'flex': 1,
      'size': 1,
      'separatorHeight': 1
    };
    return stepValues[key] || 1;
  }

  private getUnitForProperty(key: string): string | undefined {
    const unitValues: { [key: string]: string } = {
      'width': 'px',
      'height': 'px',
      'fontSize': 'px',
      'borderRadius': 'px',
      'borderWidth': 'px',
      'size': 'px',
      'separatorHeight': 'px'
    };
    return unitValues[key];
  }

  private getValidationForProperty(key: string): ValidationRule[] | undefined {
    const validationRules: { [key: string]: ValidationRule[] } = {
      'text': [{type: 'required', message: 'Text cannot be empty'}],
      'title': [{type: 'required', message: 'Title cannot be empty'}],
      'name': [{type: 'required', message: 'Name cannot be empty'}],
      'width': [{type: 'min', value: 0, message: 'Width must be positive'}],
      'height': [{type: 'min', value: 0, message: 'Height must be positive'}],
      'fontSize': [
        {type: 'min', value: 8, message: 'Font size must be at least 8'},
        {type: 'max', value: 72, message: 'Font size must be less than 72'}
      ]
    };
    return validationRules[key];
  }

  private getDependsOnForProperty(key: string): string[] | undefined {
    const dependencies: { [key: string]: string[] } = {
      'decoration.border.color': ['decoration.border.width']
    };
    return dependencies[key];
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

      // Deep clone the widget
      const updatedWidget = JSON.parse(JSON.stringify(widget));

      // Update the property using path (e.g., "decoration.border.width")
      this.setNestedProperty(updatedWidget.properties, propertyPath, value);

      // Update the widget tree
      const currentRoot = this.canvasState.currentState.rootWidget;
      if (currentRoot) {
        const updatedRoot = this.updateWidgetInTree(currentRoot, widgetId, updatedWidget);
        this.canvasState.updateState({rootWidget: updatedRoot});
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
      return {...updatedWidget, children: root.children};
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

    const defaultValue = this.getNestedProperty(definition.defaultProperties, propertyPath);
    if (defaultValue !== undefined) {
      this.updateProperty(widgetId, propertyPath, defaultValue);
    }
  }

  resetAllProperties(widgetId: string): void {
    const widget = this.canvasState.findWidget(widgetId);
    if (!widget) return;

    const definition = this.widgetRegistry.getWidgetDefinition(widget.type);
    if (!definition) return;

    // Update all properties to default values
    const updatedWidget = JSON.parse(JSON.stringify(widget));
    updatedWidget.properties = JSON.parse(JSON.stringify(definition.defaultProperties));

    const currentRoot = this.canvasState.currentState.rootWidget;
    if (currentRoot) {
      const updatedRoot = this.updateWidgetInTree(currentRoot, widgetId, updatedWidget);
      this.canvasState.updateState({rootWidget: updatedRoot});
    }
  }
}
