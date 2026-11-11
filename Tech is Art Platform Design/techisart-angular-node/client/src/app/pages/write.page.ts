import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { DISCLOSURES, FORMATS, PILLARS, RESEARCH_TYPES } from '../core/models';

/** Gated: signed out → sign in; reader (level 0) → verify; creator → editor. */
@Component({
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
  @if (!auth.signedIn()) {
    <section class="gate"><div class="label">Write</div><h1 class="h1" style="margin:16px 0">Sign in to write for TechIsArt</h1>
      <p class="deck">Contributors publish what they know about their craft, and every piece they publish becomes part of their public portfolio.</p>
      <div class="btns"><a class="btn" [routerLink]="['/signin']" [queryParams]="{ returnTo: '/write' }">Sign in</a><a class="btn line" [routerLink]="['/signin']" [queryParams]="{ mode: 'up', returnTo: '/write' }">Create an account</a></div></section>
  } @else if (!auth.isCreator()) {
    <section class="gate"><div class="label">Write</div><h1 class="h1" style="margin:16px 0">Get verified to start writing</h1>
      <p class="deck">Every author on TechIsArt is verified before they publish. Writing unlocks at Level 1, which takes 30 points. You have {{ auth.user()?.points }}.</p>
      <div class="btns"><a class="btn" routerLink="/verify">Continue verification</a></div></section>
  } @else if (sent()) {
    <section class="gate" style="text-align:left"><div class="label">Submitted</div><h1 class="h1" style="margin:16px 0">It's with the editors.</h1>
      <p class="deck">An editor in {{ m.pillar }} will read it within five working days. You'll find its status on your workspace.</p>
      <div class="rule" style="margin-top:28px"><span class="status" style="color:var(--purple)">Submitted</span><h2 style="font:500 30px/1.12 var(--serif);margin:14px 0">{{ m.title }}</h2></div>
      <div class="btns" style="justify-content:flex-start"><a class="btn creator" routerLink="/workspace">See it in your workspace</a><button class="btn line" (click)="reset()">Write another</button></div></section>
  } @else {
    <div class="wrap split" style="padding-bottom:80px">
      <form (ngSubmit)="submit()" style="flex:2 1 600px;min-width:0;max-width:780px">
        <div class="sec"><div class="lab"><span class="label">01 · Headline</span><span class="meta">Required</span></div>
          <textarea class="input" name="t" [(ngModel)]="m.title" rows="2" placeholder="Write a headline" style="font:500 clamp(32px,4.4vw,50px)/1.1 var(--serif);resize:none"></textarea>@if (err('title')) { <div class="error">Add a headline.</div> }</div>
        <div class="sec"><div class="lab"><span class="label">02 · Pillar</span><span class="meta">Required</span></div>
          <div class="chips">@for (p of pillars; track p) { <button type="button" class="chip" [class.on]="m.pillar === p" (click)="m.pillar = p">{{ p }}</button> }</div>@if (err('pillar')) { <div class="error">Choose a pillar.</div> }</div>
        <div class="sec"><div class="lab"><span class="label">03 · Format</span><span class="meta">Required</span></div>
          <div class="seg">@for (k of ['Story','Research']; track k) { <button type="button" [class.on]="kind() === k" (click)="kind.set(k); m.format = ''">{{ k }}</button> }</div>
          <div class="chips">@for (f of formats(); track f) { <button type="button" class="chip" [class.on]="m.format === f" (click)="m.format = f">{{ f }}</button> }</div>@if (err('format')) { <div class="error">Choose a format.</div> }</div>
        <div class="sec"><div class="lab"><span class="label">04 · Body</span><span class="meta">Required</span></div>
          <textarea class="input serif" name="b" [(ngModel)]="m.body" placeholder="Start writing. Lead with what you know first-hand." style="min-height:440px;font-size:20px;line-height:1.65"></textarea>
          <div class="mono meta" style="display:flex;justify-content:space-between;font-size:12px;margin-top:10px"><span>{{ words() }} words</span><span>{{ words() ? Math.max(1, Math.round(words() / 230)) + ' min read' : '—' }}</span></div></div>
        @if (kind() === 'Research') { <div class="sec"><div class="lab"><span class="label">05 · Original source / citation</span><span class="meta">Optional</span></div><input class="input mono" name="s" [(ngModel)]="m.source" placeholder="DOI, link or full citation"></div> }
        <div class="sec"><div class="lab"><span class="label">Tech and AI-use disclosure</span><span class="meta">Required</span></div>
          <p style="font:400 15px/1.5 var(--sans);margin:0 0 8px">This appears publicly next to your byline.</p>
          @for (d of disclosures; track d.value) { <button type="button" class="radio" [class.on]="m.disclosure === d.value" (click)="m.disclosure = d.value"><span class="dot"></span><span><b>{{ d.value }}</b><br><span class="meta">{{ d.desc }}</span></span></button> }
          @if (err('disclosure')) { <div class="error">Choose a disclosure. Every piece on TechIsArt carries one.</div> }
          <input class="input" name="n" [(ngModel)]="m.note" placeholder="Note (optional): which tools, and at what stage?" style="margin-top:22px"></div>
        <div class="sec"><button type="button" class="switch" [class.on]="m.comments" (click)="m.comments = !m.comments"><span class="track"></span><span><b>Allow comments on this piece</b><br><span class="meta">Signed-in readers can respond. You can change this later.</span></span></button></div>
        <div class="rule" style="display:flex;gap:12px;align-items:center;padding-top:22px"><button class="btn cta">Submit for review</button><button type="button" class="btn line">Save draft</button></div>
      </form>
      <aside style="flex:1 1 280px;min-width:0;max-width:360px;padding-top:30px">
        <div class="rule"><h3 class="kicker">What we publish</h3><p class="meta">First-hand knowledge from people who make things: how you work, what you tested, what you learned.</p></div>
        <div class="rule" style="border-top-width:1px;margin-top:22px"><h3 class="kicker">Right use</h3><p class="meta">You are the author. Tools can assist; you decide, check and sign. Disclose every tool that shaped the words or images.</p></div>
        <div class="rule" style="border-top-width:1px;margin-top:22px"><h3 class="kicker">After you submit</h3><p class="meta">An editor in your pillar reads it within five working days. Once published, it joins your portfolio.</p></div>
      </aside>
    </div>
  }
  `,
  styles: [`.gate{max-width:680px;margin:0 auto;padding:clamp(56px,9vw,112px) var(--gutter);text-align:center}
    .btns{display:flex;flex-wrap:wrap;justify-content:center;gap:10px;margin-top:32px}
    .sec{padding:30px 0;border-top:1px solid var(--hairline-soft)}.lab{display:flex;justify-content:space-between;margin-bottom:14px}
    .chips{display:flex;flex-wrap:wrap;gap:6px}
    .seg{display:inline-flex;border:1px solid var(--hairline);border-radius:3px;padding:2px;margin-bottom:16px}.seg button{border:0;border-radius:2px;background:none;padding:8px 14px;font:500 13px/1 var(--sans)}.seg button.on{background:var(--ink);color:var(--paper)}
    .radio{width:100%;display:grid;grid-template-columns:20px 1fr;gap:14px;text-align:left;padding:16px 0;border:0;border-bottom:1px solid var(--hairline-soft);background:none;font:400 15px/1.4 var(--sans)}
    .dot{width:18px;height:18px;border-radius:50%;border:1.5px solid var(--muted);margin-top:2px}.radio.on .dot{border-color:var(--blue);box-shadow:inset 0 0 0 4px var(--paper);background:var(--blue)}`]
})
export class WritePage {
  auth = inject(AuthService); private api = inject(ApiService); private router = inject(Router);
  Math = Math; pillars = PILLARS; disclosures = DISCLOSURES;
  kind = signal('Story'); sent = signal(false); showErr = signal(false);
  m = { title: '', pillar: '', format: '', body: '', source: '', disclosure: '', note: '', comments: true };
  formats = computed(() => this.kind() === 'Research' ? RESEARCH_TYPES : FORMATS);
  words() { return this.m.body.trim() ? this.m.body.trim().split(/\s+/).length : 0; }
  err(k: 'title' | 'pillar' | 'format' | 'disclosure') { return this.showErr() && !this.m[k].trim(); }
  submit() {
    if (!this.m.title.trim() || !this.m.pillar || !this.m.format || !this.m.body.trim() || !this.m.disclosure) { this.showErr.set(true); return; }
    this.api.submit(this.m).subscribe(() => { this.sent.set(true); window.scrollTo(0, 0); });
  }
  reset() { this.m = { title: '', pillar: '', format: '', body: '', source: '', disclosure: '', note: '', comments: true }; this.sent.set(false); this.showErr.set(false); }
}
