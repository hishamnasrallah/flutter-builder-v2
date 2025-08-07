import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
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
  selector: 'app-screen-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './screen-manager.component.html',
  styleUrl: './screen-manager.component.scss'
})
export class ScreenManagerComponent implements OnInit, OnDestroy {
  @Input() projectId!: number;
  @Output() screenSelected = new EventEmitter<Screen>();
  @Output() closeManager = new EventEmitter<void>();

  screens: Screen[] = [];
  loading = false;
  showCreateForm = false;
  newScreen = {
    name: '',
    route: ''
  };
  editingScreen: Screen | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private screenService: ScreenService,
    private canvasState: CanvasStateService,
    private notification: NotificationService
  ) {}

  ngOnInit() {
    this.loadScreens();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadScreens() {
    if (!this.projectId) return;

    this.loading = true;
    this.screenService.getScreens(this.projectId).subscribe({
      next: (screens) => {
        this.screens = screens;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading screens:', error);
        this.notification.showError('Failed to load screens');
        this.loading = false;
      }
    });
  }

  createScreen() {
    if (!this.newScreen.name || !this.newScreen.route) {
      this.notification.showWarning('Please fill in all fields');
      return;
    }

    // Ensure route starts with /
    if (!this.newScreen.route.startsWith('/')) {
      this.newScreen.route = '/' + this.newScreen.route;
    }

    const screen: Partial<Screen> = {
      project: this.projectId,
      name: this.newScreen.name,
      route: this.newScreen.route,
      is_home: this.screens.length === 0, // First screen is home by default
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
        this.resetCreateForm();
        this.selectScreen(created);
      },
      error: (error) => {
        console.error('Error creating screen:', error);
        this.notification.showError(error.error?.detail || 'Failed to create screen');
      }
    });
  }

  selectScreen(screen: Screen) {
    this.screenSelected.emit(screen);
    this.canvasState.loadScreen(screen.id);
  }

  editScreen(screen: Screen, event: Event) {
    event.stopPropagation();
    this.editingScreen = { ...screen };
  }

  saveEdit() {
    if (!this.editingScreen) return;

    this.screenService.updateScreen(this.editingScreen.id, this.editingScreen).subscribe({
      next: (updated) => {
        const index = this.screens.findIndex(s => s.id === updated.id);
        if (index !== -1) {
          this.screens[index] = updated;
        }
        this.notification.showSuccess('Screen updated');
        this.editingScreen = null;
      },
      error: (error) => {
        console.error('Error updating screen:', error);
        this.notification.showError('Failed to update screen');
      }
    });
  }

  cancelEdit() {
    this.editingScreen = null;
  }

  setAsHome(screen: Screen, event: Event) {
    event.stopPropagation();

    this.screenService.setAsHome(screen.id).subscribe({
      next: () => {
        // Update local state
        this.screens.forEach(s => {
          s.is_home = s.id === screen.id;
        });
        this.notification.showSuccess(`"${screen.name}" set as home screen`);
      },
      error: (error) => {
        console.error('Error setting home screen:', error);
        this.notification.showError('Failed to set home screen');
      }
    });
  }

  duplicateScreen(screen: Screen, event: Event) {
    event.stopPropagation();

    this.screenService.duplicateScreen(screen.id).subscribe({
      next: (duplicated) => {
        this.screens.push(duplicated);
        this.notification.showSuccess(`Screen duplicated as "${duplicated.name}"`);
      },
      error: (error) => {
        console.error('Error duplicating screen:', error);
        this.notification.showError('Failed to duplicate screen');
      }
    });
  }

  deleteScreen(screen: Screen, event: Event) {
    event.stopPropagation();

    if (screen.is_home) {
      this.notification.showWarning('Cannot delete home screen');
      return;
    }

    if (!confirm(`Delete screen "${screen.name}"?`)) return;

    this.screenService.deleteScreen(screen.id).subscribe({
      next: () => {
        this.screens = this.screens.filter(s => s.id !== screen.id);
        this.notification.showSuccess('Screen deleted');
      },
      error: (error) => {
        console.error('Error deleting screen:', error);
        this.notification.showError('Failed to delete screen');
      }
    });
  }

  resetCreateForm() {
    this.newScreen = { name: '', route: '' };
    this.showCreateForm = false;
  }

  close() {
    this.closeManager.emit();
  }
}
