import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { VerifiedBadgeComponent } from '../shared/verified-badge.component';

/** One account. Reader features for everyone; creator tools are an added layer. */
@Component({
  standalone: true,
  imports: [RouterLink, VerifiedBadgeComponent],
  template: `
    <section class="wrap" style="padding-top:40px">
      <div class="label">Your account</div>
      <div class="id">
        <div class="av">{{ auth.initials() }}</div>
        <div><h1 style="font:500 clamp(34px,4.6vw,52px)/1.05 var(--serif);margin:0">{{ auth.user()?.name }}</h1>
          @if (auth.isCreator()) { <div class="cr"><tia-verified [size]="15"></tia-verified>Creator · Verified {{ auth.user()?.role }}</div> } @else { <div class="meta" style="margin-top:8px">Reader</div> }</div>
        <div style="margin-left:auto;display:flex;gap:8px"><button class="btn line small">Account settings</button><button class="btn line small" (click)="signOut()">Sign out</button></div>
      </div>
      <div class="layers">
        <div class="rule"><div class="lh"><span class="label" style="color:var(--ink)">Reader</span><span class="meta">Every account</span></div>
          @for (f of reader; track f) { <div class="li"><span style="color:var(--blue)">✓</span>{{ f }}</div> }</div>
        <div class="rule" [style.border-top-color]="auth.isCreator() ? 'var(--purple)' : '#cfcabf'"><div class="lh"><span class="label" style="color:var(--ink)">+ Creator</span><span class="meta" [style.color]="auth.isCreator() ? 'var(--purple)' : ''">{{ auth.isCreator() ? 'Verified' : 'Unlocks after verification' }}</span></div>
          @for (f of creator; track f) { <div class="li" [class.locked]="!auth.isCreator()"><span [style.color]="auth.isCreator() ? 'var(--purple)' : 'var(--muted)'">{{ auth.isCreator() ? '✓' : '·' }}</span>{{ f }}</div> }</div>
      </div>
      @if (auth.isCreator()) {
        <div class="links"><a routerLink="/workspace" class="lk"><span class="label">Creator tools</span><span class="t">Writer workspace →</span></a>
          <a [routerLink]="['/creator', auth.user()?.name]" class="lk"><span class="label">Public</span><span class="t">Your portfolio →</span></a></div>
      } @else {
        <div class="become"><div><div style="font:500 22px/1.25 var(--serif)">Become a creator</div><p class="meta" style="margin:6px 0 0">Verify as an author to publish, build a public portfolio and see your analytics. You keep everything you have now.</p></div><a routerLink="/verify" class="btn">Continue verification</a></div>
      }
    </section>
    <div class="wrap split" style="padding-top:44px;padding-bottom:80px">
      <section style="flex:2 1 520px;min-width:0">
        <div class="rule" style="display:flex;justify-content:space-between"><h2 class="h2" style="font-size:28px">Saved for later</h2><span class="mono meta">{{ api.saved().length }}</span></div>
        @for (s of api.saved(); track s.slug) {
          <div class="srow"><a [routerLink]="['/article', s.slug]"><div class="kicker"><span>{{ s.pillar }}</span><span class="fmt">{{ s.format }}</span></div><h3>{{ s.title }}</h3><span class="meta">{{ s.author }}</span></a><button class="btn line small" (click)="api.toggleSave(s)">Remove</button></div>
        } @empty { <p style="font:italic 400 17px/1.5 var(--serif);color:var(--graphite)">Nothing saved yet. Use the bookmark on any piece to keep it here.</p> }
      </section>
      <aside style="flex:1 1 280px;min-width:0">
        <div class="rule"><h2 class="h2" style="font-size:28px">Recently read</h2></div>
        @for (h of history(); track h.slug) { <a class="hrow" [routerLink]="['/article', h.slug]">{{ h.title }}</a> } @empty { <p class="meta">Pieces you open appear here.</p> }
        <div class="rule" style="margin-top:36px"><h2 class="h2" style="font-size:28px">Following</h2></div>
        @for (n of following(); track n) { <div class="hrow" style="display:flex;justify-content:space-between"><a [routerLink]="['/creator', n]" class="author-link">{{ n }}</a><button class="btn line small" (click)="unfollow(n)">Unfollow</button></div> }
      </aside>
    </div>
  `,
  styles: [`.id{display:flex;flex-wrap:wrap;align-items:center;gap:18px;margin-top:16px}
    .av{width:64px;height:64px;border-radius:50%;background:#e6e2d9;display:flex;align-items:center;justify-content:center;font:600 18px/1 var(--sans)}
    .cr{display:flex;align-items:center;gap:7px;margin-top:8px;font:600 14px/1.3 var(--sans);color:var(--purple)}
    .layers{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:clamp(24px,4vw,48px);margin-top:32px}
    .lh{display:flex;justify-content:space-between;margin:2px 0 6px}
    .li{display:grid;grid-template-columns:18px 1fr;gap:10px;padding:10px 0;border-bottom:1px solid var(--hairline-soft);font:400 15px/1.4 var(--sans)}.li.locked{color:var(--muted)}
    .links{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;margin-top:28px}
    .lk{background:var(--stone);padding:18px 20px;display:flex;flex-direction:column;gap:8px;color:var(--ink);text-decoration:none}.lk .t{font:500 22px/1.2 var(--serif)}
    .become{margin-top:28px;background:var(--stone);padding:22px 24px;display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:18px}
    .srow{display:flex;justify-content:space-between;gap:16px;padding:20px 0;border-bottom:1px solid var(--hairline-soft)}.srow a{color:inherit;text-decoration:none}
    .srow h3{font:500 21px/1.22 var(--serif);margin:8px 0}.hrow{display:block;padding:14px 0;border-bottom:1px solid var(--hairline-soft);font:500 16px/1.3 var(--serif);color:var(--ink)}`]
})
export class AccountPage {
  api = inject(ApiService); auth = inject(AuthService); private router = inject(Router);
  reader = ['Save pieces for later', 'Recently read history', 'Follow writers'];
  creator = ['Writer workspace: drafts and submissions', 'Public portfolio with pinned work', 'Analytics: reads, appreciations, comments', 'Verified role badge on every byline'];
  history = signal<any[]>([]); following = signal<string[]>([]);
  constructor() { this.api.loadSaved(); this.api.history().subscribe(h => this.history.set(h)); this.api.following().subscribe(f => this.following.set(f)); }
  unfollow(n: string) { this.api.toggleFollow(n).subscribe(f => this.following.set(f)); }
  signOut() { this.auth.signOut(); this.router.navigateByUrl('/'); }
}
