// src/app/features/builder/components/canvas/canvas.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WidgetRendererComponent } from '../widget-renderer/widget-renderer.component';
import { WidgetRegistryService } from '../../../../core/services/widget-registry.service';
import { FlutterWidget } from '../../../../core/models/flutter-widget.model';

@Component({
  selector: 'app-canvas',
  standalone: true,
  imports: [CommonModule, WidgetRendererComponent],
  template: `
    <div class="canvas-container">
      <div class="canvas-header">
        <h3 class="text-sm font-medium text-gray-700">Canvas</h3>
        <div class="device-info">
          <span class="text-xs text-gray-500">Device: iPhone 14 (390 × 844)</span>
        </div>
      </div>

      <div class="canvas-viewport">
        <div class="device-frame">
          <div class="device-screen">
            @if (rootWidget) {
              <app-widget-renderer [widget]="rootWidget"></app-widget-renderer>
            } @else {
              <div class="empty-canvas">
                <svg class="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z">
                  </path>
                </svg>
                <p class="mt-4 text-sm text-gray-500">Canvas is empty</p>
                <p class="text-xs text-gray-400 mt-1">Widgets will appear here</p>
              </div>
            }
          </div>
        </div>
      </div>

      <div class="canvas-footer">
        <div class="zoom-controls">
          <button class="zoom-btn" (click)="zoomOut()">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path>
            </svg>
          </button>
          <span class="zoom-level">{{ zoomLevel }}%</span>
          <button class="zoom-btn" (click)="zoomIn()">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
            </svg>
          </button>
          <button class="zoom-btn ml-2" (click)="resetZoom()">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .canvas-container {
      @apply h-full flex flex-col bg-gray-50;
    }

    .canvas-header {
      @apply flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200;
    }

    .canvas-viewport {
      @apply flex-1 overflow-auto p-8 flex items-center justify-center;
      background-image:
        linear-gradient(45deg, #f0f0f0 25%, transparent 25%),
        linear-gradient(-45deg, #f0f0f0 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, #f0f0f0 75%),
        linear-gradient(-45deg, transparent 75%, #f0f0f0 75%);
      background-size: 20px 20px;
      background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
    }

    .device-frame {
      @apply bg-gray-900 rounded-3xl p-3 shadow-2xl;
      width: 390px;
      height: 844px;
      transform: scale(var(--zoom-level, 1));
      transform-origin: center;
      transition: transform 0.3s ease;
    }

    .device-screen {
      @apply bg-white rounded-2xl w-full h-full overflow-hidden;
    }

    .empty-canvas {
      @apply h-full flex flex-col items-center justify-center;
    }

    .canvas-footer {
      @apply px-4 py-2 bg-white border-t border-gray-200;
    }

    .zoom-controls {
      @apply flex items-center gap-2;
    }

    .zoom-btn {
      @apply p-1 rounded hover:bg-gray-100 transition-colors;
    }

    .zoom-level {
      @apply text-sm text-gray-600 min-w-[50px] text-center;
    }
  `]
})
export class CanvasComponent implements OnInit {
  rootWidget: FlutterWidget | null = null;
  zoomLevel = 100;

  constructor(private widgetRegistry: WidgetRegistryService) {}

  ngOnInit() {
    // Load sample widget tree for Phase 1
    this.rootWidget = this.widgetRegistry.createSampleWidgetTree();
  }

  zoomIn() {
    if (this.zoomLevel < 200) {
      this.zoomLevel += 10;
      this.updateZoom();
    }
  }

  zoomOut() {
    if (this.zoomLevel > 50) {
      this.zoomLevel -= 10;
      this.updateZoom();
    }
  }

  resetZoom() {
    this.zoomLevel = 100;
    this.updateZoom();
  }

  private updateZoom() {
    const deviceFrame = document.querySelector('.device-frame') as HTMLElement;
    if (deviceFrame) {
      deviceFrame.style.setProperty('--zoom-level', (this.zoomLevel / 100).toString());
    }
  }
}
