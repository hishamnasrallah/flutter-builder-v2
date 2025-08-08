// src/app/features/builder/components/widget-palette/widget-palette.component.ts
import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {CdkDrag, CdkDragPreview, CdkDropList} from '@angular/cdk/drag-drop';
import {
  WidgetDefinition,
  WidgetCategory,
  WidgetType
} from '../../../../core/models/flutter-widget.model';
import {WidgetRegistryService} from '../../../../core/services/widget-registry.service';
import {CanvasStateService, DragData} from '../../../../core/services/canvas-state.service';
import {
  ComponentTemplateService,
  BackendComponentTemplate,
  OrganizedComponentsResponse
} from '../../../../core/services/component-template.service'; // Import BackendComponentTemplate
import {NotificationService} from '../../../../core/services/notification.service';

interface CategoryGroup {
  category: string;
  displayName: string;
  widgets: WidgetDefinition[]; // Now holds WidgetDefinition
  isExpanded: boolean;
}

@Component({
  selector: 'app-widget-palette',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="widget-palette">
      <div class="palette-header">
        <h3 class="text-sm font-semibold text-gray-700">Widget Library</h3>
        <button
          class="text-xs text-blue-600 hover:text-blue-700"
          (click)="expandAll()">
          Expand All
        </button>
      </div>

      <div class="palette-search">
        <input
          type="text"
          placeholder="Search widgets..."
          [(ngModel)]="searchTerm"
          (input)="filterWidgets()"
          class="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500">
      </div>

      <div class="palette-categories">
        @for (group of filteredGroups; track group.category) {
          <div class="category-group">
            <button
              class="category-header"
              (click)="toggleCategory(group)"
              [class.expanded]="group.isExpanded">
              <svg
                class="w-3 h-3 transition-transform"
                [class.rotate-90]="group.isExpanded"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
              </svg>
              <span class="category-name">{{ group.displayName }}</span>
              <span class="category-count">{{ group.widgets.length }}</span>
            </button>

            @if (group.isExpanded) {
              <div class="category-widgets">
                @for (widget of group.widgets; track $index) {
                  <div
                    class="widget-item"
                    draggable="true"
                    (dragstart)="onNativeDragStart($event, widget)"
                    (dragend)="onNativeDragEnd($event)">

                    <!-- Widget display in palette -->
                    <div class="widget-icon">{{ widget.icon }}</div>
                    <div class="widget-info">
                      <div class="widget-name">{{ widget.displayName }}</div>
                      <div class="widget-type">{{ widget.type }}</div>
                    </div>
                    <div class="widget-drag-handle">
                      <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z">
                        </path>
                      </svg>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        }
      </div>

      @if (filteredGroups.length === 0 && searchTerm) {
        <div class="no-results">
          <svg class="w-12 h-12 text-gray-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
          <p class="text-sm text-gray-500 mt-2">No widgets found for "{{ searchTerm }}"</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .widget-palette {
      @apply h-full flex flex-col bg-white;
    }

    .palette-header {
      @apply flex items-center justify-between px-4 py-3 border-b border-gray-200;
    }

    .palette-search {
      @apply px-4 py-3 border-b border-gray-200;
    }

    .palette-categories {
      @apply flex-1 overflow-y-auto;
    }

    .category-group {
      @apply border-b border-gray-100;
    }

    .category-header {
      @apply w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-gray-50 transition-colors;
    }

    .category-header.expanded {
      @apply bg-gray-50;
    }

    .category-name {
      @apply flex-1 text-sm font-medium text-gray-700;
    }

    .category-count {
      @apply text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full;
    }

    .category-widgets {
      @apply px-2 py-2 bg-gray-50;
    }

    .widget-item {
      @apply flex items-center gap-3 p-3 mb-1 bg-white rounded-lg border border-gray-200 cursor-copy hover:border-blue-300 hover:shadow-sm transition-all relative;
    }

    .widget-item::after {
      content: '+';
      @apply absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold opacity-0 transition-opacity;
    }

    .widget-item:hover::after {
      @apply opacity-100;
    }

    .widget-item.dragging {
      @apply opacity-50;
    }

    .widget-item.cdk-drag-animating {
      @apply transition-transform duration-200;
    }

    .widget-icon {
      @apply w-8 h-8 flex items-center justify-center bg-blue-50 text-blue-600 rounded text-lg font-bold;
    }

    .widget-info {
      @apply flex-1;
    }

    .widget-name {
      @apply text-sm font-medium text-gray-800;
    }

    .widget-type {
      @apply text-xs text-gray-500;
    }

    .widget-drag-handle {
      @apply opacity-50 hover:opacity-100 transition-opacity;
    }

    .widget-drag-preview {
      @apply flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg shadow-xl;
    }

    .preview-icon {
      @apply text-lg font-bold;
    }

    .preview-name {
      @apply text-sm font-medium;
    }

    .no-results {
      @apply text-center py-8;
    }

    /* CDK Drag global styles */
    :global(.cdk-drag-placeholder) {
      @apply opacity-0;
    }

    :global(.cdk-drop-list-dragging) {
      @apply cursor-move;
    }
  `]
})
export class WidgetPaletteComponent implements OnInit {
  categoryGroups: CategoryGroup[] = [];
  filteredGroups: CategoryGroup[] = [];
  searchTerm: string = '';

  constructor(
    private widgetRegistry: WidgetRegistryService,
    private canvasState: CanvasStateService,
    private componentTemplateService: ComponentTemplateService,
    private notification: NotificationService
  ) {
  }

  ngOnInit() {
    this.loadDynamicWidgets();
  }

  private loadDynamicWidgets(): void {
    this.componentTemplateService.getOrganizedComponents().subscribe({
      next: (response: OrganizedComponentsResponse) => {
        if (response && response.components) {
          // First, register all component templates with the WidgetRegistryService
          for (const groupName in response.components) {
            if (response.components.hasOwnProperty(groupName)) {
              response.components[groupName].forEach(template => {
                // Only register if show_in_builder is true or undefined (default to true)
                if (template.show_in_builder !== false) {
                  this.widgetRegistry.registerWidgetDefinition(template);
                }
              });
            }
          }

          // Then, build the category groups for the palette UI
          this.buildCategoryGroups(response.components);
        } else {
          this.notification.showWarning('No organized components found from backend.');
          // Fallback to static definitions if no data or unexpected format
          this.initializeStaticCategories();
        }
      },
      error: (error) => {
        console.error('Error loading dynamic widgets:', error);
        this.notification.showWarning('Failed to load widgets from server, using defaults');
        this.initializeStaticCategories(); // Fallback to static definitions
      }
    });
  }

  private buildCategoryGroups(componentsByGroup: { [groupName: string]: BackendComponentTemplate[] }): void {
    this.categoryGroups = Object.entries(componentsByGroup)
      .map(([groupName, templates]) => {
        const widgets: WidgetDefinition[] = templates
          .filter(template => template.show_in_builder !== false) // Filter out hidden widgets
          .map(template => this.widgetRegistry.getWidgetDefinition(
            this.widgetRegistry.normalizeBackendWidgetType(template.flutter_widget)
          ))
          .filter((def): def is WidgetDefinition => def !== undefined); // Filter out any undefined definitions

        return {
          category: groupName,
          displayName: groupName,
          widgets: widgets,
          isExpanded: groupName.toLowerCase().includes('basic') || groupName.toLowerCase().includes('layout') // Default expansion logic
        };
      })
      .filter(group => group.widgets.length > 0); // Only show groups with widgets

    // Sort groups by display order if available, otherwise alphabetically
    this.categoryGroups.sort((a, b) => {
      // You might need to add a 'group_order' to your backend response if you want specific ordering
      // For now, sort alphabetically by display name
      return a.displayName.localeCompare(b.displayName);
    });

    this.filteredGroups = [...this.categoryGroups];
  }

  // This method is now a fallback, keep it for development/testing
  private initializeStaticCategories(): void {
    // This method should only be called if backend data fails to load
    // Create minimal static widget definitions for fallback

    // First, register some basic widget definitions if they don't exist
    if (!this.widgetRegistry.getWidgetDefinition(WidgetType.CONTAINER)) {
      this.widgetRegistry.registerWidgetDefinition({
        flutter_widget: 'container',
        name: 'Container',
        category: 'layout',
        icon: 'crop_square',
        default_properties: {width: 200, height: 200, color: '#FFFFFF'},
        can_have_children: true,
        max_children: 1,
        is_active: true,
        show_in_builder: true
      });
    }

    if (!this.widgetRegistry.getWidgetDefinition(WidgetType.TEXT)) {
      this.widgetRegistry.registerWidgetDefinition({
        flutter_widget: 'text',
        name: 'Text',
        category: 'display',
        icon: 'text_fields',
        default_properties: {text: 'Hello World', fontSize: 16, textColor: '#000000'},
        can_have_children: false,
        is_active: true,
        show_in_builder: true
      });
    }

    if (!this.widgetRegistry.getWidgetDefinition(WidgetType.COLUMN)) {
      this.widgetRegistry.registerWidgetDefinition({
        flutter_widget: 'column',
        name: 'Column',
        category: 'layout',
        icon: 'view_column',
        default_properties: {mainAxisAlignment: 'start', crossAxisAlignment: 'center'},
        can_have_children: true,
        is_active: true,
        show_in_builder: true
      });
    }

    if (!this.widgetRegistry.getWidgetDefinition(WidgetType.ROW)) {
      this.widgetRegistry.registerWidgetDefinition({
        flutter_widget: 'row',
        name: 'Row',
        category: 'layout',
        icon: 'view_stream',
        default_properties: {mainAxisAlignment: 'start', crossAxisAlignment: 'center'},
        can_have_children: true,
        is_active: true,
        show_in_builder: true
      });
    }

    if (!this.widgetRegistry.getWidgetDefinition(WidgetType.ELEVATED_BUTTON)) {
      this.widgetRegistry.registerWidgetDefinition({
        flutter_widget: 'elevated_button',
        name: 'Elevated Button',
        category: 'input',
        icon: 'smart_button',
        default_properties: {text: 'Button'},
        can_have_children: false,
        is_active: true,
        show_in_builder: true
      });
    }

    if (!this.widgetRegistry.getWidgetDefinition(WidgetType.TEXT_FIELD)) {
      this.widgetRegistry.registerWidgetDefinition({
        flutter_widget: 'text_field',
        name: 'Text Field',
        category: 'input',
        icon: 'input',
        default_properties: {hintText: 'Enter text...'},
        can_have_children: false,
        is_active: true,
        show_in_builder: true
      });
    }

    // Now get all widget definitions and group them by category
    const allDefinitions = this.widgetRegistry.getAllWidgetDefinitions();
    const categoryMap = new Map<string, WidgetDefinition[]>();

    allDefinitions.forEach(def => {
      const categoryName = def.category.toString(); // Convert enum to string
      if (!categoryMap.has(categoryName)) {
        categoryMap.set(categoryName, []);
      }
      categoryMap.get(categoryName)!.push(def);
    });

    this.categoryGroups = Array.from(categoryMap.entries()).map(([cat, widgets]) => ({
      category: cat,
      displayName: cat,
      widgets: widgets,
      isExpanded: true
    }));

    this.filteredGroups = [...this.categoryGroups];
  }

  toggleCategory(group: CategoryGroup): void {
    group.isExpanded = !group.isExpanded;
  }

  expandAll(): void {
    const allExpanded = this.categoryGroups.every(g => g.isExpanded);
    this.categoryGroups.forEach(g => g.isExpanded = !allExpanded);
  }

  filterWidgets(): void {
    if (!this.searchTerm.trim()) {
      this.filteredGroups = [...this.categoryGroups];
      return;
    }

    const searchLower = this.searchTerm.toLowerCase();

    this.filteredGroups = this.categoryGroups
      .map(group => ({
        ...group,
        widgets: group.widgets.filter(widget =>
          widget.displayName.toLowerCase().includes(searchLower) ||
          widget.type.toLowerCase().includes(searchLower)
        ),
        isExpanded: true // Auto-expand when searching
      }))
      .filter(group => group.widgets.length > 0);
  }

  onNativeDragStart(event: DragEvent, widget: WidgetDefinition): void {
    console.log('WidgetPaletteComponent: onNativeDragStart - Received widget:', widget);
    console.log('WidgetPaletteComponent: onNativeDragStart - widget.type (from received object):', widget.type);

    const dragData: DragData = {
      type: 'new-widget',
      widgetType: widget.type, // This is crucial
      sourceData: widget
    };
    console.log('WidgetPaletteComponent: onNativeDragStart - Created dragData:', dragData);
    event.dataTransfer!.effectAllowed = 'copy';
    event.dataTransfer!.setData('application/json', JSON.stringify(dragData));

    const element = event.target as HTMLElement;
    element.classList.add('dragging');
    this.canvasState.setDragging(true);
  }

  onNativeDragEnd(event: DragEvent): void {
    const element = event.target as HTMLElement;
    element.classList.remove('dragging');
    this.canvasState.setDragging(false);
  }
}
