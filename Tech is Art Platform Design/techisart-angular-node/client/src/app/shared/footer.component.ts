import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { PILLARS, slugify } from '../core/models';

@Component({
  selector: 'tia-footer',
  standalone: true,
  imports: [RouterLink],
  template: `
    <footer><div class="wrap inner">
      <div><div class="mast">Tech<em>Is</em>Art</div><p>A publication and portfolio for people who make things with emerging technology. What you publish here is your record.</p></div>
      <div class="cols">
        <div>@for (p of pillars.slice(0, 4); track p) { <a [routerLink]="['/explore', slug(p)]">{{ p }}</a> }</div>
        <div>@for (p of pillars.slice(4); track p) { <a [routerLink]="['/explore', slug(p)]">{{ p }}</a> }<a routerLink="/research">Research</a></div>
        <div><a routerLink="/opportunities">Opportunities</a><a routerLink="/about">About</a><a routerLink="/write">Contribute</a><a routerLink="/verify">Verification</a>
          @if (auth.signedIn()) { <button (click)="signOut()">Sign out</button> }</div>
      </div>
    </div></footer>
  `,
  styles: [`footer{border-top:1px solid var(--ink);margin-top:48px}
    .inner{padding-top:36px;padding-bottom:48px;display:flex;flex-wrap:wrap;justify-content:space-between;gap:28px}
    .mast{font:600 30px/1 var(--serif);letter-spacing:-.02em}.mast em{font-weight:400}
    p{font:400 14px/1.5 var(--sans);color:var(--graphite);margin:10px 0 0;max-width:320px}
    .cols{display:flex;flex-wrap:wrap;gap:12px 48px}.cols div{display:flex;flex-direction:column;gap:12px}
    a,button{font:500 14px/1 var(--sans);color:var(--ink);background:none;border:0;padding:0;text-align:left}`]
})
export class FooterComponent {
  auth = inject(AuthService); private router = inject(Router);
  pillars = PILLARS; slug = slugify;
  signOut() { this.auth.signOut(); this.router.navigateByUrl('/'); }
}
