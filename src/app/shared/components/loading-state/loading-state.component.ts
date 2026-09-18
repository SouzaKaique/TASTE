import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-loading-state',
  standalone: true,
  template: `
    <div class="loading-state" role="status" [attr.aria-label]="label()">
      <div class="loading-state__grid">
        @for (i of skeletons(); track i) {
          <div class="skeleton loading-state__block"></div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .loading-state__grid {
        display: grid;
        gap: var(--space-4);
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      }
      .loading-state__block {
        height: 220px;
        border-radius: var(--radius-lg);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingStateComponent {
  count = input(6);
  label = input('Carregando conteúdo');
  protected readonly skeletons = () => Array.from({ length: this.count() }, (_, i) => i);
}
