import { Component, signal, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SnipService, SnipLink } from './snip.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  private snip = inject(SnipService);

  inputUrl = signal('');
  loading = signal(false);
  result = signal<SnipLink | null>(null);
  error = signal<string | null>(null);
  links = signal<SnipLink[]>([]);

  ngOnInit(): void {
    this.loadLinks();
  }

  isValidUrl(url: string): boolean {
    try {
      const u = new URL(url);
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch {
      return false;
    }
  }

  submit(): void {
    const url = this.inputUrl().trim();
    if (!this.isValidUrl(url)) {
      this.error.set('Please enter a valid http(s) URL.');
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.result.set(null);
    this.snip.create(url).subscribe({
      next: (link) => {
        this.result.set(link);
        this.inputUrl.set('');
        this.loading.set(false);
        this.loadLinks();
      },
      error: (err) => {
        this.error.set(err?.error?.error ?? 'Network error — is the backend running?');
        this.loading.set(false);
      },
    });
  }

  loadLinks(): void {
    this.snip.list().subscribe({
      next: (list) => this.links.set(list),
      error: () => {},
    });
  }
}
