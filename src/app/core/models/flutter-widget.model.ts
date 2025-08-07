// src/app/core/models/flutter-widget.model.ts

export interface FlutterWidget {
  id: string;
  type: WidgetType;
  properties: WidgetProperties;
  children: FlutterWidget[];
  parent?: string;
  constraints?: LayoutConstraints;
}

export enum WidgetType {
  CONTAINER = 'Container',
  TEXT = 'Text',
  COLUMN = 'Column',
  ROW = 'Row',
  STACK = 'Stack',
  PADDING = 'Padding',
  CENTER = 'Center',
  SIZED_BOX = 'SizedBox',
  SCAFFOLD = 'Scaffold',
  APP_BAR = 'AppBar',
  // Add new dynamic widget types
  ELEVATED_BUTTON = 'ElevatedButton',
  TEXT_BUTTON = 'TextButton',
  OUTLINED_BUTTON = 'OutlinedButton',
  ICON_BUTTON = 'IconButton',
  TEXT_FIELD = 'TextField',
  TEXT_FORM_FIELD = 'TextFormField',
  CARD = 'Card',
  LIST_VIEW = 'ListView',
  GRID_VIEW = 'GridView',
  IMAGE = 'Image',
  ICON = 'Icon',
  DIVIDER = 'Divider',
  EXPANDED = 'Expanded',
  FLEXIBLE = 'Flexible',
  WRAP = 'Wrap',
  ASPECT_RATIO = 'AspectRatio',
  FITTED_BOX = 'FittedBox',
  LIST_TILE = 'ListTile',
  CHECKBOX = 'Checkbox',
  RADIO = 'Radio',
  SWITCH = 'Switch',
  SLIDER = 'Slider',
  DROPDOWN_BUTTON = 'DropdownButton',
  CIRCULAR_PROGRESS = 'CircularProgressIndicator',
  LINEAR_PROGRESS = 'LinearProgressIndicator',
  DRAWER = 'Drawer',
  BOTTOM_NAV_BAR = 'BottomNavigationBar',
  TAB_BAR = 'TabBar',
  FAB = 'FloatingActionButton',
  POPUP_MENU = 'PopupMenuButton',
  TOOLTIP = 'Tooltip',
  FORM = 'Form',

  // Generic fallback for unknown types
  CUSTOM = 'Custom'

}

export interface WidgetProperties {
  // Common properties
  key?: string;

  // Container properties
  width?: number;
  height?: number;
  color?: string;
  padding?: EdgeInsets;
  margin?: EdgeInsets;
  decoration?: BoxDecoration;
  alignment?: Alignment;

  // Text properties
  text?: string;
  fontSize?: number;
  fontWeight?: FontWeight;
  fontStyle?: FontStyle;
  textAlign?: TextAlign;
  textColor?: string;

  // Column/Row properties
  mainAxisAlignment?: MainAxisAlignment;
  crossAxisAlignment?: CrossAxisAlignment;
  mainAxisSize?: MainAxisSize;

  // AppBar properties
  title?: string;
  backgroundColor?: string;
  elevation?: number;
}

export interface EdgeInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface BoxDecoration {
  color?: string;
  borderRadius?: number;
  border?: Border;
  boxShadow?: BoxShadow[];
}

export interface Border {
  color: string;
  width: number;
  style: 'solid' | 'dashed' | 'dotted';
}

export interface BoxShadow {
  color: string;
  offsetX: number;
  offsetY: number;
  blurRadius: number;
  spreadRadius: number;
}

export interface LayoutConstraints {
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
}

export enum Alignment {
  TOP_LEFT = 'topLeft',
  TOP_CENTER = 'topCenter',
  TOP_RIGHT = 'topRight',
  CENTER_LEFT = 'centerLeft',
  CENTER = 'center',
  CENTER_RIGHT = 'centerRight',
  BOTTOM_LEFT = 'bottomLeft',
  BOTTOM_CENTER = 'bottomCenter',
  BOTTOM_RIGHT = 'bottomRight',
}

export enum MainAxisAlignment {
  START = 'start',
  END = 'end',
  CENTER = 'center',
  SPACE_BETWEEN = 'spaceBetween',
  SPACE_AROUND = 'spaceAround',
  SPACE_EVENLY = 'spaceEvenly',
}

export enum CrossAxisAlignment {
  START = 'start',
  END = 'end',
  CENTER = 'center',
  STRETCH = 'stretch',
  BASELINE = 'baseline',
}

export enum MainAxisSize {
  MIN = 'min',
  MAX = 'max',
}

export enum FontWeight {
  W100 = '100',
  W200 = '200',
  W300 = '300',
  W400 = '400',
  W500 = '500',
  W600 = '600',
  W700 = '700',
  W800 = '800',
  W900 = '900',
}

export enum FontStyle {
  NORMAL = 'normal',
  ITALIC = 'italic',
}

export enum TextAlign {
  LEFT = 'left',
  RIGHT = 'right',
  CENTER = 'center',
  JUSTIFY = 'justify',
}

// Widget Definition for registry
export interface WidgetDefinition {
  type: WidgetType;
  displayName: string;
  icon: string;
  category: WidgetCategory;
  isContainer: boolean;
  defaultProperties: Partial<WidgetProperties>;
  acceptsChildren: boolean;
  maxChildren?: number;
}

export enum WidgetCategory {
  LAYOUT = 'Layout',
  BASIC = 'Basic',
  MATERIAL = 'Material',
  FORM = 'Form',
  NAVIGATION = 'Navigation',
}

// Helper function to create EdgeInsets
export function createEdgeInsets(value: number | { top?: number; right?: number; bottom?: number; left?: number }): EdgeInsets {
  if (typeof value === 'number') {
    return { top: value, right: value, bottom: value, left: value };
  }
  return {
    top: value.top || 0,
    right: value.right || 0,
    bottom: value.bottom || 0,
    left: value.left || 0,
  };
}
