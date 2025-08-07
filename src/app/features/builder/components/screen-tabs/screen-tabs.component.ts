import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, debounceTime } from 'rxjs';
import { ScreenService } from '../../../../core/services/screen.service';
import { CanvasStateService } from '../../../../core/services/canvas-state.service';
import { NotificationService } from '../../../../core/services/notification.service';

interface Screen {
  id: number;
  project: number;
  name: string;
  route: string;
  is_home: boolean;
  ui_structure: any;
  created_at: string;
  updated_at: string;
}

@Component({
  selector: 'app-screen-tabs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './screen-tabs.component.html',
  styleUrl: './screen-tabs.component.scss'
})
export class ScreenTabsComponent implements OnInit, OnDestroy {
  @Input() projectId!: number;
  @Output() openScreenManager = new EventEmitter<void>();

  screens: Screen[] = [];
  activeScreenId: number | null = null;
  loading = false;
  savingIndicator = false;

  private destroy$ = new Subject<void>();
  private autoSave$ = new Subject<void>();

  constructor(
    private screenService: ScreenService,
    private canvasState: CanvasStateService,
    private notification: NotificationService
  ) {}

  ngOnInit() {
    this.loadScreens();
    this.setupAutoSave();

    // Listen for canvas changes
    this.canvasState.state$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.triggerAutoSave();
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.autoSave$.complete();
  }

  loadScreens() {
    if (!this.projectId) {
      this.screens = [];
      return;
    }

    this.loading = true;
    this.screenService.getScreens(this.projectId).subscribe({
      next: (screens) => {
        // Ensure screens is always an array
        this.screens = Array.isArray(screens) ? screens : [];
        this.loading = false;

        // Load the home screen or first screen
        if (this.screens.length > 0) {
          const homeScreen = this.screens.find(s => s.is_home) || this.screens[0];
          this.selectScreen(homeScreen);
        }
      },
      error: (error) => {
        console.error('Error loading screens:', error);
        this.notification.showError('Failed to load screens');
        this.screens = []; // Ensure screens is an empty array on error
        this.loading = false;
      }
    });
  }

  selectScreen(screen: Screen) {
    if (this.activeScreenId === screen.id) return;

    // Save current screen before switching
    if (this.activeScreenId) {
      this.saveCurrentScreen();
    }

    this.activeScreenId = screen.id;
    this.canvasState.loadScreen(screen.id);
  }

  setupAutoSave() {
    this.autoSave$
      .pipe(
        debounceTime(2000), // Wait 2 seconds after last change
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.saveCurrentScreen();
      });
  }

  triggerAutoSave() {
    this.autoSave$.next();
  }

  saveCurrentScreen() {
    if (!this.activeScreenId) return;

    const currentWidget = this.canvasState.currentState.rootWidget;
    if (!currentWidget) return;

    this.savingIndicator = true;

    this.screenService.updateUiStructure(this.activeScreenId, currentWidget).subscribe({
      next: () => {
        this.savingIndicator = false;
        // Silent save - no notification for auto-save
      },
      error: (error) => {
        console.error('Error saving screen:', error);
        this.savingIndicator = false;
        // Only show error for manual saves or critical errors
      }
    });
  }

  createNewScreen() {
    const name = prompt('Enter screen name:');
    if (!name) return;

    const route = prompt('Enter route (e.g., /about):') || `/${name.toLowerCase().replace(/\s+/g, '-')}`;

    const screen: Partial<Screen> = {
      project: this.projectId,
      name: name,
      route: route.startsWith('/') ? route : '/' + route,
      is_home: this.screens.length === 0,
      ui_structure: {
        type: 'Container',
        id: 'root-container',
        properties: {
          width: null,
          height: null
        },
        children: []
      }
    };

    this.screenService.createScreen(screen).subscribe({
      next: (created) => {
        this.screens.push(created);
        this.notification.showSuccess(`Screen "${created.name}" created`);
        this.selectScreen(created);
      },
      error: (error) => {
        console.error('Error creating screen:', error);
        this.notification.showError('Failed to create screen');
      }
    });
  }

  refreshScreens() {
    this.loadScreens();
  }

  getScreenIcon(screen: Screen): string {
    return screen.is_home ? '🏠' : '📄';
  }
}
