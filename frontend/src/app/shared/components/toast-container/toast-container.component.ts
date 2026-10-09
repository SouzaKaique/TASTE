import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  template: `
    <div class="toast-stack" aria-live="polite">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast-item" [class]="'toast-item--' + toast.tone" role="status">
          <i class="bi" [class.bi-check-circle-fill]="toast.tone === 'success'" [class.bi-x-circle-fill]="toast.tone === 'error'" [class.bi-info-circle-fill]="toast.tone === 'info'"></i>
          <span>{{ toast.text }}</span>
          <button type="button" class="toast-item__close" (click)="toastService.dismiss(toast.id)" aria-label="Fechar aviso">
            <i class="bi bi-x"></i>
          </button>
        </div>
      }
    </div>
  `,
  styleUrl: './toast-container.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastContainerComponent {
  protected readonly toastService = inject(ToastService);
}
