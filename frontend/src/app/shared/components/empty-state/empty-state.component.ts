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
        padding: var(--space-8) var(--space-4);
        color: var(--color-text-secondary);
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-sm);
      }
      .empty-state i {
        font-size: 2.25rem;
        color: var(--color-brand);
        margin-bottom: var(--space-2);
      }
      .empty-state h3 { margin: 0; color: var(--color-text-primary); }
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
