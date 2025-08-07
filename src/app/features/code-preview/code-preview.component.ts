import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-code-preview',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="code-preview-container">
      <div class="preview-header">
        <h3 class="text-lg font-semibold">Generated Flutter Code</h3>
        <div class="preview-actions">
          <button
            class="action-btn"
            (click)="copyCode()"
            [class.copied]="copied">
            @if (copied) {
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
              Copied!
            } @else {
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z">
                </path>
              </svg>
              Copy
            }
          </button>

          <button
            class="action-btn"
            (click)="downloadCode()">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10">
              </path>
            </svg>
            Download
          </button>

          <select
            [(ngModel)]="selectedFile"
            (change)="onFileChange()"
            class="file-select">
            @for (file of files; track file.path) {
              <option [value]="file.path">{{ file.name }}</option>
            }
          </select>
        </div>
      </div>

      <div class="code-container">
        <pre class="code-block"><code [innerHTML]="highlightedCode"></code></pre>
      </div>
    </div>
  `,
  styles: [`
    .code-preview-container {
      @apply bg-white rounded-lg shadow-sm h-full flex flex-col;
    }

    .preview-header {
      @apply flex items-center justify-between p-4 border-b border-gray-200;
    }

    .preview-actions {
      @apply flex items-center gap-2;
    }

    .action-btn {
      @apply flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors;
    }

    .action-btn.copied {
      @apply bg-green-100 text-green-700;
    }

    .file-select {
      @apply px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500;
    }

    .code-container {
      @apply flex-1 overflow-auto bg-gray-900;
    }

    .code-block {
      @apply p-4 text-sm text-gray-300 font-mono;
      line-height: 1.5;
    }

    :global(.keyword) { @apply text-purple-400; }
    :global(.string) { @apply text-green-400; }
    :global(.comment) { @apply text-gray-500 italic; }
    :global(.class) { @apply text-yellow-400; }
    :global(.function) { @apply text-blue-400; }
    :global(.number) { @apply text-orange-400; }
  `]
})
export class CodePreviewComponent implements OnInit {
  @Input() projectId!: number;

  files: any[] = [];
  selectedFile = '';
  code = '';
  highlightedCode = '';
  copied = false;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadGeneratedCode();
  }

  loadGeneratedCode() {
  this.http.post(`${environment.apiUrl}/api/builder/code-generator/generate_code/`, {
    project_id: this.projectId
  }).subscribe({
    next: (response: any) => {
      this.processGeneratedFiles(response.files);
    },
    error: (error) => {
      console.error('Error generating code:', error);
    }
  });
}

  processGeneratedFiles(files: Record<string, string>) {
    this.files = Object.keys(files).map(path => ({
      path,
      name: path.split('/').pop(),
      content: files[path]
    }));

    if (this.files.length > 0) {
      this.selectedFile = this.files[0].path;
      this.onFileChange();
    }
  }

  onFileChange() {
    const file = this.files.find(f => f.path === this.selectedFile);
    if (file) {
      this.code = file.content;
      this.highlightedCode = this.highlightDartCode(this.code);
    }
  }

  highlightDartCode(code: string): string {
    let highlighted = code;

    const keywords = [
      'import', 'class', 'extends', 'implements', 'with', 'abstract',
      'static', 'final', 'const', 'var', 'void', 'return', 'if', 'else',
      'for', 'while', 'do', 'switch', 'case', 'break', 'continue',
      'try', 'catch', 'finally', 'throw', 'new', 'this', 'super',
      'override', 'Widget', 'StatelessWidget', 'StatefulWidget', 'State',
      'BuildContext', 'build'
    ];

    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      highlighted = highlighted.replace(regex, `<span class="keyword">${keyword}</span>`);
    });

    // Strings
    highlighted = highlighted.replace(
      /'([^'\\]|\\.)*'/g,
      `<span class="string">$&</span>`
    );
    highlighted = highlighted.replace(
      /"([^"\\]|\\.)*"/g,
      `<span class="string">$&</span>`
    );

    // Comments
    highlighted = highlighted.replace(
      /\/\/.*$/gm,
      `<span class="comment">$&</span>`
    );
    highlighted = highlighted.replace(
      /\/\*[\s\S]*?\*\//g,
      `<span class="comment">$&</span>`
    );

    // Numbers
    highlighted = highlighted.replace(
      /\b\d+\.?\d*\b/g,
      `<span class="number">$&</span>`
    );

    return highlighted;
  }

  copyCode() {
    navigator.clipboard.writeText(this.code).then(() => {
      this.copied = true;
      setTimeout(() => {
        this.copied = false;
      }, 2000);
    });
  }

  downloadCode() {
    const blob = new Blob([this.code], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = this.selectedFile.split('/').pop() || 'code.dart';
    a.click();
    window.URL.revokeObjectURL(url);
  }
}
