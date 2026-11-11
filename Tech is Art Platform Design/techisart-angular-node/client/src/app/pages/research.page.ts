import { Component, WritableSignal, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subject, debounceTime, switchMap, tap } from 'rxjs';
import { ApiService } from '../core/api.service';
import { PILLARS, RESEARCH_TYPES, Research, SOURCES } from '../core/models';
import { BylineComponent } from '../shared/byline.component';

type Multi = 'field' | 'type' | 'source' | 'role';
const DATES = [['any', 'Any time'], ['last-year', 'Last year'], ['last-3-years', 'Last 3 years'], ['custom', 'Custom range']];
const SORTS = [['recent', 'Most recent'], ['relevant', 'Most relevant'], ['cited', 'Most read / cited'], ['picks', "Editor's Picks"]];

@Component({
  standalone: true,
  imports: [FormsModule, RouterLink, BylineComponent],
  template: `
    <section class="wrap" style="padding-top:32px">
      <div class="label">Research library</div>
      <h1 style="font:500 clamp(44px,6.4vw,72px)/1 var(--serif);letter-spacing:-.025em;margin:12px 0">Research</h1>
      <p class="deck" style="max-width:700px">Papers, studies and analysis at the edge of creative technology. Every entry states its source. Summaries link to the original work.</p>
      <form class="sbar" (ngSubmit)="open.set(false); reload()">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="8.5" cy="8.5" r="6"/><path d="M13 13l5 5"/></svg>
        <input name="q" [(ngModel)]="q" (ngModelChange)="onType($event)" (focus)="open.set(true); typed$.next(q)" (blur)="closeSoon()" placeholder="Search research — titles, authors, keywords, topics" autocomplete="off">
        <button class="btn">Search</button>
        @if (open() && sugg(); as s) {
          <div class="sugg">
            @if (s.pieces.length) { <div class="label sh">Research pieces</div> @for (p of s.pieces; track p.slug) { <a class="si" [routerLink]="['/article', p.slug]"><span class="serif">{{ p.title }}</span><span class="label">{{ p.type }}</span></a> } }
            @if (s.authors.length) { <div class="label sh">Authors</div> @for (p of s.authors; track p.name) { <button type="button" class="si" (mousedown)="pick(p.name)"><b>{{ p.name }}</b><span class="role">{{ p.role }}</span></button> } }
            @if (s.topics.length) { <div class="label sh">{{ q ? 'Topics' : 'Popular topics' }}</div> @for (t of s.topics; track t) { <button type="button" class="si" (mousedown)="pick(t)">{{ t }}</button> } }
          </div>
        }
      </form>
    </section>

    <div class="wrap split" style="padding-top:36px;padding-bottom:88px">
      <aside style="flex:0 1 240px;min-width:200px">
        <div class="rule fhead"><button class="kbtn" (click)="filtersOpen.set(!filtersOpen())">Refine {{ filtersOpen() ? '▴' : '▾' }}</button>@if (chips().length) { <a href="#" (click)="$event.preventDefault(); clearAll()">Clear all</a> }</div>
        @if (filtersOpen()) {
          @for (g of groups; track g.key) {
            <div class="grp"><div class="label" style="color:var(--ink);margin-bottom:6px">{{ g.title }}</div>
              @for (o of g.opts; track o) { <button class="check" [class.on]="f[g.key]().includes(o)" (click)="toggle(g.key, o)"><span class="box">{{ f[g.key]().includes(o) ? '✓' : '' }}</span><span>{{ o }}</span></button> }
            </div>
          }
          <div class="grp"><div class="label" style="color:var(--ink);margin-bottom:6px">Date</div>
            @for (d of dates; track d[0]) { <button class="check" [class.on]="date() === d[0]" (click)="date.set(d[0]); reload()"><span class="box" style="border-radius:50%"></span><span>{{ d[1] }}</span></button> }
            @if (date() === 'custom') { <div class="range"><input class="input mono" [(ngModel)]="from" (ngModelChange)="reload()" placeholder="From"><span>–</span><input class="input mono" [(ngModel)]="to" (ngModelChange)="reload()" placeholder="To"></div> }
          </div>
          <div class="grp"><button class="switch" [class.on]="verified()" (click)="verified.set(!verified()); reload()"><span class="track"></span><span><b>Verified authors only</b><br><span class="meta">Roles checked by our editors</span></span></button></div>
        }
      </aside>

      <section style="flex:999 1 380px;min-width:0;max-width:840px">
        <div class="rule rhead">
          <div><span style="font:500 24px/1 var(--serif)">{{ total() }}</span> <span class="meta">results</span></div>
          <label class="label">Sort by <select [(ngModel)]="sort" (ngModelChange)="reload()">@for (s of sorts; track s[0]) { <option [value]="s[0]">{{ s[1] }}</option> }</select></label>
        </div>
        @if (chips().length) { <div class="chips">@for (c of chips(); track c.label) { <button class="fchip" (click)="c.remove()">{{ c.label }} ×</button> }<a href="#" (click)="$event.preventDefault(); clearAll()">Clear all</a></div> }

        @if (loading()) {
          <div aria-busy="true">@for (i of [1,2,3,4]; track i) { <div class="sk"><div class="skeleton" style="width:30%;height:10px"></div><div class="skeleton" style="width:80%;height:22px;margin-top:14px"></div><div class="skeleton" style="width:100%;height:12px;margin-top:14px"></div></div> }</div>
        } @else {
          @for (r of items(); track r.slug) {
            <article class="res" (click)="router.navigate(['/article', r.slug])">
              <div class="rtop"><span class="tag" [class.solid]="r.source === 'Peer-reviewed'">{{ r.source }}</span><span class="label" style="color:var(--ink)">{{ r.type }}</span><span class="label">· {{ r.field }}</span>
                @if (r.pick) { <span class="kicker" style="color:var(--blue)">Editor's pick</span> }<span class="mono meta" style="margin-left:auto">{{ dateOf(r) }}</span></div>
              <h2>{{ r.title }}</h2>
              <tia-byline [author]="r.author" [role]="r.role" [verified]="r.verified" [meta]="r.cls"></tia-byline>
              <p class="abs">{{ r.abstract }}</p>
              <div class="cite">{{ r.cite }}</div>
              <div class="rfoot"><span class="mono meta">{{ r.reads.toLocaleString() }} reads · {{ r.cites }} citations · {{ r.tags.join(', ') }}</span>
                @if (r.original) { <a href="#" (click)="$event.preventDefault(); $event.stopPropagation()" [title]="r.original">Summary · Read the original paper ↗</a> }</div>
            </article>
          } @empty {
            <div style="padding:56px 0 40px"><h2 class="h2">No research matches</h2><p class="deck" style="margin:10px 0 22px">Try broadening your filters: widen the date range, add more fields or sources, or search a shorter phrase.</p>
              <div style="display:flex;gap:10px"><button class="btn" (click)="clearAll()">Clear all filters</button><button class="btn line" (click)="date.set('any'); reload()">Search any time</button></div></div>
          }
        }
      </section>
    </div>
  `,
  styles: [`.sbar{position:relative;display:flex;align-items:center;gap:14px;border:1px solid var(--ink);background:#fff;padding:0 8px 0 18px;margin-top:32px}
    .sbar input{flex:1;min-width:0;border:0;outline:none;padding:18px 0;font:400 clamp(19px,2.2vw,24px)/1.3 var(--serif);background:transparent}
    .sugg{position:absolute;left:-1px;right:-1px;top:100%;z-index:30;background:var(--paper);border:1px solid var(--ink);border-top:0;padding-bottom:6px;box-shadow:0 14px 30px rgba(20,20,20,.08)}
    .sh{padding:14px 18px 6px;display:block}.si{display:flex;justify-content:space-between;gap:14px;width:100%;text-align:left;background:none;border:0;padding:9px 18px;color:var(--ink);text-decoration:none;font:500 14px/1.3 var(--sans)}.si:hover{background:var(--stone)}
    .fhead{display:flex;justify-content:space-between;align-items:baseline}.kbtn{background:none;border:0;padding:0;font:600 13px/1 var(--sans);letter-spacing:.06em;text-transform:uppercase}
    .grp{padding:16px 0 10px;border-top:1px solid var(--hairline);margin-top:10px}
    .range{display:grid;grid-template-columns:1fr auto 1fr;gap:10px;align-items:end;padding:8px 0 4px 26px}
    .rhead{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:12px}
    .rhead select{border:0;border-bottom:1px solid var(--ink);background:transparent;font:500 14px/1 var(--sans);padding:6px 0;margin-left:8px}
    .chips{display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:14px 0 4px}
    .fchip{white-space:nowrap;border:1px solid var(--ink);background:none;border-radius:2px;padding:7px 10px;font:500 11px/1 var(--sans);letter-spacing:.1em;text-transform:uppercase}.fchip:hover{border-color:var(--blue);color:var(--blue)}
    .sk{padding:26px 0;border-bottom:1px solid var(--hairline-soft)}
    .res{cursor:pointer;padding:28px 0;border-bottom:1px solid var(--hairline)}
    .rtop{display:flex;flex-wrap:wrap;align-items:center;gap:8px 10px}
    .res h2{font:500 clamp(22px,2.4vw,27px)/1.18 var(--serif);letter-spacing:-.01em;margin:12px 0 10px}.res:hover h2{text-decoration:underline;text-decoration-thickness:1px}
    .abs{font:400 17px/1.55 var(--serif);color:#2a2926;margin:12px 0 14px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
    .cite{font:400 12px/1.5 var(--mono);color:var(--ink-2);border-left:2px solid var(--ink);padding:1px 0 1px 10px;margin-bottom:12px}
    .rfoot{display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px 16px}.rfoot a{font:600 13px/1 var(--sans);white-space:nowrap}`]
})
export class ResearchPage {
  private api = inject(ApiService); router = inject(Router);
  q = ''; from = '2023'; to = '2026'; sort = 'recent';
  f: Record<Multi, WritableSignal<string[]>> = { field: signal<string[]>(['Art', 'Music', 'Beauty', 'Film & Animation']), type: signal<string[]>([]), source: signal<string[]>([]), role: signal<string[]>([]) };
  date = signal('last-3-years'); verified = signal(true);
  items = signal<Research[]>([]); total = signal(0); loading = signal(true);
  open = signal(false); filtersOpen = signal(window.innerWidth > 640);
  sugg = signal<{ pieces: any[]; authors: any[]; topics: string[] } | null>(null);
  groups: { key: Multi; title: string; opts: readonly string[] }[] = [
    { key: 'field', title: 'Field', opts: PILLARS }, { key: 'type', title: 'Research type', opts: RESEARCH_TYPES },
    { key: 'source', title: 'Source', opts: SOURCES }, { key: 'role', title: 'Author role', opts: ['Student', 'Professional', 'Expert', 'Enthusiast'] }];
  dates = DATES; sorts = SORTS;
  typed$ = new Subject<string>();
  private req$ = new Subject<void>();

