import { Component, Input, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { Opportunity } from '../core/models';

@Component({
  standalone: true,
  imports: [RouterLink],
  template: `
  @if (o(); as o) {
    <article class="wrap" style="padding-top:24px;padding-bottom:88px">
      <div class="meta"><a routerLink="/opportunities">Opportunities</a> / {{ o.type }}</div>
      <div class="split" style="margin-top:24px">
        <div style="flex:2 1 520px;min-width:0;max-width:720px">
          <div style="display:flex;gap:8px;flex-wrap:wrap"><span class="tag">{{ o.type }}</span>@if (o.sponsored) { <span class="tag solid">Sponsored</span> }<span class="status" [style.color]="o.status === 'Closing soon' ? 'var(--amber)' : o.status === 'Closed' ? 'var(--muted)' : 'var(--ink)'">{{ o.status }}</span></div>
          <h1 style="font:600 clamp(32px,4.6vw,52px)/1.06 var(--sans);letter-spacing:-.03em;margin:16px 0 14px">{{ o.title }}</h1>
          <div class="meta" style="color:var(--ink);font-size:15px">{{ o.org }} @if (o.orgVerified) { <span class="meta">· Verified organiser</span> }</div>
          <p class="deck" style="margin:28px 0 24px">{{ o.desc }}</p>
          <div class="body-text">@for (p of o.body || []; track p) { <p>{{ p }}</p> }</div>
          <h2 class="sh">Eligibility</h2>
          @for (e of o.elig || o.who; track e) { <div class="li"><span style="color:var(--amber)">✓</span>{{ e }}</div> }
          @if (o.steps) { <h2 class="sh">How to apply</h2> @for (s of o.steps; track s; let i = $index) { <div class="li"><span class="mono" style="color:var(--amber)">0{{ i + 1 }}</span>{{ s }}</div> } }
          @if (o.orgAbout) { <div style="background:var(--stone);padding:20px 22px;margin-top:36px"><div class="label">About the organiser</div><p class="meta" style="margin:8px 0 0">{{ o.orgAbout }}</p></div> }
        </div>
        <aside class="panel">
          <div class="label">Deadline</div>
          <div style="font:600 24px/1.2 var(--sans);margin-top:8px">{{ deadline(o) }}</div>
          @for (x of facts(o); track x[0]) { <div class="fact"><div class="label">{{ x[0] }}</div><b>{{ x[1] }}</b></div> }
          @if (o.days >= 0) { <a class="btn" style="display:block;text-align:center;margin-top:20px;text-decoration:none" [href]="'https://' + o.link" target="_blank" rel="noopener">{{ o.type === 'Launch' ? 'Sign up' : o.type === 'Competition' ? 'Enter' : 'Apply' }} ↗</a><div class="mono meta" style="text-align:center;margin-top:8px;font-size:12px">Opens {{ o.link }}</div> }
          @else { <div class="closed">Applications closed</div> }
        </aside>
      </div>
    </article>
  }
  `,
  styles: [`.sh{font:600 20px/1.2 var(--sans);margin:36px 0 12px}
    .li{display:grid;grid-template-columns:28px 1fr;gap:8px;padding:11px 0;border-bottom:1px solid var(--hairline-soft);font:400 15px/1.45 var(--sans)}
    .panel{flex:1 1 300px;min-width:0;max-width:380px;position:sticky;top:16px;border:1px solid var(--ink);padding:22px;background:#fff}
    .fact{padding:14px 0;border-bottom:1px solid var(--hairline);font:400 15px/1.4 var(--sans)}.fact .label{margin-bottom:6px}
    .closed{margin-top:20px;border:1px solid #cfcabf;border-radius:3px;padding:14px;text-align:center;font:600 14px/1.3 var(--sans);color:var(--graphite)}`]
})
export class OpportunityDetailPage {
  private api = inject(ApiService);
  o = signal<Opportunity | null>(null);
  @Input() set id(v: string) { this.api.opportunity(v).subscribe(o => this.o.set(o)); }
  deadline(o: Opportunity) { return new Date(Date.UTC(2026, 10, 5) + o.days * 864e5).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }); }
  facts(o: Opportunity) { return [['Prize', o.prizeText], ['Entry fee', o.fee === 'Free' ? 'Free to enter' : o.feeAmt + ' per entry'], ['Who can enter', o.who.join(', ')], ['Format', o.format === 'Online' ? 'Online' : 'In person, ' + o.location], ['Field', o.fields.join(' · ')]]; }
}
