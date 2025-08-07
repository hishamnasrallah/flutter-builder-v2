// src/app/features/builder/components/property-editors/toggle-switch.component.ts

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-toggle-switch',
  standalone: true,
  imports: [CommonModule],
  template: `
    <label class="toggle-switch">
      <input
        type="checkbox"
        [checked]="value"
        (change)="onChange($event)"
        class="sr-only">
      <span class="toggle-slider" [class.active]="value">
        <span class="toggle-label">{{ value ? 'ON' : 'OFF' }}</span>
      </span>
    </label>
  `,
  styles: [`
    .toggle-switch {
      @apply relative inline-block w-12 h-6 cursor-pointer;
    }
    .sr-only {
      @apply absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0;
    }
    .toggle-slider {
      @apply absolute inset-0 bg-gray-300 rounded-full transition-all duration-200 flex items-center;
    }
    .toggle-slider.active {
      @apply bg-blue-600;
    }
    .toggle-slider::before {
      content: '';
      @apply absolute left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 shadow-sm;
    }
    .toggle-slider.active::before {
      @apply translate-x-6;
    }
    .toggle-label {
      @apply absolute text-xs font-medium transition-all duration-200;
      font-size: 8px;
      left: 50%;
      transform: translateX(-50%);
      color: white;
      opacity: 0.7;
    }
  `]
})
export class ToggleSwitchComponent {
  @Input() value: boolean = false;
  @Output() valueChange = new EventEmitter<boolean>();

  onChange(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.valueChange.emit(checked);
  }
}
