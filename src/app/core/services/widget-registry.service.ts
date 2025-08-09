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
  createEdgeInsets,
  FontWeight,
  FontStyle,
  TextAlign
} from '../models/flutter-widget.model';
import { v4 as uuidv4 } from 'uuid';

interface BackendComponentTemplate {
  flutter_widget: string;
  name: string;
  category: string;
  icon: string;
  description?: string;
  default_properties: any;
  can_have_children: boolean;
  max_children?: number;
  is_active: boolean;
  widget_group?: string;
  display_order?: number;
  show_in_builder?: boolean;
}

// Enhanced metadata for properties
export interface PropertyMetadata {
  key: string;
  type: 'text' | 'number' | 'color' | 'select' | 'spacing' | 'boolean' | 'alignment' | 'icon' | 'decoration' | 'border';
  category: string;
  defaultValue: any;
  options?: { label: string; value: any }[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  validation?: any[];
  dependsOn?: string[];
  flutterType?: string; // Store the original Flutter type (e.g., 'EdgeInsets', 'BoxDecoration')
}

// Enhanced widget definition with property metadata
export interface EnhancedWidgetDefinition extends WidgetDefinition {
  propertyMetadata: Map<string, PropertyMetadata>;
  renderType?: 'container' | 'text' | 'layout' | 'input' | 'display' | 'custom';
  htmlElement?: string; // The HTML element to use for rendering
}

@Injectable({
  providedIn: 'root'
})
export class WidgetRegistryService {
  private widgetDefinitions: Map<WidgetType, EnhancedWidgetDefinition> = new Map();
  private propertyTypeInferenceRules: Map<string, PropertyMetadata> = new Map();

  constructor() {
    this.initializePropertyInferenceRules();
  }

  private initializePropertyInferenceRules() {
    // Define common property patterns and their metadata
    this.propertyTypeInferenceRules.set('width', {
      key: 'width',
      type: 'number',
      category: 'Layout',
      defaultValue: null,
      min: 0,
      max: 1000,
      step: 10,
      unit: 'px'
    });

    this.propertyTypeInferenceRules.set('height', {
      key: 'height',
      type: 'number',
      category: 'Layout',
      defaultValue: null,
      min: 0,
      max: 1000,
      step: 10,
      unit: 'px'
    });

    this.propertyTypeInferenceRules.set('padding', {
      key: 'padding',
      type: 'spacing',
      category: 'Spacing',
      defaultValue: createEdgeInsets(0),
      flutterType: 'EdgeInsets'
    });

    this.propertyTypeInferenceRules.set('margin', {
      key: 'margin',
      type: 'spacing',
      category: 'Spacing',
      defaultValue: createEdgeInsets(0),
      flutterType: 'EdgeInsets'
    });

    // Add more common patterns
    this.propertyTypeInferenceRules.set('fontSize', {
      key: 'fontSize',
      type: 'number',
      category: 'Typography',
      defaultValue: 14,
      min: 8,
      max: 72,
      step: 1,
      unit: 'px'
    });

    this.propertyTypeInferenceRules.set('elevation', {
      key: 'elevation',
      type: 'number',
      category: 'Appearance',
      defaultValue: 0,
      min: 0,
      max: 24,
      step: 1
    });

    this.propertyTypeInferenceRules.set('borderRadius', {
      key: 'borderRadius',
      type: 'number',
      category: 'Appearance',
      defaultValue: 0,
      min: 0,
      max: 100,
      step: 1,
      unit: 'px'
    });
  }

