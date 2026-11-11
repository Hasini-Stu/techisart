import { Component, WritableSignal, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subject, debounceTime, switchMap, tap } from 'rxjs';
import { ApiService } from '../core/api.service';
import { Opportunity, PILLARS } from '../core/models';

type Key = 'status' | 'fee' | 'who' | 'format' | 'prize' | 'field';

@Component({
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <section class="band"><div class="wrap" style="padding-top:clamp(28px,4vw,44px);padding-bottom:24px">
      <div class="top"><div><div class="label">Directory</div><h1>Opportunities</h1><p>Competitions, programs, grants and launches for creative-tech makers.</p></div><a routerLink="/opportunities/new" class="btn">Post an opportunity</a></div>
      <form class="sbar" (ngSubmit)="reload()"><input name="q" [(ngModel)]="q" (ngModelChange)="reload()" placeholder="Search titles, organisers, keywords"><button class="btn small">Search</button></form>
      <div class="types">@for (t of types; track t) { <button class="chip" [class.on]="type() === t" (click)="type.set(t); reload()">{{ t }}</button> }</div>
    </div></section>

    <div class="wrap split" style="padding-top:32px;padding-bottom:88px">
      <aside style="flex:0 1 230px;min-width:200px">
        <div class="rule fh"><button class="kbtn" (click)="filtersOpen.set(!filtersOpen())">Filters {{ filtersOpen() ? '▴' : '▾' }}</button>@if (chips().length) { <a href="#" (click)="$event.preventDefault(); clearAll()">Clear all</a> }</div>
        @if (filtersOpen()) {
          @for (g of groups; track g.key) {
            <div class="grp"><div class="label" style="color:var(--ink);margin-bottom:6px">{{ g.title }}</div>
              @for (o of g.opts; track o) { <button class="check" [class.on]="f[g.key]().includes(o)" (click)="toggle(g.key, o)"><span class="box">{{ f[g.key]().includes(o) ? '✓' : '' }}</span><span>{{ o }}</span></button> }</div>
          }
        }
      </aside>
      <section style="flex:999 1 400px;min-width:0">
        <div class="rule rh"><div><b style="font-size:22px">{{ total() }}</b> <span class="meta">opportunities · sponsored first</span></div>
          <label class="label">Sort by <select [(ngModel)]="sort" (ngModelChange)="reload()"><option value="closing">Closing soon</option><option value="newest">Newest</option><option value="prize">Prize</option></select></label></div>
        @if (chips().length) { <div class="chips">@for (c of chips(); track c.label) { <button class="fchip" (click)="c.remove()">{{ c.label }} ×</button> }</div> }
        @if (loading()) { @for (i of [1,2,3,4]; track i) { <div class="skeleton" style="height:96px;margin:16px 0"></div> } }
        @else {
          @for (o of items(); track o.id) {
            <article class="row" [class.sp]="o.sponsored" (click)="router.navigate(['/opportunities', o.id])">
              <div class="date"><div class="label">{{ mon(o) }}</div><div class="day" [class.closed]="o.days < 0">{{ day(o) }}</div><div class="flag" [class.soon]="o.days >= 0 && o.days <= 14">{{ flag(o) }}</div></div>
              <div class="main">
                <div class="tags"><span class="tag">{{ o.type }}</span>@if (o.sponsored) { <span class="tag solid">Sponsored</span> }<span class="mono meta">{{ o.fields.join(' · ') }}</span></div>
                <h2>{{ o.title }}</h2>
                <div class="meta" style="color:var(--ink)">{{ o.org }} @if (o.orgVerified) { <span class="meta">· Verified organiser</span> }</div>
                <p>{{ o.desc }}</p>
              </div>
              <dl><dt class="label">Prize</dt><dd><b>{{ o.prizeText }}</b></dd><dt class="label">Entry</dt><dd>{{ o.fee === 'Free' ? 'Free' : o.feeAmt + ' fee' }}</dd><dt class="label">Open to</dt><dd>{{ o.who.join(', ') }}</dd><dt class="label">Format</dt><dd>{{ o.format === 'Online' ? 'Online' : 'In person, ' + o.location }}</dd></dl>
            </article>
          } @empty {
            <div style="padding:52px 0"><h2 style="font:600 28px/1.15 var(--sans);margin:0 0 10px">No opportunities match</h2><p class="meta" style="font-size:16px">Try removing a filter, including paid entries, or showing closed listings.</p><button class="btn" (click)="clearAll()">Clear all filters</button></div>
          }
        }
      </section>
    </div>
  `,
  styles: [`.band{background:var(--stone);border-top:3px solid var(--amber);border-bottom:1px solid var(--hairline);margin-top:16px}
    .top{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-end;gap:16px}
    h1{font:600 clamp(36px,5vw,56px)/1 var(--sans);letter-spacing:-.03em;margin:12px 0 10px}.top p{font:400 17px/1.5 var(--sans);color:var(--ink-2);margin:0}
    .sbar{display:flex;align-items:center;gap:12px;background:#fff;border:1px solid var(--ink);padding:0 8px 0 16px;margin-top:24px}.sbar input{flex:1;border:0;outline:none;padding:15px 0;font:400 17px/1.3 var(--sans)}
    .types{display:flex;flex-wrap:wrap;gap:6px;margin-top:16px}
    .fh,.rh{display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:12px}.kbtn{background:none;border:0;padding:0;font:600 13px/1 var(--sans);letter-spacing:.06em;text-transform:uppercase}
    .rh select{border:0;border-bottom:1px solid var(--ink);background:transparent;font:500 14px/1 var(--sans);padding:6px 0;margin-left:8px}
    .grp{padding:16px 0 10px;border-top:1px solid var(--hairline);margin-top:10px}
    .chips{display:flex;flex-wrap:wrap;gap:6px;padding:14px 0 6px}.fchip{white-space:nowrap;border:1px solid var(--ink);background:none;border-radius:2px;padding:7px 10px;font:500 11px/1 var(--sans);letter-spacing:.1em;text-transform:uppercase}
    .row{cursor:pointer;display:flex;flex-wrap:wrap;gap:16px 28px;padding:24px 12px;margin:0 -12px;border-bottom:1px solid var(--hairline)}.row:hover{background:#f5f3ee}.row.sp{background:#fbf8f2}
    .date{flex:0 0 76px}.day{font:600 34px/1 var(--sans);letter-spacing:-.03em;margin:4px 0}.day.closed{color:var(--muted)}
    .flag{font:600 11px/1.3 var(--sans);color:var(--graphite);margin-top:8px}.flag.soon{color:var(--amber)}
    .main{flex:1 1 240px;min-width:0}.tags{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
    .main h2{font:600 clamp(18px,1.9vw,21px)/1.25 var(--sans);margin:10px 0 6px}
    .main p{font:400 15px/1.45 var(--sans);color:var(--ink-2);margin:8px 0 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    dl{flex:0 1 220px;min-width:180px;margin:0;display:grid;grid-template-columns:auto 1fr;gap:7px 12px;font:400 13px/1.35 var(--sans)}dd{margin:0}`]
})
export class OpportunitiesPage {
  private api = inject(ApiService); router = inject(Router);
  q = ''; sort = 'closing';
  types = ['All', 'Competition', 'Program', 'Grant', 'Launch']; type = signal('All');
  f: Record<Key, WritableSignal<string[]>> = { status: signal<string[]>(['Open', 'Closing soon']), fee: signal<string[]>([]), who: signal<string[]>([]), format: signal<string[]>([]), prize: signal<string[]>([]), field: signal<string[]>([]) };
  groups: { key: Key; title: string; opts: readonly string[] }[] = [
    { key: 'status', title: 'Status', opts: ['Open', 'Closing soon', 'Closed'] }, { key: 'fee', title: 'Entry fee', opts: ['Free', 'Paid'] },
    { key: 'who', title: 'Who can enter', opts: ['Students', 'Open to all', 'Australia', 'Worldwide'] }, { key: 'format', title: 'Format', opts: ['Online', 'In person'] },
    { key: 'prize', title: 'Prize', opts: ['Cash', 'Exhibition', 'Mentorship', 'Feature on our site'] }, { key: 'field', title: 'Field', opts: PILLARS }];
  items = signal<Opportunity[]>([]); total = signal(0); loading = signal(true); filtersOpen = signal(window.innerWidth > 640);
  private req$ = new Subject<void>();
  chips = computed(() => {
    const out: { label: string; remove: () => void }[] = [];
    if (this.type() !== 'All') out.push({ label: this.type(), remove: () => { this.type.set('All'); this.reload(); } });
    (Object.keys(this.f) as Key[]).forEach(k => this.f[k]().forEach(v => out.push({ label: v, remove: () => this.toggle(k, v) })));
    return out;
  });
  constructor() {
    this.req$.pipe(tap(() => this.loading.set(true)), debounceTime(200), switchMap(() => this.api.opportunities({
      q: this.q, type: this.type(), sort: this.sort, ...Object.fromEntries((Object.keys(this.f) as Key[]).map(k => [k, this.f[k]()]))
    }))).subscribe(r => { this.items.set(r.items); this.total.set(r.total); this.loading.set(false); });
    this.reload();
  }
  reload() { this.req$.next(); }
  toggle(k: Key, v: string) { this.f[k].update(a => a.includes(v) ? a.filter(x => x !== v) : [...a, v]); this.reload(); }
  clearAll() { (Object.keys(this.f) as Key[]).forEach(k => this.f[k].set([])); this.type.set('All'); this.q = ''; this.reload(); }
  private d(o: Opportunity) { return new Date(Date.UTC(2026, 10, 5) + o.days * 864e5); }
  mon(o: Opportunity) { return this.d(o).toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }).toUpperCase(); }
  day(o: Opportunity) { return this.d(o).getUTCDate(); }
  flag(o: Opportunity) { return o.days < 0 ? 'Closed' : o.days === 0 ? 'Closes today' : o.days + ' days left'; }
}
