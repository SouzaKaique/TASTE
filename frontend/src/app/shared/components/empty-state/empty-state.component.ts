import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  template: `
    <div class="empty-state">
      <i class="bi" [class]="icon()"></i>
      <h3>{{ title() }}</h3>
      <p>{{ description() }}</p>
      <ng-content></ng-content>
    </div>
  `,
  styles: [
    `
      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: var(--space-2);
        padding: var(--space-6) var(--space-4);
        color: var(--color-text-secondary);
        background: var(--felt-deep);
        border: 1px dashed var(--color-border-strong);
        border-radius: var(--radius-lg);
      }
      .empty-state i {
        font-size: 2rem;
        color: var(--brass);
        margin-bottom: var(--space-2);
      }
      .empty-state h3 { margin: 0; font-size: 1.625rem; color: var(--color-text-primary); }
      .empty-state p { max-width: 32ch; margin: 0; }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyStateComponent {
  icon = input('bi-journal-richtext');
  title = input('Nada por aqui ainda');
  description = input('');
}
