import { Component, Input, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';

/** Bookmark. Blue = reader layer. */
@Component({
  selector: 'tia-save',
  standalone: true,
  template: `<button type="button" [attr.aria-pressed]="saved()" [title]="saved() ? 'Saved' : 'Save for later'" (click)="toggle($event)" [class.on]="saved()" [class.labelled]="labelled">
    <svg width="12" height="14" viewBox="0 0 13 15"><path d="M1.5 1h10v13l-5-3.4-5 3.4z" [attr.fill]="saved() ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>
    @if (labelled) { {{ saved() ? 'Saved' : 'Save' }} }
  </button>`,
  styles: [`button{background:none;border:0;padding:0 2px;color:var(--muted);display:flex;align-items:center;gap:7px}
    button:hover,button.on{color:var(--blue)}
    button.labelled{border:1px solid var(--hairline);border-radius:3px;padding:8px 12px;font:500 13px/1 var(--sans);color:var(--ink)}
    button.labelled.on{border-color:var(--blue);color:var(--blue)}`]
})
export class SaveButtonComponent {
  private api = inject(ApiService); private auth = inject(AuthService); private router = inject(Router);
  @Input({ required: true }) item!: { slug: string; title: string; pillar?: string; format?: string; author?: string; role?: string };
  @Input() labelled = false;
  saved = computed(() => this.api.saved().some(s => s.slug === this.item?.slug));
  toggle(e: Event) {
    e.preventDefault(); e.stopPropagation();
    if (!this.auth.signedIn()) { this.router.navigate(['/signin'], { queryParams: { returnTo: this.router.url } }); return; }
    this.api.toggleSave(this.item);
  }
}
