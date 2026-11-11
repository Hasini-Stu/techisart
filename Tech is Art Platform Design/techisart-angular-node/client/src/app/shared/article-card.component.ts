import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Article } from '../core/models';
import { BylineComponent } from './byline.component';
import { SaveButtonComponent } from './save-button.component';

@Component({
  selector: 'tia-article-card',
  standalone: true,
  imports: [RouterLink, BylineComponent, SaveButtonComponent],
  template: `
    <a class="card" [routerLink]="['/article', a.slug]">
      @if (showImage) { <div class="placeholder img">{{ a.image }}</div> }
      <div class="kicker"><span>{{ a.pillar }}</span><span class="fmt">{{ a.format }}</span><tia-save class="save" [item]="a"></tia-save></div>
      <h3>{{ a.title }}</h3>
      @if (a.deck && showDeck) { <p>{{ a.deck }}</p> }
    </a>
    <tia-byline [author]="a.author" [role]="a.role"></tia-byline>
  `,
  styles: [`.card{display:block;color:inherit;text-decoration:none}
    .img{aspect-ratio:3/2;margin-bottom:12px}
    .save{margin-left:auto}
    h3{font:500 20px/1.2 var(--serif);margin:8px 0 7px;text-wrap:pretty}
    .card:hover h3{text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:3px}
    p{font:400 15px/1.45 var(--serif);color:var(--ink-2);margin:0 0 10px;text-wrap:pretty}`]
})
export class ArticleCardComponent {
  @Input({ required: true }) a!: Article;
  @Input() showImage = true;
  @Input() showDeck = true;
}
