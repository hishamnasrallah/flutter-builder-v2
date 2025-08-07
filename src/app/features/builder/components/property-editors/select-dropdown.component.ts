// src/app/features/builder/components/property-editors/select-dropdown.component.ts

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-select-dropdown',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <select
      [value]="value"
      (change)="onChange($event)"
      class="select-dropdown">
      @for (option of options; track option.value) {
        <option [value]="option.value">{{ option.label }}</option>
      }
    </select>
  `,
  styles: [`
    .select-dropdown {
      @apply w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white;
    }
  `]
})
export class SelectDropdownComponent {
  @Input() value: any;
  @Input() options: { label: string; value: any }[] = [];
  @Output() valueChange = new EventEmitter<any>();

  onChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.valueChange.emit(value);
  }
}
