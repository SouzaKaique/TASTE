import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { FoodArtComponent } from '../food-art/food-art.component';

/**
 * Capa de restaurante: foto pública da comunidade (quando existe) ou uma
 * ilustração do tipo de comida (pizza, japonesa, café...), desenhada pelo TASTE.
 * Não usamos logos/fotos oficiais porque são protegidos por direitos autorais.
 */
@Component({
  selector: 'app-restaurant-cover',
  standalone: true,
  imports: [FoodArtComponent],
  template: `
    <div class="cover">
      @if (photoUrl() && !photoFailed()) {
        <img [src]="photoUrl()" [alt]="'Foto registrada em ' + name()" loading="lazy" (error)="photoFailed.set(true)" />
        <span class="cover__credit"><i class="bi bi-camera"></i> Foto da comunidade</span>
      } @else {
        <app-food-art [hints]="[name()].concat(cuisines())"></app-food-art>
      }
    </div>
  `,
  styles: [
    `
      :host { display: block; height: 100%; }

      .cover {
        position: relative;
        height: 100%;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--taste-wine-900);
      }

      img { width: 100%; height: 100%; object-fit: cover; }

      .cover__credit {
        position: absolute;
        right: var(--space-2);
        bottom: var(--space-2);
        padding: 0.15rem 0.5rem;
        border-radius: var(--radius-pill);
        background: rgba(36, 21, 25, 0.65);
        color: var(--taste-beige-100);
        font-size: 0.68rem;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RestaurantCoverComponent {
  name = input.required<string>();
  photoUrl = input<string | null | undefined>(null);
  cuisines = input<string[]>([]);

  protected readonly photoFailed = signal(false);
}
