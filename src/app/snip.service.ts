import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SnipLink {
  code: string;
  url: string;
  shortUrl: string;
  hits: number;
  createdAt: string;
}

const API = 'http://localhost:3000';

@Injectable({ providedIn: 'root' })
export class SnipService {
  private http = inject(HttpClient);

  create(url: string): Observable<SnipLink> {
    return this.http.post<SnipLink>(`${API}/api/links`, { url });
  }

  list(): Observable<SnipLink[]> {
    return this.http.get<SnipLink[]>(`${API}/api/links`);
  }
}