  chips = computed(() => {
    const out: { label: string; remove: () => void }[] = [];
    (Object.keys(this.f) as Multi[]).forEach(k => this.f[k]().forEach(v => out.push({ label: (k === 'role' ? 'Role: ' : '') + v, remove: () => this.toggle(k, v) })));
    if (this.date() !== 'any') out.push({ label: this.date() === 'custom' ? this.from + '–' + this.to : DATES.find(d => d[0] === this.date())![1], remove: () => { this.date.set('any'); this.reload(); } });
    if (this.verified()) out.push({ label: 'Verified authors only', remove: () => { this.verified.set(false); this.reload(); } });
    return out;
  });

  constructor() {
    this.req$.pipe(tap(() => this.loading.set(true)), debounceTime(200), switchMap(() => this.api.research({
      q: this.q, field: this.f.field(), type: this.f.type(), source: this.f.source(), role: this.f.role(),
      date: this.date(), from: this.from, to: this.to, verified: this.verified() || undefined, sort: this.sort
    }))).subscribe(r => { this.items.set(r.items); this.total.set(r.total); this.loading.set(false); });
    this.typed$.pipe(debounceTime(120), switchMap(q => this.api.suggest(q))).subscribe(s => this.sugg.set(s));
    this.reload();
  }
  reload() { this.req$.next(); }
  onType(v: string) { if (v.trim() && this.sort === 'recent') this.sort = 'relevant'; this.open.set(true); this.typed$.next(v); this.reload(); }
  pick(v: string) { this.q = v; this.open.set(false); this.sort = 'relevant'; this.reload(); }
  closeSoon() { setTimeout(() => this.open.set(false), 150); }
  toggle(k: Multi, v: string) { this.f[k].update(a => a.includes(v) ? a.filter(x => x !== v) : [...a, v]); this.reload(); }
  clearAll() { (Object.keys(this.f) as Multi[]).forEach(k => this.f[k].set([])); this.q = ''; this.date.set('any'); this.verified.set(false); this.reload(); }
  dateOf(r: Research) { return new Date(Date.UTC(2026, 10, 5) - r.publishedDaysAgo * 864e5).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }); }
}
