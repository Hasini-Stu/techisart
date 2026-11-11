import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';

const TABS = ['All', 'Draft', 'Submitted', 'In review', 'Changes requested', 'Published'];

@Component({
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <section class="wrap" style="padding-top:clamp(32px,5vw,56px)">
      <div class="label" style="color:var(--purple)">Writer workspace · only you see this</div>
      <div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-end;gap:16px;margin-top:12px">
        <h1 style="font:500 clamp(36px,5vw,56px)/1.05 var(--serif);margin:0">Good afternoon, {{ first() }}.</h1>
        <div style="display:flex;gap:8px"><a routerLink="/write" class="btn">New piece</a><a [routerLink]="['/creator', auth.user()?.name]" class="btn line">View public portfolio</a></div>
      </div>
      @if (ws(); as w) {
        <div class="stats">
          <div><div class="v">{{ w.stats.reads30d }}</div><div class="meta">Reads, last 30 days</div></div>
          <div><div class="v">{{ w.stats.appreciations }}</div><div class="meta">Appreciations</div></div>
          <div><div class="v">{{ w.stats.comments }}</div><div class="meta">Comments</div></div>
          <div><div class="v">{{ w.stats.followers }}</div><div class="meta">Followers</div></div>
        </div>
      }
    </section>
    <div class="wrap split" style="padding-top:40px;padding-bottom:80px">
      <section style="flex:2 1 620px;min-width:0">
        <h2 class="h2" style="margin-bottom:16px">Your pieces</h2>
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px">@for (t of tabs; track t) { <button class="chip" [class.on]="tab() === t" (click)="tab.set(t)">{{ t }}</button> }</div>
        @for (d of rows(); track d.title) {
          <div class="row"><div style="flex:2 1 280px;min-width:0"><div style="font:500 18px/1.3 var(--serif)">{{ d.title }}</div><div class="meta">{{ d.type }} · {{ d.cat }} · {{ d.note }}</div></div>
            <span class="status" [style.color]="color(d.status)">{{ d.status }}</span>
            <span class="mono meta" style="flex:1 1 170px;font-size:12px">@if (d.reads) { {{ d.reads }} reads · {{ d.apps }} appreciations · {{ d.comments || 0 }} comments } @else { — }</span></div>
        }
      </section>
      <aside style="flex:1 1 300px;min-width:0;display:flex;flex-direction:column;gap:36px">
        <div class="rule"><div class="label" style="color:var(--ink);margin-bottom:14px">Profile</div>
          <button class="switch creator" [class.on]="available()" (click)="toggleAvail()"><span class="track"></span><span><b>Available for work</b><br><span class="meta">Shown on your public portfolio.</span></span></button>
          <div class="label" style="margin:22px 0 6px">Bio</div><textarea class="input serif" rows="4" [(ngModel)]="bio" (blur)="save()"></textarea></div>
        <div class="rule"><div class="label" style="color:var(--ink)">Verification</div><p class="meta" style="margin:10px 0"><span style="color:var(--purple);font-weight:600">Level {{ auth.user()?.level }} · Verified</span> · {{ auth.user()?.points }} of 70 points to Expert</p><a routerLink="/verify">View pathway →</a></div>
      </aside>
    </div>
  `,
  styles: [`.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,170px),1fr));border-top:2px solid var(--ink);border-bottom:1px solid var(--hairline);margin-top:28px}
    .stats>div{padding:20px 16px 20px 0}.v{font:500 clamp(30px,3.4vw,40px)/1 var(--serif);margin-bottom:8px}
    .row{display:flex;flex-wrap:wrap;gap:10px 24px;align-items:center;padding:18px 0;border-bottom:1px solid var(--hairline-soft)}`]
})
export class WorkspacePage {
  private api = inject(ApiService); auth = inject(AuthService);
  ws = signal<any>(null); tab = signal('All'); tabs = TABS;
  available = signal(!!this.auth.user()?.available); bio = this.auth.user()?.bio || '';
  first = computed(() => (this.auth.user()?.name || '').split(' ')[0]);
  rows = computed(() => (this.ws()?.pieces || []).filter((d: any) => this.tab() === 'All' || d.status === this.tab()));
  constructor() { this.api.workspace().subscribe(w => this.ws.set(w)); }
  color(s: string) { return s === 'Draft' ? 'var(--graphite)' : s === 'Published' || s === 'In review' ? 'var(--purple)' : 'var(--ink)'; }
  toggleAvail() { this.available.update(v => !v); this.save(); }
  save() { this.api.updateProfile({ available: this.available(), bio: this.bio }).subscribe(() => this.auth.refresh()); }
}
