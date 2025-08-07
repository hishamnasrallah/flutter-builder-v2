// src/app/features/builder/components/property-editors/spacing-editor.component.ts

import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface SpacingValue {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

@Component({
  selector: 'app-spacing-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="spacing-editor">
      <div class="spacing-controls">
        <button
          class="link-btn"
          (click)="toggleLinked()"
          [class.linked]="isLinked"
          title="{{ isLinked ? 'Unlink values' : 'Link values' }}">
          @if (isLinked) {
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1">
              </path>
            </svg>
          } @else {
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l.75-.75m1.878-1.879l.75-.75a4 4 0 00-5.656-5.656l-.75.75">
              </path>
            </svg>
          }
        </button>
        @if (isLinked) {
          <div class="spacing-input-group">
            <label class="spacing-label">All</label>
            <input
              type="number"
              [value]="safeValue.top"
              (input)="onLinkedChange($event)"
              class="spacing-input">
          </div>
        } @else {
          <div class="spacing-grid">
            <div class="spacing-input-group">
              <label class="spacing-label">T</label>
              <input
                type="number"
                [value]="safeValue.top"
                (input)="onValueChange('top', $event)"
                class="spacing-input">
            </div>
            <div class="spacing-input-group">
              <label class="spacing-label">R</label>
              <input
                type="number"
                [value]="safeValue.right"
                (input)="onValueChange('right', $event)"
                class="spacing-input">
            </div>
            <div class="spacing-input-group">
              <label class="spacing-label">B</label>
              <input
                type="number"
                [value]="safeValue.bottom"
                (input)="onValueChange('bottom', $event)"
                class="spacing-input">
            </div>
            <div class="spacing-input-group">
              <label class="spacing-label">L</label>
              <input
                type="number"
                [value]="safeValue.left"
                (input)="onValueChange('left', $event)"
                class="spacing-input">
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .spacing-editor {
      @apply space-y-2;
    }
    .spacing-controls {
      @apply flex items-center gap-2;
    }
    .link-btn {
      @apply p-1.5 rounded hover:bg-gray-100 transition-colors;
    }
    .link-btn.linked {
      @apply text-blue-600 bg-blue-50;
    }
    .spacing-grid {
      @apply grid grid-cols-4 gap-1 flex-1;
    }
    .spacing-input-group {
      @apply flex items-center gap-1;
    }
    .spacing-label {
      @apply text-xs text-gray-500 w-4;
    }
    .spacing-input {
      @apply flex-1 px-1 py-1 text-sm text-center border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500;
    }
  `]
})
export class SpacingEditorComponent implements OnInit {
  @Input() value: SpacingValue = { top: 0, right: 0, bottom: 0, left: 0 };
  @Output() valueChange = new EventEmitter<SpacingValue>();

  isLinked = false;

  get safeValue(): SpacingValue {
    return this.value || { top: 0, right: 0, bottom: 0, left: 0 };
  }

  ngOnInit() {
    // Ensure value is always an object before checking properties
    if (!this.value) {
      this.value = { top: 0, right: 0, bottom: 0, left: 0 };
    }
    // Check if all values are the same (linked)
    const safe = this.safeValue;
    this.isLinked = safe.top === safe.right &&
                   safe.top === safe.bottom &&
                   safe.top === safe.left;
  }

  toggleLinked() {
    this.isLinked = !this.isLinked;
    if (this.isLinked) {
      // Set all values to top value
      const linkedValue = this.safeValue.top;
      this.valueChange.emit({
        top: linkedValue,
        right: linkedValue,
        bottom: linkedValue,
        left: linkedValue
      });
    }
  }

  onLinkedChange(event: Event) {
    const value = parseInt((event.target as HTMLInputElement).value) || 0;
    this.valueChange.emit({
      top: value,
      right: value,
      bottom: value,
      left: value
    });
  }

  onValueChange(side: keyof SpacingValue, event: Event) {
    const value = parseInt((event.target as HTMLInputElement).value) || 0;
    this.valueChange.emit({
      ...this.safeValue,
      [side]: value
    });
  }


}
