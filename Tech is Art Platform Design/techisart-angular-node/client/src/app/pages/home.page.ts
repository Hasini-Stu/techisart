import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { ArticleCardComponent } from '../shared/article-card.component';
import { BylineComponent } from '../shared/byline.component';
import { FORMATS, slugify } from '../core/models';

@Component({
  standalone: true,
  imports: [RouterLink, ArticleCardComponent, BylineComponent],
  template: `
  @if (data(); as d) {
    <section class="wrap lead-row">
      @if (d.lead; as l) {
        <a class="lead" [routerLink]="['/article', l.slug]">
          <div class="placeholder" style="aspect-ratio:16/9">{{ l.hero }}</div>
          <div class="kicker" style="margin-top:16px;font-size:12px"><span>{{ l.pillar }}</span><span class="fmt">{{ l.format }}</span></div>
          <h1 class="lead-h">{{ l.title }}</h1>
          <p class="deck">{{ l.deck }}</p>
        </a>
      }
      <aside class="latest">
        <div class="rule bar"><span class="kicker" style="font-size:13px">Latest</span></div>
        @for (x of d.latest; track x.title) {
          <div class="lrow"><span class="mono t">{{ x.time }}</span><div><div class="kicker" style="margin-bottom:5px">{{ x.pillar }}</div><div class="lt">{{ x.title }}</div></div></div>
        }
      </aside>
    </section>

    <div class="filterbar"><div class="wrap fb">
      <span class="kicker">Browse</span>
      @for (t of types; track t) { <button class="chip" [class.on]="type() === t" (click)="type.set(t)">{{ t }}</button> }
    </div></div>

    @for (s of d.sections; track s.name; let i = $index) {
      <section class="wrap sec">
        <div class="rule head"><div class="hl"><h2 class="h2">{{ s.name }}</h2><span class="meta">{{ s.blurb }}</span></div><a [routerLink]="['/explore', slug(s.name)]">All {{ s.name }} →</a></div>
        <div class="grid-cards">
          @for (a of filter(s.items); track a.slug) { <tia-article-card [a]="a"></tia-article-card> }
          @empty { <p class="empty">Nothing filed under {{ type() }} in {{ s.name }} this week.</p> }
        </div>
      </section>
      @if (i === 1) {
        <section class="research-band"><div class="wrap rb">
          <div class="rb-head">
            <div><div class="label" style="color:#bcd3ee">Pillar</div><h2 class="rb-h">Research</h2><p class="rb-p">Papers, studies and serious analysis at the edge of creative technology, written up for people who make things.</p></div>
            <a routerLink="/research" class="rb-link">Search the Research library →</a>
          </div>
          <div class="rb-list">
            @for (r of d.research; track r.slug) {
              <a class="rb-item" [routerLink]="['/article', r.slug]">
                <div class="label" style="color:#bcd3ee">{{ r.type }} · {{ r.source }}</div>
                <h3>{{ r.title }}</h3><p>{{ r.abstract }}</p>
                <div class="rb-by">{{ r.author }} · {{ r.role }}</div>
              </a>
            }
          </div>
        </div></section>
      }
    }

    <section class="wrap sec">
      <div class="opps">
        <div class="head" style="margin-bottom:18px"><div class="hl"><h2 style="font:600 20px/1 var(--sans);margin:0">Open calls</h2><span class="meta">Competitions, grants and programs from brands and organisers</span></div><a routerLink="/opportunities">All opportunities →</a></div>
        <div class="og">
          @for (o of d.opportunities; track o.id) {
            <a class="oc" [routerLink]="['/opportunities', o.id]"><div class="ok"><span style="color:var(--amber)">{{ o.type }}</span><span>{{ o.days }} days left</span></div><div class="ot">{{ o.title }}</div><div class="meta">{{ o.org }} · {{ o.prizeText }}</div></a>
          }
        </div>
      </div>
    </section>
  } @else { <div class="wrap" style="padding:80px 0" aria-busy="true"><div class="skeleton" style="height:420px"></div></div> }
  `,
  styles: [`.lead-row{display:flex;flex-wrap:wrap;gap:32px;padding-top:28px;padding-bottom:40px}
    .lead{flex:2 1 520px;min-width:0;color:inherit;text-decoration:none}
    .lead-h{font:500 clamp(30px,3.9vw,46px)/1.08 var(--serif);letter-spacing:-.015em;margin:10px 0 12px;text-wrap:balance}
    .latest{flex:1 1 260px;min-width:0}.bar{margin-bottom:4px}
    .lrow{display:grid;grid-template-columns:52px 1fr;gap:10px;padding:13px 0;border-bottom:1px solid var(--hairline-soft)}
    .t{font-size:12px;color:var(--graphite)}.lt{font:500 16px/1.3 var(--serif)}
    .filterbar{position:sticky;top:0;z-index:5;background:var(--paper);border-top:1px solid var(--hairline);border-bottom:1px solid var(--hairline)}
    .fb{display:flex;gap:6px;align-items:center;padding-top:10px;padding-bottom:10px;overflow-x:auto}.fb .kicker{margin-right:8px}
    .sec{padding-top:36px;padding-bottom:8px}
    .head{display:flex;justify-content:space-between;align-items:baseline;gap:16px;flex-wrap:wrap;margin-bottom:22px}.hl{display:flex;align-items:baseline;gap:14px;flex-wrap:wrap}
    .empty{font:italic 400 17px/1.5 var(--serif);color:var(--graphite)}
    .research-band{background:var(--research-ink);color:#f2f0ea;margin-top:48px}
    .rb{padding-top:clamp(36px,5vw,56px);padding-bottom:clamp(36px,5vw,56px)}
    .rb-head{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-end;gap:20px;padding-bottom:22px;border-bottom:1px solid #3a3b40}
    .rb-h{font:500 clamp(44px,6vw,72px)/1 var(--serif);letter-spacing:-.02em;margin:12px 0}.rb-p{font:400 18px/1.5 var(--serif);color:#c9c6be;margin:0;max-width:620px}
    .rb-link{color:#bcd3ee;font:500 14px/1 var(--sans)}
    .rb-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr));gap:28px;padding-top:28px}
    .rb-item{color:inherit;text-decoration:none}.rb-item h3{font:500 21px/1.22 var(--serif);margin:9px 0 7px}.rb-item p{font:400 15px/1.45 var(--serif);color:#c9c6be;margin:0 0 8px}
    .rb-by{font:500 12px/1.3 var(--sans);color:#a9a59c}
    .opps{background:var(--stone);border-top:3px solid var(--amber);padding:clamp(20px,3vw,32px)}
    .og{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,260px),1fr));gap:12px}
    .oc{background:var(--paper);border:1px solid var(--hairline);padding:16px 18px;display:flex;flex-direction:column;gap:8px;color:inherit;text-decoration:none}
    .ok{display:flex;justify-content:space-between;font:500 11px/1 var(--mono);letter-spacing:.04em;text-transform:uppercase;color:var(--graphite)}
    .ot{font:600 16px/1.3 var(--sans)}`]
})
export class HomePage {
  private api = inject(ApiService);
  data = signal<any>(null);
  type = signal<string>('All');
  types = ['All', ...FORMATS, 'Research'];
  slug = slugify;
  constructor() { this.api.home().subscribe(d => this.data.set(d)); }
  filter(items: any[]) { return this.type() === 'All' ? items : items.filter(a => a.format === this.type()); }
}
