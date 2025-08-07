// src/app/features/builder/components/property-editors/color-picker.component.ts

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-color-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="color-picker-container">
      <div class="color-input-group">
        <div
          class="color-preview"
          [style.backgroundColor]="value"
          (click)="togglePicker()">
        </div>
        <input
          type="text"
          [value]="value"
          (input)="onTextInput($event)"
          (blur)="onBlur()"
          placeholder="#000000"
          class="color-text-input">
      </div>

      @if (showPicker) {
        <div class="color-picker-dropdown">
          <div class="preset-colors">
            @for (color of presetColors; track color) {
              <button
                class="preset-color"
                [style.backgroundColor]="color"
                (click)="selectColor(color)"
                [class.selected]="color === value">
              </button>
            }
          </div>
          <input
            type="color"
            [value]="value"
            (input)="onColorInput($event)"
            class="native-color-input">
        </div>
      }
    </div>
  `,
  styles: [`
    .color-picker-container {
      @apply relative;
    }
    .color-input-group {
      @apply flex items-center gap-2;
    }
    .color-preview {
      @apply w-8 h-8 rounded border-2 border-gray-300 cursor-pointer;
    }
    .color-text-input {
      @apply flex-1 px-2 py-1.5 text-sm font-mono border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500;
    }
    .color-picker-dropdown {
      @apply absolute top-full left-0 mt-1 p-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50;
    }
    .preset-colors {
      @apply grid grid-cols-8 gap-1 mb-2;
    }
    .preset-color {
      @apply w-6 h-6 rounded border border-gray-300 cursor-pointer hover:scale-110 transition-transform;
    }
    .preset-color.selected {
      @apply ring-2 ring-blue-500;
    }
    .native-color-input {
      @apply w-full h-8 cursor-pointer;
    }
  `]
})
export class ColorPickerComponent {
  @Input() value: string = '#000000';
  @Output() valueChange = new EventEmitter<string>();

  showPicker = false;
  presetColors = [
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
    '#808080', '#C0C0C0', '#800000', '#008000', '#000080', '#808000', '#800080', '#008080',
    '#FFA500', '#A52A2A', '#8B4513', '#2F4F4F', '#708090', '#FF69B4', '#CD5C5C', '#4682B4',
    '#D2691E', '#FF6347', '#40E0D0', '#EE82EE', '#F0E68C', '#90EE90', '#FFB6C1', '#87CEEB'
  ];

  togglePicker() {
    this.showPicker = !this.showPicker;
  }

  selectColor(color: string) {
    this.valueChange.emit(color);
    this.showPicker = false;
  }

  onColorInput(event: Event) {
    const color = (event.target as HTMLInputElement).value;
    this.valueChange.emit(color);
  }

  onTextInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    if (this.isValidColor(value)) {
      this.valueChange.emit(value);
    }
  }

  onBlur() {
    this.showPicker = false;
  }

  private isValidColor(color: string): boolean {
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return hexRegex.test(color);
  }
}
