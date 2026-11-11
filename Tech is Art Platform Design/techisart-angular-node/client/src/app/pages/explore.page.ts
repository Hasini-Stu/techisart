import { Component, Input, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { Article, PILLARS, slugify } from '../core/models';
import { ArticleCardComponent } from '../shared/article-card.component';

const TYPES = [['Article', 'Article'], ['Interviews', 'Interview'], ['Reviews', 'Review'], ['News', 'News'], ['Research', 'Research']];

@Component({
  standalone: true,
  imports: [FormsModule, ArticleCardComponent],
  template: `
    <section class="wrap" style="padding-top:32px">
      <div class="label">Explore / {{ name().toUpperCase() }}</div>
      <h1 style="font:500 clamp(48px,7vw,80px)/1 var(--serif);letter-spacing:-.025em;margin:12px 0">{{ name() }}</h1>
      <div class="search"><svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="8.5" cy="8.5" r="6"/><path d="M13 13l5 5"/></svg>
        <input [(ngModel)]="q" (ngModelChange)="load()" [placeholder]="'Search in ' + name()"></div>
    </section>
    <div class="bar"><div class="wrap fb">
      @for (t of types; track t[1]) { <button class="chip" [class.on]="format() === t[1]" (click)="format.set(t[1]); load()">{{ t[0] }}</button> }
      <span class="meta" style="margin-left:auto">{{ items().length }} pieces</span>
    </div></div>
    <section class="wrap" style="padding-top:32px;padding-bottom:72px">
      @if (loading()) { <div class="grid-cards">@for (i of [1,2,3,4]; track i) { <div class="skeleton" style="aspect-ratio:3/2"></div> }</div> }
      @else {
        <div class="grid-cards">
          @for (a of items(); track a.slug) { <tia-article-card [a]="a"></tia-article-card> }
          @empty { <p style="font:italic 400 18px/1.5 var(--serif);color:var(--graphite)">Nothing filed under {{ format() }} in {{ name() }} yet.</p> }
        </div>
      }
    </section>
  `,
  styles: [`.search{display:flex;align-items:center;gap:12px;border-bottom:1px solid #cfcabf;padding:6px 0 10px;max-width:560px;margin:18px 0 18px}
    .search input{flex:1;border:0;background:transparent;outline:none;font:400 20px/1.3 var(--serif)}
    .bar{position:sticky;top:0;z-index:5;background:var(--paper);border-top:1px solid var(--hairline);border-bottom:1px solid var(--hairline)}
    .fb{display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding-top:12px;padding-bottom:12px}`]
})
export class ExplorePage {
  private api = inject(ApiService);
  types = TYPES; q = '';
  name = signal('Art'); format = signal('Article'); items = signal<Article[]>([]); loading = signal(true);
  @Input() set pillar(s: string) { this.name.set(PILLARS.find(p => slugify(p) === s) || 'Art'); this.format.set('Article'); this.load(); }
  load() {
    this.loading.set(true);
    this.api.articles({ pillar: this.name(), format: this.format(), q: this.q }).subscribe(r => { this.items.set(r.items); this.loading.set(false); });
  }
}
