// src/app/features/builder/components/property-editors/text-input.component.ts

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-text-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <input
      type="text"
      [value]="value"
      [placeholder]="placeholder"
      (input)="onInput($event)"
      (blur)="onBlur()"
      class="text-input">
  `,
  styles: [`
    .text-input {
      @apply w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500;
    }
  `]
})
export class TextInputComponent {
  @Input() value: string = '';
  @Input() placeholder: string = '';
  @Output() valueChange = new EventEmitter<string>();

  private tempValue: string = '';

  onInput(event: Event) {
    this.tempValue = (event.target as HTMLInputElement).value;
  }

  onBlur() {
    if (this.tempValue !== this.value) {
      this.valueChange.emit(this.tempValue);
    }
  }
}
