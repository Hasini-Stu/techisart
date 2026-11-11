import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { VerifiedBadgeComponent } from './verified-badge.component';

@Component({
  selector: 'tia-byline',
  standalone: true,
  imports: [RouterLink, VerifiedBadgeComponent],
  template: `
    <a class="by" [routerLink]="['/creator', author]" (click)="$event.stopPropagation()">
      <span class="av">{{ initials }}</span><span class="author-link">{{ author }}</span>
    </a>
    @if (verified) { <tia-verified></tia-verified> }
    <span [class.role]="verified" [class.meta]="!verified">{{ role }}</span>
    @if (meta) { <span class="meta">· {{ meta }}</span> }
  `,
  styles: [`:host{display:flex;flex-wrap:wrap;align-items:center;gap:6px;font:500 13px/1.3 var(--sans)}
    .by{display:flex;align-items:center;gap:6px;text-decoration:none}
    .av{width:22px;height:22px;border-radius:50%;background:#e6e2d9;display:flex;align-items:center;justify-content:center;font:600 9px/1 var(--sans);color:var(--ink)}`]
})
export class BylineComponent {
  @Input({ required: true }) author = '';
  @Input() role = '';
  @Input() verified = true;
  @Input() meta = '';
  get initials() { return this.author.split(' ').filter(w => /^[A-Z]/.test(w) && w !== 'Dr.').map(w => w[0]).slice(0, 2).join(''); }
}
