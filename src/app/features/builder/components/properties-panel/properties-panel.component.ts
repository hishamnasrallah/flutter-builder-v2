// src/app/features/builder/components/properties-panel/properties-panel.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { FlutterWidget } from '../../../../core/models/flutter-widget.model';
import { PropertyEditorService, PropertyCategory } from '../../../../core/services/property-editor.service';
import { TextInputComponent } from '../property-editors/text-input.component';
import { ColorPickerComponent } from '../property-editors/color-picker.component';
import { SelectDropdownComponent } from '../property-editors/select-dropdown.component';
import { SpacingEditorComponent } from '../property-editors/spacing-editor.component';
import { NumberInputComponent } from '../property-editors/number-input.component';
import { AlignmentPickerComponent } from '../property-editors/alignment-picker.component';
import { ToggleSwitchComponent } from '../property-editors/toggle-switch.component';

@Component({
  selector: 'app-properties-panel',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TextInputComponent,
    ColorPickerComponent,
    SelectDropdownComponent,
    SpacingEditorComponent,
    NumberInputComponent,
    AlignmentPickerComponent,
    ToggleSwitchComponent
  ],
  template: `
    <div class="properties-panel">
      <div class="panel-header">
        <h3 class="text-sm font-semibold text-gray-700">Properties</h3>
        @if (selectedWidget) {
          <button
            class="text-xs text-blue-600 hover:text-blue-700"
            (click)="resetAllProperties()"
            title="Reset all properties to default">
            Reset All
          </button>
        }
      </div>

      <div class="panel-content">
        @if (selectedWidget) {
          <!-- Widget Info -->
          <div class="widget-info-card">
            <div class="widget-type-badge">
              <span class="widget-icon">{{ getWidgetIcon() }}</span>
              <span class="widget-type">{{ selectedWidget.type }}</span>
            </div>
            <div class="widget-id">
              <span class="text-xs text-gray-400">ID:</span>
              <span class="text-xs text-gray-600 font-mono">{{ selectedWidget.id.substring(0, 8) }}...</span>
            </div>
          </div>

          <!-- Property Categories -->
          @for (category of propertyCategories; track category.name) {
            <div class="property-category">
              <button
                class="category-header"
                (click)="toggleCategory(category)"
                [class.expanded]="category.expanded">
                <svg
                  class="w-3 h-3 transition-transform"
                  [class.rotate-90]="category.expanded"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
                <span class="category-icon">{{ category.icon }}</span>
                <span class="category-name">{{ category.name }}</span>
                <span class="category-count">{{ category.properties.length }}</span>
              </button>

              @if (category.expanded) {
                <div class="category-properties">
                  @for (property of category.properties; track property.key) {
                    @if (shouldShowProperty(property)) {
                      <div class="property-item">
                        <div class="property-header">
                          <label class="property-label">{{ property.label }}</label>
                        @if (hasCustomValue(property)) {
                          <button
                            class="reset-btn"
                            (click)="resetProperty(property.key)"
                            title="Reset to default">
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15">
                              </path>
                            </svg>
                          </button>
                        }
                      </div>
                        </div>
                    }

                      <!-- Property Editor based on type -->
                      @switch (property.type) {
                        @case ('text') {
                          <app-text-input
                            [value]="getPropertyValue(property.key)"
                            [placeholder]="property.label"
                            (valueChange)="onPropertyChange(property.key, $event)">
                          </app-text-input>
                        }
                        @case ('number') {
                          <app-number-input
                            [value]="getPropertyValue(property.key)"
                            [min]="property.min"
                            [max]="property.max"
                            [step]="property.step || 1"
                            [unit]="property.unit"
                            (valueChange)="onPropertyChange(property.key, $event)">
                          </app-number-input>
                        }
                        @case ('color') {
                          <app-color-picker
                            [value]="getPropertyValue(property.key)"
                            (valueChange)="onPropertyChange(property.key, $event)">
                          </app-color-picker>
                        }
                        @case ('select') {
                          <app-select-dropdown
                            [value]="getPropertyValue(property.key)"
                            [options]="property.options || []"
                            (valueChange)="onPropertyChange(property.key, $event)">
                          </app-select-dropdown>
                        }
                        @case ('spacing') {
                          <app-spacing-editor
                            [value]="getPropertyValue(property.key)"
                            (valueChange)="onPropertyChange(property.key, $event)">
                          </app-spacing-editor>
                        }
                        @case ('alignment') {
                          <app-alignment-picker
                            [value]="getPropertyValue(property.key)"
                            (valueChange)="onPropertyChange(property.key, $event)">
                          </app-alignment-picker>
                        }
                        @case ('boolean') {
                          <app-toggle-switch
                            [value]="getPropertyValue(property.key)"
                            (valueChange)="onPropertyChange(property.key, $event)">
                          </app-toggle-switch>
                        }
                      }

                      @if (getValidationError(property)) {
                        <div class="error-message">
                          {{ getValidationError(property) }}
                        </div>
                      }


                  }


                </div>

              }

            </div>
          }

        } @else {
          <!-- No Selection State -->
          <div class="no-selection">
            <svg class="w-16 h-16 text-gray-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4">
              </path>
            </svg>
            <p class="text-sm text-gray-500 mt-4">Select a widget to edit properties</p>
            <p class="text-xs text-gray-400 mt-1">Click any widget on the canvas</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .properties-panel {
      @apply h-full flex flex-col bg-white;
    }

    .panel-header {
      @apply flex items-center justify-between px-4 py-3 border-b border-gray-200;
    }

    .panel-content {
      @apply flex-1 overflow-y-auto;
    }

    .widget-info-card {
      @apply mx-4 mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200;
    }

    .widget-type-badge {
      @apply flex items-center gap-2 mb-2;
    }

    .widget-icon {
      @apply text-lg;
    }

    .widget-type {
      @apply text-sm font-semibold text-gray-700;
    }

    .widget-id {
      @apply flex items-center gap-2;
    }

    .property-category {
      @apply border-b border-gray-100;
    }

    .category-header {
      @apply w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-gray-50 transition-colors;
    }

    .category-header.expanded {
      @apply bg-gray-50;
    }

    .category-icon {
      @apply text-base;
    }

    .category-name {
      @apply flex-1 text-sm font-medium text-gray-700;
    }

    .category-count {
      @apply text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full;
    }

    .category-properties {
      @apply px-4 py-3 bg-gray-50 space-y-4;
    }

    .property-item {
      @apply space-y-2;
    }

    .property-header {
      @apply flex items-center justify-between;
    }

    .property-label {
      @apply text-xs font-medium text-gray-600;
    }

    .reset-btn {
      @apply p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors;
    }

    .error-message {
      @apply text-xs text-red-500 mt-1;
    }

    .no-selection {
      @apply py-16 text-center;
    }
  `]
})
export class PropertiesPanelComponent implements OnInit, OnDestroy {
  selectedWidget: FlutterWidget | null = null;
  propertyCategories: PropertyCategory[] = [];
  private destroy$ = new Subject<void>();
  private validationErrors = new Map<string, string>();

