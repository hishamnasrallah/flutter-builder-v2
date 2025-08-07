// src/app/features/builder/components/property-editors/number-input.component.ts

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-number-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="number-input-container">
      <button
        class="stepper-btn"
        (click)="decrement()"
        [disabled]="min !== undefined && value <= min">
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path>
        </svg>
      </button>
      <input
        type="number"
        [value]="value"
        [min]="min"
        [max]="max"
        [step]="step"
        (input)="onInput($event)"
        (blur)="onBlur()"
        class="number-input">
      @if (unit) {
        <span class="unit-label">{{ unit }}</span>
      }
      <button
        class="stepper-btn"
        (click)="increment()"
        [disabled]="max !== undefined && value >= max">
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
        </svg>
      </button>
    </div>
  `,
  styles: [`
    .number-input-container {
      @apply flex items-center gap-1;
    }
    .number-input {
      @apply flex-1 px-2 py-1.5 text-sm text-center border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500;
    }
    .stepper-btn {
      @apply p-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed;
    }
    .unit-label {
      @apply text-xs text-gray-500 px-1;
    }
  `]
})
export class NumberInputComponent {
  @Input() value: number = 0;
  @Input() min?: number;
  @Input() max?: number;
  @Input() step: number = 1;
  @Input() unit?: string;
  @Output() valueChange = new EventEmitter<number>();

  increment() {
    const newValue = this.value + this.step;
    if (this.max === undefined || newValue <= this.max) {
      this.valueChange.emit(newValue);
    }
  }

  decrement() {
    const newValue = this.value - this.step;
    if (this.min === undefined || newValue >= this.min) {
      this.valueChange.emit(newValue);
    }
  }

  onInput(event: Event) {
    const value = parseFloat((event.target as HTMLInputElement).value);
    if (!isNaN(value)) {
      this.valueChange.emit(value);
    }
  }

  onBlur() {
    // Ensure value is within bounds
    let value = this.value;
    if (this.min !== undefined && value < this.min) value = this.min;
    if (this.max !== undefined && value > this.max) value = this.max;
    if (value !== this.value) {
      this.valueChange.emit(value);
    }
  }
}
