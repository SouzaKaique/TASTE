import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';

/**
 * Capa de restaurante: foto pública da comunidade (quando existe) ou uma capa
 * ilustrada com as iniciais, em uma cor estável derivada do nome.
 * Não usamos logos/fotos oficiais porque são protegidos por direitos autorais.
 */
@Component({
  selector: 'app-restaurant-cover',
  standalone: true,
  template: `
    <div class="cover" [style.--cover-hue]="hue()">
      @if (photoUrl() && !photoFailed()) {
        <img [src]="photoUrl()" [alt]="'Foto registrada em ' + name()" loading="lazy" (error)="photoFailed.set(true)" />
        <span class="cover__credit"><i class="bi bi-camera"></i> Foto da comunidade</span>
      } @else {
        <span class="cover__monogram" aria-hidden="true">{{ initials() }}</span>
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
        background:
          radial-gradient(circle at 80% 15%, hsl(var(--cover-hue) 45% 42% / 0.55), transparent 55%),
          linear-gradient(135deg, hsl(var(--cover-hue) 38% 24%), var(--taste-wine-900));
      }

      img { width: 100%; height: 100%; object-fit: cover; }

      .cover__monogram {
        font-family: var(--font-serif);
        font-size: clamp(2rem, 6vw, 3.2rem);
        font-weight: 600;
        letter-spacing: 0.06em;
        color: rgba(248, 246, 241, 0.92);
      }

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

  protected readonly photoFailed = signal(false);

  protected readonly initials = computed(() => {
    const words = this.name()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 || /\d/.test(w));
    const letters = (words.length ? words : [this.name()]).slice(0, 2).map((w) => w[0]);
    return letters.join('').toUpperCase();
  });

  /** Tom entre vinho, terracota e dourado, sempre o mesmo para o mesmo nome. */
  protected readonly hue = computed(() => {
    let hash = 0;
    for (const char of this.name()) hash = (hash * 31 + char.charCodeAt(0)) | 0;
    return String(330 + (Math.abs(hash) % 70)); // 330..399: do vinho ao laranja-dourado
  });
}
