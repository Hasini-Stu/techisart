import { Component, Input, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { ApiService } from '../core/api.service';

@Component({
  standalone: true,
  imports: [FormsModule],
  template: `
    <section style="max-width:460px;margin:0 auto;padding:clamp(48px,8vw,96px) 16px 120px">
      <div class="tabs"><button [class.on]="!up()" (click)="up.set(false)">Sign in</button><button [class.on]="up()" (click)="up.set(true)">Create account</button></div>
      <h1 style="font:500 clamp(34px,5vw,46px)/1.08 var(--serif);margin:0 0 10px">{{ up() ? 'Join TechIsArt' : 'Welcome back' }}</h1>
      <p class="deck" style="font-size:17px;margin-bottom:30px">{{ up() ? 'Read, save and follow the people building creative technology. Free.' : 'Sign in to your reading list, your follows and, if you write, your workspace.' }}</p>
      <form (ngSubmit)="submit()" style="display:flex;flex-direction:column;gap:22px">
        @if (up()) { <label><span class="label">Full name</span><input class="input serif" name="n" [(ngModel)]="name" placeholder="As it should appear on your byline"></label> }
        <label><span class="label">Email</span><input class="input serif" type="email" name="e" [(ngModel)]="email" placeholder="you&#64;studio.com"></label>
        <label><span class="label">Password</span><input class="input serif" type="password" name="p" [(ngModel)]="password" [placeholder]="up() ? 'At least 8 characters' : 'Your password'"></label>
        @if (up()) { <label class="nl"><input type="checkbox" name="nl" [(ngModel)]="newsletter"> Send me the weekly newsletter.</label> }
        @if (error()) { <div class="error">{{ error() }}</div> }
        <button class="btn" style="padding:15px 22px;font-size:15px">{{ up() ? 'Create account' : 'Sign in' }}</button>
      </form>
      @if (up()) { <p class="meta" style="margin-top:22px">Every account starts as a reader: save pieces, keep your reading history and follow writers. Verify later to publish and build a portfolio.</p> }
      <p class="meta" style="margin-top:20px">Demo accounts: mara&#64;marasketch.studio (creator) · alex&#64;example.com (reader) · password1</p>
    </section>
  `,
  styles: [`.tabs{display:flex;gap:28px;border-bottom:1px solid var(--hairline);margin-bottom:32px}
    .tabs button{background:none;border:0;border-bottom:2px solid transparent;margin-bottom:-1px;padding:12px 0;font:500 15px/1 var(--sans);color:var(--graphite)}.tabs button.on{border-bottom-color:var(--blue);color:var(--ink)}
    label{display:flex;flex-direction:column;gap:6px}.nl{flex-direction:row;align-items:center;gap:10px;font:400 14px/1.4 var(--sans)}`]
})
export class AuthPage {
  private auth = inject(AuthService); private api = inject(ApiService); private router = inject(Router);
  up = signal(false); error = signal('');
  name = ''; email = ''; password = ''; newsletter = true; private back = '/account';
  @Input() set mode(m: string) { this.up.set(m === 'up'); }
  @Input() set returnTo(r: string) { if (r) this.back = r; }
  submit() {
    const req = this.up() ? this.auth.signUp(this.name, this.email, this.password, this.newsletter) : this.auth.signIn(this.email, this.password);
    req.subscribe({ next: () => { this.api.loadSaved(); this.router.navigateByUrl(this.back); }, error: e => this.error.set(e.error?.error || 'Something went wrong') });
  }
}
