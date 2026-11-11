import { Component, Input, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { VerifiedBadgeComponent } from '../shared/verified-badge.component';
import { slugify } from '../core/models';

@Component({
  standalone: true,
  imports: [RouterLink, VerifiedBadgeComponent],
  template: `
  @if (p(); as p) {
    <section class="wrap hero">
      <div class="placeholder portrait">portrait — {{ p.name }}</div>
      <div style="flex:1 1 460px;min-width:0">
        <div class="label">Portfolio · techisart.com/{{ slug(p.name) }}</div>
        <h1 style="font:500 clamp(44px,6.4vw,80px)/1 var(--serif);letter-spacing:-.025em;margin:14px 0 16px">{{ p.name }}</h1>
        <div class="badges"><span class="vr"><tia-verified [size]="18"></tia-verified>Verified {{ p.role }}</span>@if (p.location) { <span class="meta">{{ p.location }}</span> }
          @if (p.available) { <span class="avail"><i></i>Available for work</span> }</div>
        @if (p.bio) { <p class="deck" style="margin:22px 0 18px;color:#2a2926">{{ p.bio }}</p> }
        @if (p.site) { <div class="links"><a href="#">{{ p.site }} ↗</a><a href="#">Instagram ↗</a><a href="#">LinkedIn ↗</a></div> }
        <div style="display:flex;flex-wrap:wrap;gap:8px">
          @if (isMe()) { <a routerLink="/workspace" class="btn creator">Open workspace</a><button class="btn line">Copy share link</button> }
          @else { <button class="btn" [class.line]="following()" (click)="follow()">{{ following() ? 'Following' : 'Follow' }}</button><button class="btn line">Commission or contact</button><button class="btn line">Share portfolio</button> }
        </div>
      </div>
    </section>
    <section class="wrap"><div class="stats">
      @for (s of stats(); track s[1]) { <div><div class="v">{{ s[0] }}</div><div class="meta">{{ s[1] }}</div></div> }
    </div></section>
    <section class="wrap" style="padding-top:52px;padding-bottom:72px">
      <div class="rule" style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:16px"><h2 class="h2">Published on TechIsArt</h2><span class="meta">{{ p.stats.published }} pieces</span></div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:24px">@for (t of types; track t) { <button class="chip" [class.on]="type() === t" (click)="type.set(t)">{{ t }}</button> }</div>
      <div class="grid-cards">
        @for (w of works(); track w.title) {
          <a class="w" [routerLink]="['/article', w.slug || slug(w.title)]">
            @if (pinned().includes(w.title)) { <div class="kicker" style="color:var(--purple);margin-bottom:8px">Pinned</div> }
            <div class="placeholder" style="aspect-ratio:3/2;margin-bottom:12px">{{ w.image }}</div>
            <div class="kicker"><span>{{ w.pillar }}</span><span class="fmt">{{ w.format }}</span></div>
            <h3>{{ w.title }}</h3><p>{{ w.deck }}</p>@if (w.date) { <div class="mono meta" style="font-size:12px">{{ w.date }} · {{ w.read }}</div> }
          </a>
        }
      </div>
    </section>
  }
  `,
  styles: [`.hero{display:flex;flex-wrap:wrap;gap:clamp(28px,5vw,56px);align-items:flex-start;padding-top:32px;padding-bottom:40px}
    .portrait{flex:0 1 380px;min-width:240px;aspect-ratio:4/5}
    .badges{display:flex;flex-wrap:wrap;align-items:center;gap:8px 16px}.vr{display:flex;align-items:center;gap:7px;color:var(--purple);font:600 15px/1.3 var(--sans)}
    .avail{display:flex;align-items:center;gap:7px;border:1px solid var(--purple);color:var(--purple);border-radius:999px;padding:5px 10px;font:600 12px/1 var(--sans)}.avail i{width:7px;height:7px;border-radius:50%;background:var(--purple)}
    .links{display:flex;flex-wrap:wrap;gap:8px 20px;font:500 14px/1.3 var(--sans);margin-bottom:26px}
    .stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,160px),1fr));border-top:2px solid var(--ink);border-bottom:1px solid var(--hairline)}
    .stats>div{padding:20px 16px 20px 0}.v{font:500 clamp(32px,3.6vw,44px)/1 var(--serif);margin-bottom:8px}
    .w{color:inherit;text-decoration:none}.w h3{font:500 20px/1.2 var(--serif);margin:8px 0 7px}.w p{font:400 15px/1.45 var(--serif);color:var(--ink-2);margin:0 0 10px}`]
})
export class ProfilePage {
  private api = inject(ApiService); private auth = inject(AuthService);
  p = signal<any>(null); type = signal('All'); following = signal(false);
  types = ['All', 'Article', 'Interview', 'Review', 'Research']; slug = slugify;
  isMe = computed(() => this.auth.user()?.name === this.p()?.name);
  pinned = computed<string[]>(() => this.p()?.pinned || []);
  stats = computed(() => { const s = this.p()?.stats; return s ? [[s.published, 'Published pieces'], [s.reads, 'Reads'], [s.appreciations, 'Appreciations'], [s.editorsPicks, "Editor's Picks"]] : []; });
  works = computed(() => { const all = [...(this.p()?.works || [])].sort((a, b) => +this.pinned().includes(b.title) - +this.pinned().includes(a.title)); return this.type() === 'All' ? all : all.filter(w => w.format === this.type()); });
  @Input() set name(n: string) {
    this.api.creator(n).subscribe(p => this.p.set(p));
    if (this.auth.signedIn()) this.api.following().subscribe(f => this.following.set(f.includes(n)));
  }
  follow() { if (!this.auth.signedIn()) return; this.api.toggleFollow(this.p().name).subscribe(f => this.following.set(f.includes(this.p().name))); }
}
