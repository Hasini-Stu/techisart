import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { ApiService } from '../core/api.service';
import { PILLARS, slugify } from '../core/models';

@Component({
  selector: 'tia-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="wrap">
      <div class="top">
        <div class="left">
          <a routerLink="/research" aria-label="Search" class="icon"><svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="8.5" cy="8.5" r="6"/><path d="M13 13l5 5"/></svg></a>
          <span class="date">{{ today }}</span>
        </div>
        <div class="right">
          @if (auth.signedIn()) { <a routerLink="/account" class="icon" title="Your reading"><svg width="14" height="17" viewBox="0 0 13 15"><path d="M1.5 1h10v13l-5-3.4-5 3.4z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg></a> }
          <a routerLink="/subscribe" class="sub">Subscribe</a>
          <a routerLink="/write" class="btn small">Write</a>
          @if (auth.signedIn()) { <a routerLink="/account" class="avatar" title="Your account">{{ auth.initials() }}</a> }
          @else { <a [routerLink]="['/signin']" class="signin">Sign in</a><a [routerLink]="['/signin']" [queryParams]="{ mode: 'up' }" class="btn line small">Sign up</a> }
        </div>
      </div>
      <a routerLink="/" class="mast">Tech<em>Is</em>Art</a>
      <nav>
        <div class="row">
          @for (p of pillars; track p.name) { <a [routerLink]="['/explore', p.slug]" routerLinkActive="active">{{ p.name }}</a> }
          <span class="sep"></span>
          <a routerLink="/research" routerLinkActive="active" class="strong"><span class="sq"></span>Research</a>
          <span class="sep"></span>
          <a routerLink="/opportunities" routerLinkActive="active opp" class="dim">Opportunities</a>
          <a routerLink="/about" fragment="community" class="dim">Community</a>
          <a routerLink="/about" routerLinkActive="active" class="dim">About</a>
        </div>
      </nav>
    </header>
  `,
  styles: [`.top{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:16px 0 4px}
    .left,.right{display:flex;align-items:center;gap:12px}
    .icon{display:flex;color:var(--ink);padding:6px}.icon:hover{color:var(--blue)}
    .date{font:500 13px/1.3 var(--sans);color:var(--graphite)}
    .sub{font:600 13px/1 var(--sans);color:var(--pink)}
    .signin{font:500 13px/1 var(--sans);color:var(--ink)}
    .avatar{width:34px;height:34px;border-radius:50%;background:#e6e2d9;display:flex;align-items:center;justify-content:center;font:600 12px/1 var(--sans);color:var(--ink);text-decoration:none}
    .mast{display:block;text-align:center;padding:6px 0 14px;font:600 clamp(42px,7.5vw,80px)/1 var(--serif);letter-spacing:-.025em;color:var(--ink);text-decoration:none}
    .mast em{font-weight:400}
    nav{border-top:1px solid var(--ink);border-bottom:1px solid var(--hairline);box-shadow:0 -4px 0 -3px var(--ink);overflow-x:auto;margin-top:4px}
    .row{display:flex;align-items:center;gap:clamp(16px,2.2vw,28px);width:max-content;margin:0 auto;padding:13px 4px;font:500 14px/1 var(--sans);white-space:nowrap}
    .row a{color:var(--ink);text-decoration:none;padding-bottom:4px;margin-bottom:-6px;border-bottom:2px solid transparent;display:flex;align-items:center;gap:7px}
    .row a.active{border-bottom-color:var(--blue)} .row a.active.opp{border-bottom-color:var(--amber)}
    .row .dim{color:var(--graphite)} .row .strong{font-weight:600}
    .sq{width:8px;height:8px;background:var(--ink)}
    .sep{width:1px;height:16px;background:var(--hairline)}
    @media (max-width:640px){.date{display:none}}`]
})
export class HeaderComponent {
  auth = inject(AuthService); private api = inject(ApiService); private router = inject(Router);
  pillars = PILLARS.map(name => ({ name, slug: slugify(name) }));
  today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  constructor() { if (this.auth.signedIn()) { this.api.loadSaved(); this.auth.refresh(); } }
}
