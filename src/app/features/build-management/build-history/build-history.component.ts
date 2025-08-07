import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BuildService } from '../services/build.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-build-history',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="build-history">
      <div class="history-header">
        <h3 class="text-lg font-semibold">Build History</h3>
        <button
          class="refresh-btn"
          (click)="loadBuilds()"
          [disabled]="loading">
          <svg class="w-4 h-4" [class.animate-spin]="loading" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15">
            </path>
          </svg>
          Refresh
        </button>
      </div>

      <div class="builds-list">
        @if (loading && builds.length === 0) {
          <div class="loading-state">
            <div class="spinner"></div>
            <p>Loading build history...</p>
          </div>
        } @else if (builds.length === 0) {
          <div class="empty-state">
            <p class="text-gray-500">No builds yet</p>
          </div>
        } @else {
          @for (build of builds; track build.id) {
            <div class="build-item" [class.building]="build.status === 'building'">
              <div class="build-status">
                <span class="status-badge" [class]="'status-' + build.status">
                  {{ build.status }}
                </span>
              </div>

              <div class="build-info">
                <div class="build-title">
                  <span class="font-medium">Build #{{ build.id }}</span>
                  <span class="text-sm text-gray-500">{{ build.build_type }}</span>
                </div>
                <div class="build-meta">
                  <span class="text-xs text-gray-500">
                    v{{ build.version_number }} ({{ build.build_number }})
                  </span>
                  <span class="text-xs text-gray-500">
                    {{ formatDate(build.created_at) }}
                  </span>
                </div>
                @if (build.error_message) {
                  <div class="error-message">
                    {{ build.error_message }}
                  </div>
                }
              </div>

              <div class="build-actions">
                @if (build.status === 'building' || build.status === 'pending') {
                  <button
                    class="action-btn"
                    (click)="viewLogs(build)"
                    title="View Logs">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z">
                      </path>
                    </svg>
                  </button>
                  <button
                    class="action-btn text-red-600"
                    (click)="cancelBuild(build)"
                    title="Cancel Build">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M6 18L18 6M6 6l12 12">
                      </path>
                    </svg>
                  </button>
                } @else if (build.status === 'success' && build.apk_url) {
                  <button
                    class="action-btn text-green-600"
                    (click)="downloadApk(build)"
                    title="Download APK">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10">
                      </path>
                    </svg>
                  </button>
                  <span class="text-xs text-gray-500">
                    {{ formatFileSize(build.apk_size) }}
                  </span>
                }

                @if (build.duration_seconds) {
                  <span class="text-xs text-gray-500">
                    {{ formatDuration(build.duration_seconds) }}
                  </span>
                }
              </div>
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .build-history {
      @apply bg-white rounded-lg shadow-sm p-4 min-h-screen;
    }

    .history-header {
      @apply flex items-center justify-between mb-4;
    }

    .refresh-btn {
      @apply flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors;
    }

    .builds-list {
      @apply space-y-2;
    }

    .build-item {
      @apply flex items-center gap-4 p-3 bg-gray-50 rounded-lg;
    }

    .build-item.building {
      @apply animate-pulse;
    }

    .status-badge {
      @apply px-2 py-1 text-xs font-medium rounded;
    }

    .status-pending { @apply bg-yellow-100 text-yellow-800; }
    .status-building { @apply bg-blue-100 text-blue-800; }
    .status-success { @apply bg-green-100 text-green-800; }
    .status-failed { @apply bg-red-100 text-red-800; }
    .status-cancelled { @apply bg-gray-100 text-gray-800; }

    .build-info {
      @apply flex-1;
    }

    .build-title {
      @apply flex items-center gap-2;
    }

    .build-meta {
      @apply flex items-center gap-4 mt-1;
    }

    .error-message {
      @apply text-xs text-red-600 mt-2;
    }

    .build-actions {
      @apply flex items-center gap-2;
    }

    .action-btn {
      @apply p-1.5 hover:bg-gray-200 rounded transition-colors;
    }

    .loading-state, .empty-state {
      @apply text-center py-8;
    }

    .spinner {
      @apply w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto;
    }
  `]
})
export class BuildHistoryComponent implements OnInit {
  @Input() projectId?: number;

  builds: any[] = [];
  loading = false;

  constructor(
    private buildService: BuildService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Get projectId from route if not provided as input
    if (!this.projectId) {
      const id = this.route.snapshot.params['id'];
      if (id) {
        this.projectId = Number(id);
      }
    }
    this.loadBuilds();
  }

  loadBuilds() {
    this.loading = true;
    this.buildService.getBuildHistory(this.projectId).subscribe({
      next: (builds) => {
        this.builds = builds;
        this.loading = false;

        // Auto-refresh if any builds are in progress
        const inProgress = builds.some(b =>
          b.status === 'pending' || b.status === 'building'
        );
        if (inProgress) {
          setTimeout(() => this.loadBuilds(), 5000);
        }
      },
      error: (error) => {
        console.error('Error loading builds:', error);
        this.loading = false;
      }
    });
  }

  viewLogs(build: any) {
    console.log('View logs for build:', build.id);
  }

  cancelBuild(build: any) {
    if (confirm('Cancel this build?')) {
      this.buildService.cancelBuild(build.id).subscribe({
        next: () => {
          this.loadBuilds();
        },
        error: (error) => {
          console.error('Error cancelling build:', error);
        }
      });
    }
  }

  downloadApk(build: any) {
    this.buildService.downloadApk(build.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `app-${build.version_number}.apk`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Error downloading APK:', error);
      }
    });
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }

  formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return minutes > 0 ? `${minutes}m ${secs}s` : `${secs}s`;
  }

  formatFileSize(bytes?: number): string {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  }
}
