import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ConfirmService } from '../../services/confirm.service';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  template: `
    @if (confirmService.state(); as state) {
      <div class="confirm-backdrop" (click)="confirmService.resolve(false)">
        <div
          class="confirm-dialog"
          role="alertdialog"
          aria-modal="true"
          [attr.aria-label]="state.title"
          (click)="$event.stopPropagation()"
        >
          <h3>{{ state.title }}</h3>
          <p>{{ state.message }}</p>
          <div class="confirm-dialog__actions">
            <button type="button" class="btn btn-ghost" (click)="confirmService.resolve(false)">
              {{ state.cancelLabel ?? 'Cancelar' }}
            </button>
            <button
              type="button"
              class="btn"
              [class.btn-primary]="!state.danger"
              [class.btn-danger]="state.danger"
              (click)="confirmService.resolve(true)"
            >
              {{ state.confirmLabel ?? 'Confirmar' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styleUrl: './confirm-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmModalComponent {
  protected readonly confirmService = inject(ConfirmService);
}
