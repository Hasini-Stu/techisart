import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { PILLARS } from '../core/models';

const empty = () => ({ title: '', type: '', fields: [] as string[], description: '', deadline: '', who: [] as string[], eligNote: '', fee: 'Free', feeAmt: '', prizes: [] as string[], prizeText: '', format: 'Online', location: '', link: '', org: '', email: '', placement: 'Standard' });

@Component({
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
  @if (!sent()) {
    <div class="wrap split" style="padding-top:24px;padding-bottom:88px">
      <form (ngSubmit)="submit()" style="flex:2 1 560px;min-width:0;max-width:760px">
        <div class="meta"><a routerLink="/opportunities">Opportunities</a> / Post an opportunity</div>
        <h1 style="font:600 clamp(32px,4.4vw,48px)/1.05 var(--sans);letter-spacing:-.03em;margin:16px 0 10px">Post an opportunity</h1>
        <p class="meta" style="font-size:17px">For brands, foundations, studios and organisers. Every listing is reviewed by our editors before it goes live.</p>
        <div class="sec"><div class="label">01 · Title</div><input class="input" name="title" [(ngModel)]="m.title" style="font:600 26px/1.2 var(--sans)" placeholder="e.g. Creative Machines Grant 2027"></div>
        <div class="sec"><div class="label">02 · Type</div><div class="chips">@for (t of ['Competition','Program','Grant','Launch']; track t) { <button type="button" class="chip" [class.on]="m.type === t" (click)="m.type = t">{{ t }}</button> }</div></div>
        <div class="sec"><div class="label">03 · Field</div><div class="chips">@for (p of pillars; track p) { <button type="button" class="chip" [class.on]="m.fields.includes(p)" (click)="tog(m.fields, p)">{{ p }}</button> }</div></div>
        <div class="sec"><div class="label">04 · Description</div><textarea class="input serif" name="d" [(ngModel)]="m.description" rows="6" style="font-size:18px;line-height:1.6"></textarea></div>
        <div class="sec"><div class="label">05 · Deadline</div><input class="input mono" type="date" name="dl" [(ngModel)]="m.deadline" style="max-width:260px"></div>
        <div class="sec"><div class="label">06 · Who can enter</div><div class="chips">@for (w of ['Students','Open to all','Australia','Worldwide']; track w) { <button type="button" class="chip" [class.on]="m.who.includes(w)" (click)="tog(m.who, w)">{{ w }}</button> }</div>
          <input class="input" name="en" [(ngModel)]="m.eligNote" placeholder="Any other conditions" style="margin-top:16px"></div>
        <div class="sec"><div class="label">07 · Entry fee</div><div class="chips">@for (x of ['Free','Paid']; track x) { <button type="button" class="chip" [class.on]="m.fee === x" (click)="m.fee = x">{{ x }}</button> }
          @if (m.fee === 'Paid') { <input class="input mono" name="fa" [(ngModel)]="m.feeAmt" placeholder="Amount" style="width:160px"> }</div></div>
        <div class="sec"><div class="label">08 · Prize</div><div class="chips">@for (p of ['Cash','Exhibition','Mentorship','Feature on our site']; track p) { <button type="button" class="chip" [class.on]="m.prizes.includes(p)" (click)="tog(m.prizes, p)">{{ p }}</button> }</div>
          <input class="input" name="pt" [(ngModel)]="m.prizeText" placeholder="Describe the prize" style="margin-top:16px"></div>
        <div class="sec"><div class="label">09 · Format</div><div class="chips">@for (x of ['Online','In person']; track x) { <button type="button" class="chip" [class.on]="m.format === x" (click)="m.format = x">{{ x }}</button> }
          @if (m.format === 'In person') { <input class="input" name="loc" [(ngModel)]="m.location" placeholder="City, country" style="width:220px"> }</div></div>
        <div class="sec"><div class="label">10 · Application link</div><input class="input mono" name="link" [(ngModel)]="m.link" placeholder="https://"></div>
        <div class="sec"><div class="label">11 · Organiser</div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:18px"><input class="input" name="org" [(ngModel)]="m.org" placeholder="Organisation name"><input class="input" name="em" [(ngModel)]="m.email" placeholder="Contact email"></div></div>
        <div class="sec"><div class="label">12 · Placement</div><div class="chips">
          <button type="button" class="place" [class.on]="m.placement === 'Standard'" (click)="m.placement = 'Standard'"><b>Standard listing</b><span>Free. Listed in the directory once approved.</span></button>
          <button type="button" class="place" [class.on]="m.placement === 'Featured'" (click)="m.placement = 'Featured'"><b>Featured placement</b><span>Paid. Marked Sponsored, shown first and in the Friday Open Calls email.</span></button></div></div>
        @if (error()) { <div class="error">{{ error() }}</div> }
        <div class="rule" style="display:flex;gap:12px;align-items:center;margin-top:8px;padding-top:22px"><button class="btn cta">Send for review</button><span class="meta">Goes to editor moderation before going live.</span></div>
      </form>
    </div>
  } @else {
    <section class="wrap" style="max-width:760px;padding-top:96px;padding-bottom:96px">
      <div class="label">Sent for review</div>
      <h1 style="font:600 clamp(36px,5.4vw,56px)/1.05 var(--sans);letter-spacing:-.03em;margin:16px 0 14px">Your listing is with our editors.</h1>
      <p class="deck">We'll email {{ m.email }} within two working days, with approval or a note on what to change.</p>
      <div class="rule" style="margin-top:28px"><span class="status" style="color:var(--amber)">Pending review</span><h2 style="font:600 26px/1.2 var(--sans);margin:14px 0 6px">{{ m.title }}</h2></div>
      <a routerLink="/opportunities" class="btn" style="display:inline-block;margin-top:26px">Back to Opportunities</a>
    </section>
  }
  `,
  styles: [`.sec{padding:28px 0;border-top:1px solid var(--hairline-soft)}.sec .label{margin-bottom:14px}
    .chips{display:flex;flex-wrap:wrap;gap:6px;align-items:flex-end}
    .place{flex:1 1 240px;text-align:left;background:none;border:1.5px solid var(--hairline);border-radius:2px;padding:16px 18px;display:flex;flex-direction:column;gap:6px;font:400 13px/1.45 var(--sans)}
    .place b{font:600 16px/1.2 var(--sans)}.place.on{border-color:var(--blue);background:#eef3fa}`]
})
export class OpportunitySubmitPage {
  private api = inject(ApiService);
  pillars = PILLARS; m = empty(); sent = signal(false); error = signal('');
  tog(arr: string[], v: string) { const i = arr.indexOf(v); i >= 0 ? arr.splice(i, 1) : arr.push(v); }
  submit() {
    this.api.postOpportunity(this.m).subscribe({ next: () => { this.sent.set(true); window.scrollTo(0, 0); },
      error: e => this.error.set(e.error?.missing ? 'Still needed: ' + e.error.missing.join(', ') + '.' : 'Something went wrong.') });
  }
}