  // Enhanced method to register definitions with comprehensive metadata
  registerWidgetDefinition(template: BackendComponentTemplate): void {
    const widgetType = this.normalizeBackendWidgetType(template.flutter_widget);
    const category = this.mapBackendCategoryToFrontend(template.category);
    const icon = this.mapBackendIconToFrontend(template.icon);

    // Determine render type based on widget
    const renderType = this.determineRenderType(template.flutter_widget);
    const htmlElement = this.determineHtmlElement(template.flutter_widget);

    // Generate property metadata
    const propertyMetadata = this.generatePropertyMetadata(template.default_properties, widgetType);

    const definition: EnhancedWidgetDefinition = {
      type: widgetType,
      displayName: template.name,
      icon: icon,
      category: category,
      isContainer: template.can_have_children,
      acceptsChildren: template.can_have_children,
      maxChildren: template.max_children,
      defaultProperties: this.parseBackendProperties(template.default_properties, widgetType),
      propertyMetadata: propertyMetadata,
      renderType: renderType,
      htmlElement: htmlElement
    };

    this.widgetDefinitions.set(widgetType, definition);
  }

  private determineRenderType(flutterWidget: string): 'container' | 'text' | 'layout' | 'input' | 'display' | 'custom' {
    const widget = flutterWidget.toLowerCase();

    if (['container', 'card', 'scaffold'].includes(widget)) return 'container';
    if (['text', 'richtext'].includes(widget)) return 'text';
    if (['column', 'row', 'stack', 'wrap', 'listview', 'gridview'].includes(widget)) return 'layout';
    if (['textfield', 'textformfield', 'button', 'elevatedbutton', 'textbutton', 'outlinedbutton', 'iconbutton', 'checkbox', 'switch', 'radio', 'slider', 'dropdown'].includes(widget)) return 'input';
    if (['image', 'icon', 'divider', 'circularprogressindicator', 'linearprogressindicator'].includes(widget)) return 'display';

    return 'custom';
  }

  private determineHtmlElement(flutterWidget: string): string {
    const widget = flutterWidget.toLowerCase();

    const elementMap: { [key: string]: string } = {
      'text': 'span',
      'richtext': 'span',
      'container': 'div',
      'column': 'div',
      'row': 'div',
      'stack': 'div',
      'textfield': 'input',
      'textformfield': 'input',
      'button': 'button',
      'elevatedbutton': 'button',
      'textbutton': 'button',
      'outlinedbutton': 'button',
      'iconbutton': 'button',
      'image': 'img',
      'icon': 'span',
      'divider': 'hr',
      'card': 'div',
      'scaffold': 'div',
      'appbar': 'header',
      'drawer': 'aside',
      'listview': 'div',
      'gridview': 'div'
    };

    return elementMap[widget] || 'div';
  }

  private generatePropertyMetadata(defaultProperties: any, widgetType: WidgetType): Map<string, PropertyMetadata> {
    const metadata = new Map<string, PropertyMetadata>();

    for (const key in defaultProperties) {
      if (defaultProperties.hasOwnProperty(key)) {
        const value = defaultProperties[key];

        // Check if we have a predefined rule for this property
        let propMetadata = this.propertyTypeInferenceRules.get(key);

        if (!propMetadata) {
          // Infer metadata from key and value
          propMetadata = this.inferPropertyMetadata(key, value);
        }

        metadata.set(key, { ...propMetadata, defaultValue: value });
      }
    }

    return metadata;
  }

