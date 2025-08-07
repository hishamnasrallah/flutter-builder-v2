import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BuildService } from '../services/build.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-build-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl:'build-history.component.html',
  styleUrl: 'build-history.component.scss'
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
