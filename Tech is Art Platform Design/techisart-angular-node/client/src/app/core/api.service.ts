import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Article, Comment, Opportunity, Paged, Research } from './models';

const params = (o: Record<string, unknown>) => {
  let p = new HttpParams();
  Object.entries(o).forEach(([k, v]) => { if (v === undefined || v === null || v === '' || (Array.isArray(v) && !v.length)) return; p = p.set(k, Array.isArray(v) ? v.join(',') : String(v)); });
  return p;
};

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  home() { return this.http.get<any>('/api/home'); }
  articles(q: { pillar?: string; format?: string; q?: string }) { return this.http.get<Paged<Article>>('/api/articles', { params: params(q) }); }
  article(slug: string) { return this.http.get<Article>('/api/articles/' + slug); }
  rate(slug: string, value: number) { return this.http.post<{ average: number; count: number }>('/api/articles/' + slug + '/rating', { value }); }
  comment(slug: string, text: string, parentId?: number) { return this.http.post<Comment>('/api/articles/' + slug + '/comments', { text, parentId }); }
  setComments(slug: string, enabled: boolean) { return this.http.patch<{ commentsEnabled: boolean }>('/api/articles/' + slug + '/comments-enabled', { enabled }); }

  research(q: Record<string, unknown>) { return this.http.get<Paged<Research>>('/api/research', { params: params(q) }); }
  suggest(q: string) { return this.http.get<{ pieces: any[]; authors: any[]; topics: string[] }>('/api/research/suggest', { params: params({ q }) }); }

  opportunities(q: Record<string, unknown>) { return this.http.get<Paged<Opportunity>>('/api/opportunities', { params: params(q) }); }
  opportunity(id: string) { return this.http.get<Opportunity>('/api/opportunities/' + id); }
  postOpportunity(body: unknown) { return this.http.post<any>('/api/opportunities', body); }

  creator(name: string) { return this.http.get<any>('/api/creators/' + encodeURIComponent(name)); }
  subscribe(email: string) { return this.http.post('/api/subscribe', { email }); }

  // reader layer
  saved = signal<any[]>([]);
  loadSaved() { this.http.get<any[]>('/api/me/saved').subscribe(s => this.saved.set(s)); }
  toggleSave(a: { slug: string; title: string; pillar?: string; format?: string; author?: string; role?: string }) { this.http.post<any[]>('/api/me/saved', a).subscribe(s => this.saved.set(s)); }
  isSaved(slug: string) { return this.saved().some(s => s.slug === slug); }
  history() { return this.http.get<any[]>('/api/me/history'); }
  following() { return this.http.get<string[]>('/api/me/following'); }
  toggleFollow(name: string) { return this.http.post<string[]>('/api/me/following', { name }); }

  // creator layer
  workspace() { return this.http.get<any>('/api/me/workspace'); }
  updateProfile(p: unknown) { return this.http.patch<any>('/api/me/profile', p); }
  submit(piece: unknown) { return this.http.post<any>('/api/submissions', piece); }
  verification() { return this.http.get<any>('/api/me/verification'); }
  completeStep(step: string, body: unknown = {}) { return this.http.post<any>('/api/me/verification/' + step, body); }
}
