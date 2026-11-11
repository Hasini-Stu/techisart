import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PILLARS, slugify } from '../core/models';

@Component({
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="wrap" style="padding-top:clamp(40px,7vw,88px);padding-bottom:40px">
      <div class="label">About TechIsArt</div>
      <h1 class="display" style="margin:18px 0 22px;max-width:980px">A publication where what you publish becomes your portfolio.</h1>
      <p class="deck" style="max-width:760px">TechIsArt is a publication and portfolio platform for creative-technology professionals. You build your reputation by publishing what you know, and every piece you publish becomes part of a living record of your work.</p>
    </section>
    <div class="wrap measure body-text" style="max-width:760px;margin-left:auto;margin-right:auto">
      <section class="s"><div class="label">01 · Our Story</div><h2>Built for the people doing the work</h2><p>Creative technology moves fast, and most of what gets written about it comes from outside the studio. We started TechIsArt to give the people who build with these tools a place to publish with authority, edited with rigour and credited to the person who earned it.</p></section>
      <section class="s"><div class="label">02 · Our Philosophy</div><blockquote>Tech is the boat. You are the sailor.</blockquote><p>Technology is a tool, and the human is the master. We cover AI and every other emerging creative technology on those terms.</p></section>
      <section class="s"><div class="label">03 · What We Cover</div><h2>Seven pillars, plus Research</h2>
        @for (p of pillars; track p) { <a class="pl" [routerLink]="['/explore', slug(p)]">{{ p }}</a> }<a class="pl" routerLink="/research"><b>Research</b></a></section>
      <section class="s"><div class="label">04 · How It Works</div><h2>Publishing is the portfolio</h2><p>Publish what you know. Editors review every piece for quality. Published work builds your public portfolio. Verified roles make bylines credible.</p></section>
      <section class="s"><div class="label">05 · Our Standards</div><h2>Use technology well, and say how you used it</h2><p>Every piece carries a public tools-used disclosure next to the byline: None, AI-assisted, or AI-generated with human direction.</p></section>
      <section class="s" id="write"><div class="label">06 · Write for Us</div><h2>Share what you know</h2><p>We publish working creatives, researchers, educators and students who have something first-hand to say.</p><a routerLink="/write" class="btn">Start writing</a></section>
      <section class="s"><div class="label">07 · For Brands</div><h2>Reach the people building what's next</h2><p>List competitions, grants, residencies and launches in Opportunities. Partner content is always labelled.</p><a routerLink="/opportunities/new">Post an opportunity →</a></section>
      <section class="s" id="community"><div class="label">08 · Contact</div><p>editors&#64;techisart.com · partners&#64;techisart.com · verify&#64;techisart.com · press&#64;techisart.com</p></section>
    </div>
    <section style="border-top:1px solid var(--ink);background:var(--stone);margin-top:40px"><div class="wrap" style="padding-top:64px;padding-bottom:64px;display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-end;gap:24px">
      <div><h2 style="font:500 clamp(36px,5vw,56px)/1.05 var(--serif);margin:0 0 12px">Write for us.</h2><p class="deck">Publish what you know. Build the portfolio that proves it.</p></div>
      <a routerLink="/write" class="btn cta" style="padding:14px 22px;font-size:15px">Start your first piece</a></div></section>
  `,
  styles: [`.s{padding:44px 0;border-top:1px solid var(--hairline)}.s .label{margin-bottom:14px}
    h2{font:500 clamp(28px,3.2vw,36px)/1.1 var(--serif);margin:0 0 18px}
    blockquote{margin:0 0 28px;padding:26px 0;border-top:1px solid var(--ink);border-bottom:1px solid var(--hairline);font:italic 400 clamp(32px,4.4vw,48px)/1.12 var(--serif)}
    .pl{display:block;padding:14px 0;border-bottom:1px solid var(--hairline-soft);font:500 20px/1.25 var(--serif);color:var(--ink)}`]
})
export class AboutPage { pillars = PILLARS; slug = slugify; }
