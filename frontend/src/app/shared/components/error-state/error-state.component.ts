import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-error-state',
  standalone: true,
  template: `
    <div class="error-state" role="alert">
      <i class="bi bi-exclamation-triangle"></i>
      <h3>{{ title() }}</h3>
      <p>{{ description() }}</p>
      @if (retryable()) {
        <button type="button" class="btn btn-outline-primary btn-sm" (click)="retry.emit()">
          Tentar novamente
        </button>
      }
    </div>
  `,
  styles: [
    `
      .error-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: var(--space-2);
        padding: var(--space-7) var(--space-4);
        color: var(--color-text-secondary);
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-sm);
      }
      .error-state i { font-size: 2rem; color: var(--taste-danger, #a13d3d); }
      .error-state h3 { margin: 0; color: var(--color-text-primary); }
      .error-state p { max-width: 34ch; margin: 0; }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorStateComponent {
  title = input('Algo deu errado');
  description = input('Não foi possível carregar esta informação agora.');
  retryable = input(true);
  retry = output<void>();
}