  private inferPropertyMetadata(key: string, value: any): PropertyMetadata {
    const metadata: PropertyMetadata = {
      key: key,
      type: 'text',
      category: 'General',
      defaultValue: value
    };

    // Infer type from key patterns
    const keyLower = key.toLowerCase();

    // Color properties
    if (keyLower.includes('color')) {
      metadata.type = 'color';
      metadata.category = 'Appearance';
    }
    // Spacing properties
    else if (keyLower.includes('padding') || keyLower.includes('margin')) {
      metadata.type = 'spacing';
      metadata.category = 'Spacing';
      metadata.flutterType = 'EdgeInsets';
    }
    // Alignment properties
    else if (keyLower.includes('alignment')) {
      metadata.type = 'alignment';
      metadata.category = 'Layout';

      if (keyLower.includes('mainaxis')) {
        metadata.type = 'select';
        metadata.options = this.getMainAxisAlignmentOptions();
      } else if (keyLower.includes('crossaxis')) {
        metadata.type = 'select';
        metadata.options = this.getCrossAxisAlignmentOptions();
      }
    }
    // Size properties
    else if (keyLower.includes('width') || keyLower.includes('height') || keyLower.includes('size')) {
      metadata.type = 'number';
      metadata.category = 'Layout';
      metadata.min = 0;
      metadata.max = 1000;
      metadata.step = 1;
      metadata.unit = 'px';
    }
    // Font properties
    else if (keyLower.includes('font')) {
      metadata.category = 'Typography';

      if (keyLower.includes('size')) {
        metadata.type = 'number';
        metadata.min = 8;
        metadata.max = 72;
        metadata.step = 1;
        metadata.unit = 'px';
      } else if (keyLower.includes('weight')) {
        metadata.type = 'select';
        metadata.options = this.getFontWeightOptions();
      } else if (keyLower.includes('style')) {
        metadata.type = 'select';
        metadata.options = this.getFontStyleOptions();
      }
    }
    // Text properties
    else if (keyLower.includes('text')) {
      if (keyLower.includes('align')) {
        metadata.type = 'select';
        metadata.category = 'Typography';
        metadata.options = this.getTextAlignOptions();
      } else {
        metadata.type = 'text';
        metadata.category = 'Content';
      }
    }
    // Boolean properties
    else if (typeof value === 'boolean') {
      metadata.type = 'boolean';
      metadata.category = 'Behavior';
    }
    // Number properties
    else if (typeof value === 'number') {
      metadata.type = 'number';
      metadata.category = 'General';
      metadata.min = 0;
      metadata.max = 100;
      metadata.step = 1;
    }
    // Icon properties
    else if (keyLower === 'icon') {
      metadata.type = 'select';
      metadata.category = 'Content';
      metadata.options = this.getIconOptions();
    }
    // Decoration properties
    else if (keyLower.includes('decoration')) {
      metadata.type = 'decoration';
      metadata.category = 'Appearance';
      metadata.flutterType = 'BoxDecoration';
    }
    // Border properties
    else if (keyLower.includes('border')) {
      if (keyLower.includes('radius')) {
        metadata.type = 'number';
        metadata.category = 'Appearance';
        metadata.min = 0;
        metadata.max = 100;
        metadata.step = 1;
        metadata.unit = 'px';
      } else if (keyLower.includes('width')) {
        metadata.type = 'number';
        metadata.category = 'Appearance';
        metadata.min = 0;
        metadata.max = 20;
        metadata.step = 1;
        metadata.unit = 'px';
      } else if (keyLower.includes('color')) {
        metadata.type = 'color';
        metadata.category = 'Appearance';
      }
    }

    return metadata;
  }

  private getMainAxisAlignmentOptions(): { label: string; value: any }[] {
    return Object.entries(MainAxisAlignment).map(([k, v]) => ({
      label: this.humanizeLabel(k),
      value: v
    }));
  }

  private getCrossAxisAlignmentOptions(): { label: string; value: any }[] {
    return Object.entries(CrossAxisAlignment).map(([k, v]) => ({
      label: this.humanizeLabel(k),
      value: v
    }));
  }

  private getFontWeightOptions(): { label: string; value: any }[] {
    return Object.entries(FontWeight).map(([k, v]) => ({
      label: k,
      value: v
    }));
  }

  private getFontStyleOptions(): { label: string; value: any }[] {
    return Object.entries(FontStyle).map(([k, v]) => ({
      label: this.humanizeLabel(k),
      value: v
    }));
  }

  private getTextAlignOptions(): { label: string; value: any }[] {
    return Object.entries(TextAlign).map(([k, v]) => ({
      label: this.humanizeLabel(k),
      value: v
    }));
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
      { label: 'Add', value: 'add' },
      { label: 'Remove', value: 'remove' },
      { label: 'Edit', value: 'edit' },
      { label: 'Delete', value: 'delete' },
      { label: 'Share', value: 'share' },
      { label: 'Favorite', value: 'favorite' },
      { label: 'Shopping Cart', value: 'shopping_cart' },
      { label: 'Notifications', value: 'notifications' }
    ];
  }

