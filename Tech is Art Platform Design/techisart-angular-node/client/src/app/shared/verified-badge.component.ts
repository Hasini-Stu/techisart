import { Component, Input } from '@angular/core';

/** Purple = creator layer. Shown next to every verified byline. */
@Component({
  selector: 'tia-verified',
  standalone: true,
  template: `<svg [attr.width]="size" [attr.height]="size" viewBox="0 0 16 16" aria-label="Verified"><circle cx="8" cy="8" r="8" fill="#5b3a8c"/><path d="M4.5 8.2l2.3 2.3 4.7-4.9" stroke="#fff" stroke-width="1.8" fill="none"/></svg>`,
  styles: [':host{display:inline-flex}']
})
export class VerifiedBadgeComponent { @Input() size = 13; }
