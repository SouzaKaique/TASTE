import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-tag',
  standalone: true,
  template: `<span class="tag" [class.tag--soft]="tone() === 'soft'">{{ label() }}</span>`,
  styles: [
    `
      .tag {
        display: inline-flex;
        align-items: center;
        padding: 0.28rem 0.65rem;
        font-size: var(--fs-caption);
        font-weight: 600;
        letter-spacing: 0.02em;
        border-radius: var(--radius-pill);
        background: var(--color-surface-alt);
        color: var(--color-text-secondary);
        white-space: nowrap;
      }
      .tag--soft {
        background: var(--color-brand-soft);
        color: var(--color-brand-strong);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TagComponent {
  label = input.required<string>();
  tone = input<'default' | 'soft'>('default');
}