  private humanizeLabel(str: string): string {
    return str.replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  getWidgetDefinition(type: WidgetType): EnhancedWidgetDefinition | undefined {
    return this.widgetDefinitions.get(type);
  }

  getAllWidgetDefinitions(): EnhancedWidgetDefinition[] {
    return Array.from(this.widgetDefinitions.values());
  }

  getPropertyMetadata(widgetType: WidgetType, propertyKey: string): PropertyMetadata | undefined {
    const definition = this.getWidgetDefinition(widgetType);
    return definition?.propertyMetadata.get(propertyKey);
  }

  // Helper to normalize backend widget type string to WidgetType enum
  public normalizeBackendWidgetType(backendType: string): WidgetType {
    const pascalCaseType = backendType.split(/[_-]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');

    const directMap: { [key: string]: WidgetType } = {
      'Container': WidgetType.CONTAINER,
      'Text': WidgetType.TEXT,
      'Column': WidgetType.COLUMN,
      'Row': WidgetType.ROW,
      'Stack': WidgetType.STACK,
      'Padding': WidgetType.PADDING,
      'Center': WidgetType.CENTER,
      'Sizedbox': WidgetType.SIZED_BOX,
      'Scaffold': WidgetType.SCAFFOLD,
      'Appbar': WidgetType.APP_BAR,
      'Textfield': WidgetType.TEXT_FIELD,
      'Elevatedbutton': WidgetType.ELEVATED_BUTTON,
      'Textbutton': WidgetType.TEXT_BUTTON,
      'Outlinedbutton': WidgetType.OUTLINED_BUTTON,
      'Iconbutton': WidgetType.ICON_BUTTON,
      'Floatingactionbutton': WidgetType.FAB,
      'Textformfield': WidgetType.TEXT_FORM_FIELD,
      'Listview': WidgetType.LIST_VIEW,
      'Gridview': WidgetType.GRID_VIEW,
      'Expanded': WidgetType.EXPANDED,
      'Flexible': WidgetType.FLEXIBLE,
      'Wrap': WidgetType.WRAP,
      'Aspectratio': WidgetType.ASPECT_RATIO,
      'Fittedbox': WidgetType.FITTED_BOX,
      'Listtile': WidgetType.LIST_TILE,
      'Checkbox': WidgetType.CHECKBOX,
      'Radio': WidgetType.RADIO,
      'Switch': WidgetType.SWITCH,
      'Slider': WidgetType.SLIDER,
      'Dropdownbutton': WidgetType.DROPDOWN_BUTTON,
      'Circularprogressindicator': WidgetType.CIRCULAR_PROGRESS,
      'Linearprogressindicator': WidgetType.LINEAR_PROGRESS,
      'Drawer': WidgetType.DRAWER,
      'Bottomnavigationbar': WidgetType.BOTTOM_NAV_BAR,
      'Tabbar': WidgetType.TAB_BAR,
      'Popupmenubutton': WidgetType.POPUP_MENU,
      'Tooltip': WidgetType.TOOLTIP,
      'Form': WidgetType.FORM,
      'Divider': WidgetType.DIVIDER,
      'Card': WidgetType.CARD,
      'Image': WidgetType.IMAGE,
      'Icon': WidgetType.ICON,
    };

    return directMap[pascalCaseType] || WidgetType.CUSTOM;
  }

  private mapBackendCategoryToFrontend(backendCategory: string): WidgetCategory {
    switch (backendCategory.toLowerCase()) {
      case 'layout': return WidgetCategory.LAYOUT;
      case 'display': return WidgetCategory.BASIC;
      case 'input': return WidgetCategory.FORM;
      case 'navigation': return WidgetCategory.NAVIGATION;
      case 'material': return WidgetCategory.MATERIAL;
      default: return WidgetCategory.BASIC;
    }
  }

  private mapBackendIconToFrontend(backendIconName: string): string {
    const iconMap: { [key: string]: string } = {
      'crop_square': '□',
      'view_column': '⬇',
      'view_stream': '➡',
      'layers': '⬚',
      'center_focus_strong': '⊕',
      'format_indent_increase': '▫',
      'text_fields': 'T',
      'image': '🖼️',
      'smart_button': '🔘',
      'input': '📝'
    };
    return iconMap[backendIconName.toLowerCase()] || '?';
  }

  private parseBackendProperties(backendProps: any, widgetType: WidgetType): any {
    const parsedProps: any = {};

    for (const key in backendProps) {
      if (backendProps.hasOwnProperty(key)) {
        let value = backendProps[key];

        if (typeof value === 'string') {
          if (value.startsWith('Colors.')) {
            parsedProps[key] = this.mapFlutterColorToHex(value);
          } else if (value.startsWith('EdgeInsets.')) {
            parsedProps[key] = this.parseEdgeInsets(value);
          } else if (value.startsWith('MainAxisAlignment.')) {
            parsedProps[key] = value.split('.')[1].toLowerCase();
          } else if (value.startsWith('CrossAxisAlignment.')) {
            parsedProps[key] = value.split('.')[1].toLowerCase();
          } else if (value.startsWith('Alignment.')) {
            parsedProps[key] = value.split('.')[1];
          } else if (value === 'true' || value === 'false') {
            parsedProps[key] = (value === 'true');
          } else if (!isNaN(Number(value)) && !isNaN(parseFloat(value))) {
            parsedProps[key] = parseFloat(value);
          } else {
            parsedProps[key] = value;
          }
        } else {
          parsedProps[key] = value;
        }
      }
    }

    return parsedProps;
  }

  private parseEdgeInsets(value: string): any {
    if (value.includes('all(')) {
      const num = parseFloat(value.match(/\d+(\.\d+)?/)![0]);
      return createEdgeInsets(num);
    } else if (value.includes('symmetric(')) {
      const match = value.match(/horizontal:\s*(\d+(\.\d+)?),\s*vertical:\s*(\d+(\.\d+)?)/);
      if (match) {
        return createEdgeInsets({
          left: parseFloat(match[1]),
          right: parseFloat(match[1]),
          top: parseFloat(match[3]),
          bottom: parseFloat(match[3])
        });
      }
    }
    return createEdgeInsets(0);
  }

  private mapFlutterColorToHex(flutterColor: string): string {
    const colorMap: { [key: string]: string } = {
      'Colors.blue': '#2196F3',
      'Colors.white': '#FFFFFF',
      'Colors.black': '#000000',
      'Colors.grey': '#9E9E9E',
      'Colors.red': '#F44336',
      'Colors.green': '#4CAF50',
      'Colors.transparent': 'transparent'
    };
    return colorMap[flutterColor] || '#000000';
  }

  // Existing methods
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

  getWidgetsByCategory(category: WidgetCategory): EnhancedWidgetDefinition[] {
    return this.getAllWidgetDefinitions().filter(def => def.category === category);
  }

  createSampleWidgetTree(): FlutterWidget {
    const scaffold = this.createWidget(WidgetType.SCAFFOLD);
    const column = this.createWidget(WidgetType.COLUMN, {
      mainAxisAlignment: MainAxisAlignment.CENTER,
      crossAxisAlignment: CrossAxisAlignment.CENTER
    });
    const text = this.createWidget(WidgetType.TEXT, { text: 'Welcome to Flutter Builder' });
    const container = this.createWidget(WidgetType.CONTAINER, { width: 200, height: 200, color: '#E3F2FD' });

    container.children.push(text);
    column.children.push(container);
    scaffold.children.push(column);

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
}