  constructor(private propertyEditor: PropertyEditorService) {}

  ngOnInit() {
    this.propertyEditor.currentWidget$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(widget => {
      this.selectedWidget = widget;
      this.propertyCategories = this.propertyEditor.getPropertiesForWidget(widget);
      this.validationErrors.clear();
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleCategory(category: PropertyCategory) {
    category.expanded = !category.expanded;
  }

  getPropertyValue(propertyKey: string): any {
    if (!this.selectedWidget) return null;
    return this.propertyEditor.getPropertyValue(this.selectedWidget, propertyKey);
  }

  onPropertyChange(propertyKey: string, value: any) {
    if (!this.selectedWidget) return;

    // Find the property definition
    const property = this.propertyCategories
      .flatMap(c => c.properties)
      .find(p => p.key === propertyKey);

    if (property) {
      // Validate the property
      const error = this.propertyEditor.validateProperty(property, value);
      if (error) {
        this.validationErrors.set(propertyKey, error);
        return;
      } else {
        this.validationErrors.delete(propertyKey);
      }
    }

    this.propertyEditor.updateProperty(this.selectedWidget.id, propertyKey, value);
  }

  resetProperty(propertyKey: string) {
    if (!this.selectedWidget) return;
    this.propertyEditor.resetProperty(this.selectedWidget.id, propertyKey);
    this.validationErrors.delete(propertyKey);
  }

  resetAllProperties() {
    if (!this.selectedWidget) return;
    if (confirm('Reset all properties to default values?')) {
      this.propertyEditor.resetAllProperties(this.selectedWidget.id);
      this.validationErrors.clear();
    }
  }

  hasCustomValue(property: any): boolean {
    const currentValue = this.getPropertyValue(property.key);
    return JSON.stringify(currentValue) !== JSON.stringify(property.defaultValue);
  }

  getValidationError(property: any): string | null {
    return this.validationErrors.get(property.key) || null;
  }

  getWidgetIcon(): string {
    // You can import the widget registry to get the actual icon
    const icons: Record<string, string> = {
      'Container': '□',
      'Text': 'T',
      'Column': '⬇',
      'Row': '➡',
      'Stack': '⬚',
      'Padding': '▫',
      'Center': '⊕',
      'SizedBox': '▭',
      'Scaffold': '📱',
      'AppBar': '━'
    };
    return icons[this.selectedWidget?.type || ''] || '?';
  }

shouldShowProperty(property: any): boolean {
    if (!property.dependsOn || property.dependsOn.length === 0) {
      return true;
    }

    // Check if all dependencies are met
    for (const dependency of property.dependsOn) {
      const value = this.getPropertyValue(dependency);
      // Show property if dependency has a truthy value
      if (!value || value === 0 || value === '') {
        return false;
      }
    }

    return true;
  }
}
