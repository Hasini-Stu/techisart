import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpInterceptorFn } from '@angular/common/http';
import { tap } from 'rxjs';
import { User } from './models';

const KEY = 'tia.session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private session = signal<{ token: string; user: User } | null>(JSON.parse(localStorage.getItem(KEY) || 'null'));

  readonly user = computed(() => this.session()?.user ?? null);
  readonly token = computed(() => this.session()?.token ?? null);
  readonly signedIn = computed(() => !!this.session());
  /** One account: every user is a reader; a creator is a reader with level >= 1. */
  readonly isCreator = computed(() => (this.user()?.level ?? 0) >= 1);
  readonly initials = computed(() => (this.user()?.name || '').split(' ').filter(w => /^[A-Z]/.test(w)).map(w => w[0]).slice(0, 2).join(''));

  signIn(email: string, password: string) { return this.http.post<{ token: string; user: User }>('/api/auth/signin', { email, password }).pipe(tap(s => this.set(s))); }
  signUp(name: string, email: string, password: string, newsletter: boolean) { return this.http.post<{ token: string; user: User }>('/api/auth/signup', { name, email, password, newsletter }).pipe(tap(s => this.set(s))); }
  signOut() { this.http.post('/api/auth/signout', {}).subscribe({ error: () => {} }); this.set(null); }
  refresh() { if (this.signedIn()) this.http.get<User>('/api/me').subscribe(u => this.set({ token: this.token()!, user: u })); }

  private set(s: { token: string; user: User } | null) { this.session.set(s); s ? localStorage.setItem(KEY, JSON.stringify(s)) : localStorage.removeItem(KEY); }
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).token();
  return next(token ? req.clone({ setHeaders: { Authorization: 'Bearer ' + token } }) : req);
};
