// src/app/features/builder/components/property-editors/alignment-picker.component.ts

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Alignment } from '../../../../core/models/flutter-widget.model';

@Component({
  selector: 'app-alignment-picker',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="alignment-picker">
      <div class="alignment-grid">
        @for (position of positions; track position.value) {
          <button
            class="alignment-btn"
            [class.selected]="value === position.value"
            (click)="selectAlignment(position.value)"
            [title]="position.label">
            <div class="alignment-dot"></div>
          </button>
        }
      </div>
    </div>
  `,
  styles: [`
    .alignment-picker {
      @apply p-2 bg-gray-50 rounded;
    }
    .alignment-grid {
      @apply grid grid-cols-3 gap-1;
    }
    .alignment-btn {
      @apply w-10 h-10 bg-white border border-gray-300 rounded hover:bg-gray-100 transition-colors relative;
    }
    .alignment-btn.selected {
      @apply bg-blue-100 border-blue-500;
    }
    .alignment-dot {
      @apply w-2 h-2 bg-gray-400 rounded-full absolute;
    }
    /* Position dots based on alignment */
    .alignment-btn:nth-child(1) .alignment-dot { @apply top-1 left-1; }
    .alignment-btn:nth-child(2) .alignment-dot { @apply top-1 left-1/2 -translate-x-1/2; }
    .alignment-btn:nth-child(3) .alignment-dot { @apply top-1 right-1; }
    .alignment-btn:nth-child(4) .alignment-dot { @apply top-1/2 left-1 -translate-y-1/2; }
    .alignment-btn:nth-child(5) .alignment-dot { @apply top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2; }
    .alignment-btn:nth-child(6) .alignment-dot { @apply top-1/2 right-1 -translate-y-1/2; }
    .alignment-btn:nth-child(7) .alignment-dot { @apply bottom-1 left-1; }
    .alignment-btn:nth-child(8) .alignment-dot { @apply bottom-1 left-1/2 -translate-x-1/2; }
    .alignment-btn:nth-child(9) .alignment-dot { @apply bottom-1 right-1; }

    .alignment-btn.selected .alignment-dot {
      @apply bg-blue-600;
    }
  `]
})
export class AlignmentPickerComponent {
  @Input() value: Alignment = Alignment.TOP_LEFT;
  @Output() valueChange = new EventEmitter<Alignment>();

  positions = [
    { value: Alignment.TOP_LEFT, label: 'Top Left' },
    { value: Alignment.TOP_CENTER, label: 'Top Center' },
    { value: Alignment.TOP_RIGHT, label: 'Top Right' },
    { value: Alignment.CENTER_LEFT, label: 'Center Left' },
    { value: Alignment.CENTER, label: 'Center' },
    { value: Alignment.CENTER_RIGHT, label: 'Center Right' },
    { value: Alignment.BOTTOM_LEFT, label: 'Bottom Left' },
    { value: Alignment.BOTTOM_CENTER, label: 'Bottom Center' },
    { value: Alignment.BOTTOM_RIGHT, label: 'Bottom Right' }
  ];

  selectAlignment(alignment: Alignment) {
    this.valueChange.emit(alignment);
  }
}
