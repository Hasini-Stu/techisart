import { Component, Input, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { Article } from '../core/models';
import { BylineComponent } from '../shared/byline.component';
import { SaveButtonComponent } from '../shared/save-button.component';
import { VerifiedBadgeComponent } from '../shared/verified-badge.component';

const METER_KEY = 'tia.reads', METER_LIMIT = 3;

@Component({
  standalone: true,
  imports: [FormsModule, RouterLink, BylineComponent, SaveButtonComponent, VerifiedBadgeComponent],
  template: `
  @if (a(); as a) {
    <article class="wrap" style="padding-top:clamp(28px,5vw,56px)">
      <div class="measure" style="max-width:720px">
        <div class="kicker" style="font-size:12px">@if (isResearch()) { <span>Research</span> }<span>{{ a.pillar }}</span><span class="fmt">{{ a.format }}</span></div>
        <h1 class="h1" style="margin:16px 0 18px">{{ a.title }}</h1>
        <p class="deck" style="margin-bottom:26px">{{ a.deck || a.abstract }}</p>
        @if (a.source || a.cite) { <div class="src">{{ a.source || a.cite }}</div> }
        <div class="byrow">
          <div><tia-byline [author]="a.author" [role]="'Verified ' + a.role"></tia-byline>
            <div class="meta" style="margin-top:4px">{{ a.published }} @if (a.readMinutes) { · {{ a.readMinutes }} min read } @if (a.rating?.average) { · Rated {{ a.rating!.average }} by {{ a.rating!.count }} readers }</div></div>
          <div style="display:flex;gap:8px"><a class="btn creator small" [routerLink]="['/creator', a.author]">View portfolio</a><tia-save [item]="a" [labelled]="true"></tia-save></div>
        </div>
        @if (a.disclosure) { <div class="disc"><span class="label" style="color:var(--ink)">Tools used</span><span>{{ a.disclosure }}</span></div> }
      </div>

      @if (a.hero) { <figure class="hero"><div class="placeholder" style="aspect-ratio:16/9">{{ a.hero }}</div><figcaption class="meta">{{ a.caption }}</figcaption></figure> }

      <div class="measure body-text" style="padding-top:clamp(28px,4vw,44px)">
        @if (a.abstract && a.findings) {
          <div class="abs"><div class="kicker">Abstract</div><p>{{ a.abstract }}</p>
            <div class="kicker">Key findings</div>
            @for (f of a.findings; track f; let i = $index) { <div class="finding"><span>{{ i + 1 }}</span><span>{{ f }}</span></div> }
          </div>
        }
        @if (a.original) {
          <div class="orig"><div><div class="label">Summarises · original paper</div><div style="margin-top:6px">{{ a.original }}</div></div><a href="#" (click)="$event.preventDefault()">Read the original ↗</a></div>
        }
        @for (b of a.blocks || []; track $index; let i = $index) {
          @if (showMeter() && i === 5) {
            <aside class="meter">
              <div class="label">You've read {{ reads }} pieces this week</div>
              @if (!subscribed()) {
                <div class="meter-h">Subscribe free for full access.</div>
                <p class="meta" style="font-size:15px;margin:0 0 16px">Keep reading everything on TechIsArt and get new work, research and opportunities each week. You can keep browsing either way.</p>
                <form (ngSubmit)="subscribe()" class="subform"><input class="input" type="email" name="email" [(ngModel)]="email" placeholder="Your email address"><button class="btn cta">Subscribe</button></form>
                @if (subError()) { <div class="error">{{ subError() }}</div> }
                <button class="linkbtn" (click)="meterDismissed.set(true)">Not now</button>
              } @else { <div style="font:500 16px/1.4 var(--sans)">You're subscribed. Thank you.</div> }
            </aside>
          }
          @switch (b.type) {
            @case ('h2') { <h2 class="sub">{{ b.text }}</h2> }
            @case ('quote') { <blockquote><p>{{ b.text }}</p><cite>{{ b.by }}</cite></blockquote> }
            @default { <p>{{ b.text }}</p> }
          }
        }
        @if (a.citation) {
          <div class="rule" style="margin-top:40px"><div class="kicker" style="margin-bottom:12px">Cite this paper</div><div class="cite mono">{{ a.citation }}</div>
            <div class="kicker" style="margin:28px 0 4px">References</div>
            @for (r of a.references || []; track r; let i = $index) { <div class="ref"><span class="mono">[{{ i + 1 }}]</span><span>{{ r }}</span></div> }
          </div>
        }

        <section class="rule rating">
          <div><div class="label">Reader rating</div><div class="avg"><span>{{ a.rating?.average ?? '—' }}</span><span class="meta">out of 5 · {{ a.rating?.count ?? 0 }} readers</span></div></div>
          @if (auth.signedIn()) {
            <div><div class="label" style="margin-bottom:10px">{{ a.myRating ? 'You rated this ' + a.myRating + ' of 5' : 'Rate this piece' }}</div>
              <div style="display:flex;gap:6px">@for (n of [1,2,3,4,5]; track n) { <button class="rate" [class.on]="a.myRating === n" (click)="rate(n)">{{ n }}</button> }</div></div>
          } @else { <div class="meta"><a [routerLink]="['/signin']" [queryParams]="{ returnTo: router.url }">Sign in</a> to rate this piece.</div> }
        </section>

        <section class="rule" style="margin-top:44px">
          @if (isAuthor()) {
            <div class="authorbox"><span class="label" style="color:var(--ink)">Author controls · only you see this</span>
              <button class="switch" [class.on]="a.commentsEnabled" (click)="toggleComments()"><span class="track"></span><span><b>Allow comments on this piece</b></span></button></div>
          }
          @if (a.commentsEnabled) {
            <h2 class="h2" style="font-size:28px">Responses <span class="mono meta">{{ commentCount() }}</span></h2>
            @if (auth.signedIn()) {
              <form (ngSubmit)="post()" class="cform"><textarea class="input serif" name="c" [(ngModel)]="draft" placeholder="Add a response" rows="2"></textarea><button class="btn small">Post response</button></form>
            } @else { <div class="meta" style="padding:16px 0">Responses are open to signed-in readers. <a [routerLink]="['/signin']" [queryParams]="{ returnTo: router.url }">Sign in to respond</a></div> }
            @for (c of a.comments || []; track c.id) {
              <div class="comment">
                <tia-byline [author]="c.name" [role]="c.role" [verified]="c.verified" [meta]="c.time"></tia-byline>
                <p>{{ c.text }}</p>
                @if (auth.signedIn()) { <button class="linkbtn" (click)="replyTo.set(c.id)">Reply</button> }
                @if (replyTo() === c.id) { <form (ngSubmit)="post(c.id)" class="cform"><textarea class="input serif" name="r" [(ngModel)]="replyDraft" rows="2" placeholder="Write a reply"></textarea><button class="btn small">Post reply</button></form> }
                @for (r of c.replies; track r.id) { <div class="reply"><tia-byline [author]="r.name" [role]="r.role" [verified]="r.verified" [meta]="r.time"></tia-byline><p>{{ r.text }}</p></div> }
              </div>
            }
          } @else { <p class="meta" style="font:italic 400 16px/1.5 var(--serif)">Comments are off for this piece.</p> }
        </section>
      </div>
    </article>
  } @else if (notFound()) { <div class="wrap" style="padding:96px 0"><h1 class="h1">Piece not found</h1></div> }
  `,
  styles: [`.src{font:400 13px/1.5 var(--mono);color:var(--ink-2);border-left:2px solid var(--ink);padding:2px 0 2px 12px;margin-bottom:26px}
    .byrow{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:16px;padding:16px 0;border-top:1px solid var(--hairline);border-bottom:1px solid var(--hairline)}
    .disc{display:grid;grid-template-columns:auto 1fr;gap:4px 12px;padding-top:14px;font:400 13px/1.5 var(--sans);color:var(--ink-2)}
    .hero{max-width:1080px;margin:clamp(28px,4vw,44px) auto 0}.hero figcaption{max-width:720px;margin:10px auto 0}
    .abs{background:var(--stone);padding:24px 26px;margin-bottom:36px}.abs p{font-size:17px}
    .finding{display:grid;grid-template-columns:28px 1fr;gap:6px;padding:12px 0;border-bottom:1px solid var(--hairline);font:400 16px/1.5 var(--sans)}.finding span:first-child{font:500 18px/1.3 var(--serif);color:var(--blue)}
    .orig{display:flex;flex-wrap:wrap;justify-content:space-between;gap:12px;background:var(--stone);padding:14px 16px;margin-bottom:28px;font:400 14px/1.45 var(--sans)}.orig a{font-weight:600;white-space:nowrap}
    .sub{font:600 clamp(23px,2.4vw,27px)/1.2 var(--serif);margin:1.6em 0 .6em}
    blockquote{margin:1.8em 0;padding:24px 0;border-top:1px solid var(--ink);border-bottom:1px solid var(--hairline)}
    blockquote p{font:italic 400 clamp(26px,3vw,34px)/1.22 var(--serif)!important;margin:0 0 12px!important}cite{font:500 13px/1 var(--sans);font-style:normal;color:var(--graphite)}
    .cite{background:var(--stone);padding:16px 18px;font-size:13px;line-height:1.6}
    .ref{display:grid;grid-template-columns:28px 1fr;gap:6px;padding:10px 0;border-bottom:1px solid var(--hairline-soft);font:400 14px/1.5 var(--sans);color:var(--ink-2)}
    .meter{margin:2.2em 0;background:var(--stone);border-top:2px solid var(--ink);padding:26px clamp(18px,3vw,28px)}
    .meter-h{font:500 clamp(22px,2.6vw,28px)/1.2 var(--serif);margin:12px 0 8px}
    .subform{display:flex;flex-wrap:wrap;gap:12px 16px;align-items:flex-end}.subform .input{flex:1 1 240px;font:400 19px/1.3 var(--serif)}
    .linkbtn{background:none;border:0;padding:8px 0;font:500 13px/1 var(--sans);color:var(--graphite)}.linkbtn:hover{color:var(--blue)}
    .rating{margin-top:44px;display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-end;gap:20px}
    .avg{display:flex;align-items:baseline;gap:10px;margin-top:10px}.avg span:first-child{font:500 44px/1 var(--serif)}
    .rate{width:40px;height:40px;border:1px solid var(--hairline);background:none;border-radius:2px;font:500 17px/1 var(--serif)}.rate.on{background:var(--blue);border-color:var(--blue);color:#fff}
    .authorbox{background:var(--stone);padding:16px 18px;margin:6px 0 22px;display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:14px}
    .cform{margin:18px 0;display:flex;flex-direction:column;align-items:flex-end;gap:10px}.cform .input{font:400 17px/1.55 var(--serif)}
    .comment{padding:22px 0;border-bottom:1px solid var(--hairline-soft)}.comment p{font-size:17px!important;margin:10px 0 6px 28px!important}
    .reply{margin:16px 0 0 28px;padding-left:18px;border-left:1px solid var(--hairline)}`]
})
export class ArticlePage {
  api = inject(ApiService); auth = inject(AuthService); router = inject(Router);
  a = signal<Article | null>(null); notFound = signal(false);
  replyTo = signal<number | null>(null); draft = ''; replyDraft = ''; email = '';
  subscribed = signal(false); subError = signal(''); meterDismissed = signal(false);
  reads = 0;
  isResearch = computed(() => !!this.a()?.source || !!(this.a() as any)?.abstract);
  isAuthor = computed(() => this.auth.user()?.name === this.a()?.author);
  showMeter = computed(() => !this.auth.signedIn() && !this.meterDismissed() && this.reads >= METER_LIMIT);
  commentCount = computed(() => (this.a()?.comments || []).reduce((n, c) => n + 1 + c.replies.length, 0));

  @Input() set slug(s: string) {
    this.a.set(null);
    this.reads = Number(localStorage.getItem(METER_KEY) || 0) + 1; localStorage.setItem(METER_KEY, String(this.reads));
    this.api.article(s).subscribe({ next: a => this.a.set(a), error: () => this.notFound.set(true) });
  }
  rate(n: number) { const a = this.a()!; this.api.rate(a.slug, n).subscribe(r => this.a.set({ ...a, rating: r, myRating: n })); }
  post(parentId?: number) {
    const a = this.a()!, text = (parentId ? this.replyDraft : this.draft).trim(); if (!text) return;
    this.api.comment(a.slug, text, parentId).subscribe(c => {
      const comments = parentId ? a.comments!.map(x => x.id === parentId ? { ...x, replies: [...x.replies, c] } : x) : [c, ...(a.comments || [])];
      this.a.set({ ...a, comments }); this.draft = ''; this.replyDraft = ''; this.replyTo.set(null);
    });
  }
  toggleComments() { const a = this.a()!; this.api.setComments(a.slug, !a.commentsEnabled).subscribe(r => this.a.set({ ...a, commentsEnabled: r.commentsEnabled })); }
  subscribe() { this.api.subscribe(this.email).subscribe({ next: () => this.subscribed.set(true), error: e => this.subError.set(e.error?.error || 'Something went wrong') }); }
}
