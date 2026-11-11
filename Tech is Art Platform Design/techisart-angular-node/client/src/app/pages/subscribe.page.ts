import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';

@Component({
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="wrap" style="padding-top:clamp(48px,8vw,104px);padding-bottom:56px;max-width:900px;margin-left:0">
      <div class="label">Subscribe · Free at launch</div>
      <h1 class="display" style="margin:18px 0 20px">Get the best of creative tech.</h1>
      <p class="deck" style="margin-bottom:36px">New work, research and opportunities from the people making them, in one calm weekly edition. Free while we launch.</p>
      @if (!done()) {
        <form (ngSubmit)="go()" style="display:flex;flex-wrap:wrap;gap:12px 16px;align-items:flex-end"><input class="input serif" type="email" name="e" [(ngModel)]="email" placeholder="Your email address" style="flex:1 1 260px;font-size:24px;border-bottom-color:var(--ink)"><button class="btn cta" style="padding:14px 22px;font-size:15px">Subscribe</button></form>
        @if (error()) { <div class="error">{{ error() }}</div> }
      } @else { <p style="font:500 16px/1.4 var(--sans)">You're subscribed as {{ email }}. The first issue arrives Monday.</p> }
    </section>
    <section style="background:var(--stone);border-top:1px solid var(--hairline)"><div class="wrap" style="padding-top:56px;padding-bottom:64px">
      <h2 class="h2" style="margin-bottom:28px">Plans</h2>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,340px),1fr));gap:48px">
        <div class="rule"><div style="display:flex;justify-content:space-between"><span class="label" style="color:var(--ink)">Free</span><span class="status">Available now</span></div>
          <div style="font:500 52px/1 var(--serif);margin:18px 0">€0</div>
          @for (f of free; track f) { <div class="li"><span style="color:var(--blue)">✓</span>{{ f }}</div> }</div>
        <div class="rule" style="border-top-color:#cfcabf"><div style="display:flex;justify-content:space-between"><span class="label" style="color:var(--ink)">Pro</span><span class="status" style="color:var(--pink)">Coming soon</span></div>
          <div style="font:500 52px/1 var(--serif);margin:18px 0;color:var(--muted)">—</div>
          @for (f of pro; track f) { <div class="li"><span style="color:var(--muted)">+</span>{{ f }}</div> }</div>
      </div>
    </div></section>
  `,
  styles: [`.li{display:grid;grid-template-columns:18px 1fr;gap:10px;padding:11px 0;border-bottom:1px solid var(--hairline-soft);font:400 15px/1.45 var(--sans)}`]
})
export class SubscribePage {
  private api = inject(ApiService);
  email = ''; done = signal(false); error = signal('');
  free = ['The weekly newsletter: Edition, Research Brief and Open Calls', 'Read all articles, interviews, reviews and news', 'Research summaries and key findings', 'A basic creator profile'];
  pro = ['Everything in Free', 'Full research access: complete papers, data and methods', 'An enhanced creator portfolio', '"Available for hire" status, visible to brands', 'Unlimited saved pieces and reading lists'];
  go() { this.api.subscribe(this.email).subscribe({ next: () => this.done.set(true), error: e => this.error.set(e.error?.error || 'Something went wrong') }); }
}
