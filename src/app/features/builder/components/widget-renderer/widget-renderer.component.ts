// src/app/features/builder/components/widget-renderer/widget-renderer.component.ts

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FlutterWidget,
  WidgetType,
  MainAxisAlignment,
  CrossAxisAlignment,
  Alignment
} from '../../../../core/models/flutter-widget.model';

@Component({
  selector: 'app-widget-renderer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [ngClass]="getWidgetClasses()" [ngStyle]="getWidgetStyles()">
      @switch (widget.type) {
        <!-- Container Widget -->
        @case (WidgetType.CONTAINER) {
          @if (widget.children.length > 0) {
            @for (child of widget.children; track child.id) {
              <app-widget-renderer [widget]="child"></app-widget-renderer>
            }
          } @else {
            <div class="text-gray-400 text-sm">Container</div>
          }
        }

        <!-- Text Widget -->
        @case (WidgetType.TEXT) {
          <span [ngStyle]="getTextStyles()">{{ widget.properties.text || 'Text' }}</span>
        }

        <!-- Column Widget -->
        @case (WidgetType.COLUMN) {
          <div class="flutter-column" [ngStyle]="getFlexContainerStyles()">
            @if (widget.children.length > 0) {
              @for (child of widget.children; track child.id) {
                <app-widget-renderer [widget]="child"></app-widget-renderer>
              }
            } @else {
              <div class="text-gray-400 text-sm">Column</div>
            }
          </div>
        }

        <!-- Row Widget -->
        @case (WidgetType.ROW) {
          <div class="flutter-row" [ngStyle]="getFlexContainerStyles()">
            @if (widget.children.length > 0) {
              @for (child of widget.children; track child.id) {
                <app-widget-renderer [widget]="child"></app-widget-renderer>
              }
            } @else {
              <div class="text-gray-400 text-sm">Row</div>
            }
          </div>
        }

        <!-- Stack Widget -->
        @case (WidgetType.STACK) {
          <div class="relative w-full h-full min-h-[100px]">
            @if (widget.children.length > 0) {
              @for (child of widget.children; track child.id) {
                <div class="absolute" [ngStyle]="getStackChildPosition(child)">
                  <app-widget-renderer [widget]="child"></app-widget-renderer>
                </div>
              }
            } @else {
              <div class="text-gray-400 text-sm">Stack</div>
            }
          </div>
        }

        <!-- Padding Widget -->
        @case (WidgetType.PADDING) {
          <div [ngStyle]="getPaddingStyles()">
            @if (widget.children.length > 0) {
              @for (child of widget.children; track child.id) {
                <app-widget-renderer [widget]="child"></app-widget-renderer>
              }
            } @else {
              <div class="text-gray-400 text-sm">Padding</div>
            }
          </div>
        }

        <!-- Center Widget -->
        @case (WidgetType.CENTER) {
          <div class="flex items-center justify-center w-full h-full">
            @if (widget.children.length > 0) {
              @for (child of widget.children; track child.id) {
                <app-widget-renderer [widget]="child"></app-widget-renderer>
              }
            } @else {
              <div class="text-gray-400 text-sm">Center</div>
            }
          </div>
        }

        <!-- SizedBox Widget -->
        @case (WidgetType.SIZED_BOX) {
          <div [ngStyle]="getSizedBoxStyles()">
            @if (widget.children.length > 0) {
              @for (child of widget.children; track child.id) {
                <app-widget-renderer [widget]="child"></app-widget-renderer>
              }
            } @else {
              <div class="text-gray-400 text-sm border border-dashed border-gray-300 w-full h-full flex items-center justify-center">
                SizedBox
              </div>
            }
          </div>
        }

        <!-- Scaffold Widget -->
        @case (WidgetType.SCAFFOLD) {
          <div class="w-full h-full bg-white">
            @for (child of widget.children; track child.id) {
              <app-widget-renderer [widget]="child"></app-widget-renderer>
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
  `]
})
export class WidgetRendererComponent {
  @Input() widget!: FlutterWidget;

  readonly WidgetType = WidgetType;

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

    // Common styles
    if (props.width) {
      styles.width = `${props.width}px`;
    }
    if (props.height) {
      styles.height = `${props.height}px`;
    }

    // Container specific styles
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

      // Apply alignment for container
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

    if (props.fontSize) {
      styles.fontSize = `${props.fontSize}px`;
    }
    if (props.textColor) {
      styles.color = props.textColor;
    }
    if (props.fontWeight) {
      styles.fontWeight = props.fontWeight;
    }
    if (props.fontStyle) {
      styles.fontStyle = props.fontStyle;
    }
    if (props.textAlign) {
      styles.textAlign = props.textAlign;
    }

    return styles;
  }

  getFlexContainerStyles(): any {
    const props = this.widget.properties;
    const styles: any = {};

    // Handle main axis alignment
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

    // Handle cross axis alignment
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

    if (props.width) {
      styles.width = `${props.width}px`;
    }
    if (props.height) {
      styles.height = `${props.height}px`;
    }

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

  getStackChildPosition(child: FlutterWidget): any {
    // In a real implementation, each child could have positioning properties
    // For now, we'll just stack them on top of each other
    return {
      top: '0',
      left: '0'
    };
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
