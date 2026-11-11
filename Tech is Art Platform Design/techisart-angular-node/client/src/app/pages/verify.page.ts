import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';

@Component({
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
  @if (v(); as v) {
    <section class="wrap" style="padding-top:clamp(28px,5vw,56px)">
      <div class="label" style="color:var(--purple)">Verification</div>
      <h1 class="h1" style="margin:14px 0">{{ v.level >= 1 ? 'Level 1 · Verified. Next: Expert.' : 'Get verified to start writing.' }}</h1>
      <p class="deck" style="max-width:680px">Every author on TechIsArt is verified before they publish. It is how readers know a byline is real. It is free, and most people finish in a few days.</p>
      <div class="rule" style="margin-top:32px;max-width:840px">
        <div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:12px"><span style="font:500 clamp(40px,4.8vw,54px)/1 var(--serif)">{{ v.points }}<span class="meta" style="font-size:.4em"> / {{ v.target }} points</span></span>
          <span class="status" [style.color]="v.level >= 1 ? 'var(--purple)' : 'var(--graphite)'">Level {{ v.level }} · {{ v.level >= 1 ? 'Verified' : 'Unverified' }}</span></div>
        <div class="bar"><div [style.width.%]="Math.min(100, v.points / v.target * 100)"></div></div>
        @if (v.pending) { <div class="pending">{{ v.pending }}. An editor usually replies within two working days.</div> }
      </div>
    </section>
    <section class="wrap" style="padding-top:40px;padding-bottom:88px;max-width:900px;margin-left:0">
      @for (lv of [1, 2]; track lv) {
        <div class="rule" style="margin-top:24px"><h2 class="h2" style="font-size:26px">Level {{ lv }} · {{ lv === 1 ? 'Verified' : 'Expert' }}</h2></div>
        @for (s of stepsFor(lv); track s.id) {
          <div class="step" [class.locked]="lv === 2 && v.level < 1">
            <span class="dot" [class.done]="s.done">{{ s.done ? '✓' : '' }}</span>
            <div style="min-width:0"><b>{{ s.label }}</b><div class="meta">{{ s.desc }}</div>
              @if (open() === s.id) {
                <div class="panel">
                  @switch (s.kind) {
                    @case ('samples') { <input class="input mono" [(ngModel)]="url" placeholder="https://your-portfolio.com"><button class="btn small" (click)="complete(s.id, { url: url })">Add link</button> }
                    @case ('ref') { <input class="input" [(ngModel)]="refName" placeholder="Their name"><input class="input" [(ngModel)]="refEmail" placeholder="Their email"><button class="btn small" (click)="complete(s.id, { refName: refName, refEmail: refEmail })">Send request</button> }
                    @case ('check') { @for (slot of slots; track slot) { <button class="chip" [class.on]="slotPick === slot" (click)="slotPick = slot">{{ slot }}</button> }<button class="btn small" [disabled]="!slotPick" (click)="complete(s.id, { slot: slotPick })">Book call</button> }
                    @case ('cred') { <input class="input" [(ngModel)]="cred" placeholder="e.g. Co-author, Journal of Creative Computing 9(3)"><button class="btn small" (click)="complete(s.id, { cred: cred })">Add credential</button> }
                  }
                </div>
              }
            </div>
            <div class="right"><span class="mono" [style.color]="s.done ? 'var(--purple)' : 'var(--graphite)'">{{ s.done ? '+' : '' }}{{ s.pts }} pts</span>
              @if (s.kind && !s.done && !(lv === 2 && v.level < 1)) { <button class="btn line small" (click)="open.set(open() === s.id ? null : s.id)">{{ open() === s.id ? 'Close' : s.act }}</button> }</div>
          </div>
        }
      }
    </section>
  }
  `,
  styles: [`.bar{height:4px;background:var(--hairline-soft);margin:18px 0 8px}.bar div{height:100%;background:var(--purple)}
    .pending{margin-top:20px;border:1px solid var(--purple);padding:14px 16px;font:500 15px/1.45 var(--sans)}
    .step{display:grid;grid-template-columns:26px minmax(0,1fr) auto;gap:14px;padding:18px 0;border-bottom:1px solid var(--hairline-soft);font:400 15px/1.4 var(--sans)}.step.locked{opacity:.55}
    .dot{width:20px;height:20px;border-radius:50%;border:1.5px solid var(--muted);display:flex;align-items:center;justify-content:center;color:#fff;font:700 11px/1 var(--sans)}.dot.done{background:var(--purple);border-color:var(--purple)}
    .right{display:flex;flex-direction:column;align-items:flex-end;gap:8px;font-size:12px}
    .panel{margin-top:14px;background:var(--stone);padding:16px 18px;display:flex;flex-wrap:wrap;gap:12px;align-items:flex-end}.panel .input{flex:1 1 220px}`]
})
export class VerifyPage {
  private api = inject(ApiService); private auth = inject(AuthService);
  Math = Math; v = signal<any>(null); open = signal<string | null>(null);
  url = ''; refName = ''; refEmail = ''; cred = ''; slotPick = '';
  slots = ['Tue · 14:00 CET', 'Wed · 10:30 CET', 'Thu · 16:00 CET'];
  constructor() { this.load(); }
  load() { this.api.verification().subscribe(v => this.v.set(v)); }
  stepsFor(lv: number) { return (this.v()?.steps || []).filter((s: any) => s.lv === lv); }
  complete(id: string, body: unknown) { this.api.completeStep(id, body).subscribe(() => { this.open.set(null); this.load(); this.auth.refresh(); }); }
}
