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
  templateUrl:'properties-panel.component.html',
  styleUrl:'properties-panel.component.scss'
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
