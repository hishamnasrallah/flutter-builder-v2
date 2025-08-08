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
  description?: string; // Make this optional
  default_properties: any;
  can_have_children: boolean;
  max_children?: number;
  is_active: boolean;
  widget_group?: string;
  display_order?: number;
  show_in_builder?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class WidgetRegistryService {
  private widgetDefinitions: Map<WidgetType, WidgetDefinition> = new Map();

  constructor() {
    // No static initialization here anymore
  }

  // New method to register definitions from backend data
  registerWidgetDefinition(template: BackendComponentTemplate): void {
    const widgetType = this.normalizeBackendWidgetType(template.flutter_widget);
    const category = this.mapBackendCategoryToFrontend(template.category);
    const icon = this.mapBackendIconToFrontend(template.icon); // Map backend icon name to actual icon character/code

    const definition: WidgetDefinition = {
      type: widgetType,
      displayName: template.name,
      icon: icon,
      category: category,
      isContainer: template.can_have_children, // Assuming can_have_children implies container
      acceptsChildren: template.can_have_children,
      maxChildren: template.max_children,
      defaultProperties: this.parseBackendProperties(template.default_properties, widgetType)
    };
    this.widgetDefinitions.set(widgetType, definition);
  }

  // Helper to normalize backend widget type string to WidgetType enum
  public normalizeBackendWidgetType(backendType: string): WidgetType {
    // Convert backend's snake_case or lowercase to PascalCase for WidgetType enum
    // Example: 'text_field' -> 'TextField', 'container' -> 'Container'
    const pascalCaseType = backendType.split('_')
                                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                    .join('');
    // Use a direct mapping if PascalCase doesn't match enum exactly
    const directMap: { [key: string]: WidgetType } = {
      'Textfield': WidgetType.TEXT_FIELD,
      'Elevatedbutton': WidgetType.ELEVATED_BUTTON,
      'Textbutton': WidgetType.TEXT_BUTTON,
      'Outlinedbutton': WidgetType.OUTLINED_BUTTON,
      'Iconbutton': WidgetType.ICON_BUTTON,
      'Floatingactionbutton': WidgetType.FAB,
      'Textformfield': WidgetType.TEXT_FORM_FIELD,
      'Listview': WidgetType.LIST_VIEW,
      'Gridview': WidgetType.GRID_VIEW,
      'Circleavatar': WidgetType.CUSTOM, // Map to CUSTOM or add to enum if needed
      'Navigatablecontainer': WidgetType.CUSTOM, // Map to CUSTOM or add to enum if needed
      'Navigatabletext': WidgetType.CUSTOM, // Map to CUSTOM or add to enum if needed
      'Navigatablecard': WidgetType.CUSTOM, // Map to CUSTOM or add to enum if needed
      'Navigatableicon': WidgetType.CUSTOM, // Map to CUSTOM or add to enum if needed
      'Navigatablebutton': WidgetType.CUSTOM, // Map to CUSTOM or add to enum if needed
      'Navigatablecolumn': WidgetType.CUSTOM, // Map to CUSTOM or add to enum if needed
      'Singlechildscrollview': WidgetType.CUSTOM, // Map to CUSTOM or add to enum if needed
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
      // Add more mappings as needed for your specific backend types
    };

    return directMap[pascalCaseType] || (pascalCaseType as WidgetType);
  }

  // Helper to map backend category strings to frontend WidgetCategory enum
  private mapBackendCategoryToFrontend(backendCategory: string): WidgetCategory {
    switch (backendCategory.toLowerCase()) {
      case 'layout': return WidgetCategory.LAYOUT;
      case 'display': return WidgetCategory.BASIC; // Basic for general display widgets
      case 'input': return WidgetCategory.FORM;
      case 'navigation': return WidgetCategory.NAVIGATION;
      case 'material': return WidgetCategory.MATERIAL;
      // Add more mappings as needed
      default: return WidgetCategory.BASIC;
    }
  }

  // Helper to map backend icon names to actual icon characters/codes
  private mapBackendIconToFrontend(backendIconName: string): string {
    // This is a simplified mapping. You might need a comprehensive map
    // or use a font icon library (like Material Icons) directly in your HTML.
    const iconMap: { [key: string]: string } = {
      'crop_square': '□', 'view_column': '⬇', 'view_stream': '➡', 'layers': '⬚',
      'center_focus_strong': '⊕', 'format_indent_increase': '▫', 'unfold_more': '↔',
      'crop_din': '▭', 'text_fields': 'T', 'image': '🖼️', 'insert_emoticon': '✦',
      'refresh': '⟳', 'linear_scale': '▬▬▬', 'horizontal_rule': '─', 'label': '🏷️',
      'smart_button': '🔘', 'text_snippet': '📄', 'crop_16_9': '🔳', 'touch_app': '👆',
      'add_circle': '➕', 'input': '📝', 'edit_note': '✍️', 'check_box': '✅',
      'toggle_on': '💡', 'radio_button_checked': '◉', 'tune': '🎚️', 'arrow_drop_down': '🔽',
      'credit_card': '💳', 'list_alt': '📋', 'dashboard': '🏠', 'web_asset': '🌐',
      'menu': '☰', 'navigation': '🗺️', 'tab': '🗂️', 'announcement': '📢',
      'warning': '⚠️', 'vertical_align_bottom': '⬇️', 'expand_more': '⬇️',
      'format_list_numbered': '🔢', 'opacity': '👻', 'transform': '🔄',
      'visibility': '👁️', 'grid_on': '▦', 'list': '☰', 'dynamic_form': '📝',
      'verified': '✔️', 'account_circle': '👤', 'swap_vert': '↕️', 'grid_view': '🖼️',
      'drag_handle': '✋', 'timeline': '📈', 'blur_on': '🌫️', 'format_paint': '🖌️',
      'campaign': '📣', 'view_sidebar': '➡️', 'view_carousel': '🎠', 'view_quilt': '🧩',
      'brush': '🖌️', 'block': '🚫', 'height': '📏', 'width': '📐', 'crop_free': '✂️',
      'fullscreen': '📺', 'more_vert': '⋮', 'checklist': '✅', 'filter_alt': '🎛️',
      'view_week': '🗓️', 'phone_android': '📱', 'shopping_bag': '🛍️', 'face': '😊',
      'sports_soccer': '⚽', 'home': '🏠', 'menu_book': '📚', 'toys': '🧸',
      'shopping_basket': '🧺', 'directions_car': '🚗', 'favorite': '❤️', 'music_note': '🎵',
      'pets': '🐾', 'laptop': '💻', 'camera_alt': '📷', 'headphones': '🎧',
      'watch': '⌚', 'headset': '🎧', 'local_shipping': '🚚', 'local_offer': '🏷️',
      'arrow_forward_ios': '➡️', 'check_circle': '✅', 'remove_circle_outline': '➖',
      'add_circle_outline': '➕', 'delete_outline': '🗑️', 'lock': '🔒', 'radio_button_unchecked': '⚪',
      'notifications': '🔔', 'visibility_off': '🚫', 'help': '❓', 'error_outline': '❗',
      'logout': '🚪', 'email': '📧', 'access_time': '⏰', 'sort': '⇅', 'tune': '🎛️',
      'checkroom': '👕', 'phone': '📞', 'location_on': '📍', 'check_box_outline_blank': '⬜'
    };
    return iconMap[backendIconName.toLowerCase()] || '?';
  }

  // Helper to parse backend property strings into frontend types
  private parseBackendProperties(backendProps: any, widgetType: WidgetType): any {
    const parsedProps: any = {};
    for (const key in backendProps) {
      if (backendProps.hasOwnProperty(key)) {
        let value = backendProps[key];

        // Handle specific known string formats from backend
        if (typeof value === 'string') {
          if (value.startsWith('Colors.')) {
            // Simple color mapping (e.g., 'Colors.blue' -> '#2196F3')
            parsedProps[key] = this.mapFlutterColorToHex(value);
          } else if (value.startsWith('EdgeInsets.all(')) {
            const num = parseFloat(value.match(/\d+(\.\d+)?/)![0]);
            parsedProps[key] = createEdgeInsets(num);
          } else if (value.startsWith('EdgeInsets.symmetric(')) {
            const match = value.match(/horizontal:\s*(\d+(\.\d+)?),\s*vertical:\s*(\d+(\.\d+)?)/);
            if (match) {
              parsedProps[key] = createEdgeInsets({
                left: parseFloat(match[1]),
                right: parseFloat(match[1]),
                top: parseFloat(match[3]),
                bottom: parseFloat(match[3])
              });
            } else {
              parsedProps[key] = createEdgeInsets(0); // Fallback
            }
          } else if (value.startsWith('MainAxisAlignment.')) {
            parsedProps[key] = value.split('.')[1].toLowerCase(); // 'MainAxisAlignment.center' -> 'center'
          } else if (value.startsWith('CrossAxisAlignment.')) {
            parsedProps[key] = value.split('.')[1].toLowerCase(); // 'CrossAxisAlignment.start' -> 'start'
          } else if (value.startsWith('MainAxisSize.')) {
            parsedProps[key] = value.split('.')[1].toLowerCase(); // 'MainAxisSize.min' -> 'min'
          } else if (value.startsWith('Alignment.')) {
            parsedProps[key] = value.split('.')[1]; // 'Alignment.topLeft' -> 'topLeft'
          } else if (value.startsWith('FontWeight.')) {
            parsedProps[key] = value.split('.')[1].toLowerCase(); // 'FontWeight.bold' -> 'bold'
          } else if (value.startsWith('FontStyle.')) {
            parsedProps[key] = value.split('.')[1].toLowerCase(); // 'FontStyle.italic' -> 'italic'
          } else if (value.startsWith('TextAlign.')) {
            parsedProps[key] = value.split('.')[1].toLowerCase(); // 'TextAlign.center' -> 'center'
          } else if (value.startsWith('Icons.')) {
            parsedProps[key] = value.split('.')[1]; // 'Icons.search' -> 'search'
          } else if (value === 'true' || value === 'false') {
            parsedProps[key] = (value === 'true');
          } else if (!isNaN(Number(value)) && !isNaN(parseFloat(value))) {
            parsedProps[key] = parseFloat(value);
          } else if (value.startsWith('TextStyle(') || value.startsWith('InputDecoration(') || value.startsWith('BoxDecoration(') || value.startsWith('ElevatedButton.styleFrom(') || value.startsWith('RoundedRectangleBorder(')) {
            // For complex Flutter objects, store as string for now or parse more deeply if needed
            // For simplicity, we'll just store the raw string for now if not directly handled by a specific editor
            parsedProps[key] = value;
          } else {
            parsedProps[key] = value; // Keep as is if no specific parsing rule
          }
        } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          // Recursively parse nested objects (e.g., 'margin', 'padding' if they are objects)
          parsedProps[key] = this.parseBackendProperties(value, widgetType);
        } else {
          parsedProps[key] = value;
        }
      }
    }
    return parsedProps;
  }

  // Simplified Flutter Color to Hex mapping
  private mapFlutterColorToHex(flutterColor: string): string {
    const colorMap: { [key: string]: string } = {
      'Colors.blue': '#2196F3',
      'Colors.white': '#FFFFFF',
      'Colors.black': '#000000',
      'Colors.grey': '#9E9E9E',
      'Colors.red': '#F44336',
      'Colors.green': '#4CAF50',
      'Colors.orange': '#FF9800',
      'Colors.yellow': '#FFEB3B',
      'Colors.purple': '#9C27B0',
      'Colors.pink': '#E91E63',
      'Colors.teal': '#009688',
      'Colors.indigo': '#3F51B5',
      'Colors.cyan': '#00BCD4',
      'Colors.amber': '#FFC107',
      'Colors.deepOrange': '#FF5722',
      'Colors.blueGrey': '#607D8B',
      'Colors.brown': '#795548',
      'Colors.lightBlue': '#03A9F4',
      'Colors.lightGreen': '#8BC34A',
      'Colors.lime': '#CDDC39',
      'Colors.deepPurple': '#673AB7',
      'Colors.transparent': 'transparent',
      'Colors.black54': 'rgba(0,0,0,0.54)', // Example for opacity
      'Colors.grey[200]': '#EEEEEE',
      'Colors.grey[300]': '#E0E0E0',
      'Colors.grey[400]': '#BDBDBD',
      'Colors.grey[500]': '#9E9E9E',
      'Colors.grey[600]': '#757575',
      'Colors.grey[700]': '#616161',
      'Colors.grey[800]': '#424242',
      'Colors.grey[900]': '#212121',
      // Add more shades as needed
    };
    return colorMap[flutterColor] || '#000000'; // Default to black if not found
  }

  // Existing methods (keep as is, they will now use dynamic definitions)
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

  // Keep createSampleWidgetTree for initial canvas load if no screen is selected
  createSampleWidgetTree(): FlutterWidget {
    // This method can remain for initial setup or be removed if all screens are from backend
    // For now, let's keep it as a fallback or initial state.
    // Ensure it uses dynamically registered widgets if possible, or basic ones.
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

    // Update parent references (important for tree structure)
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
