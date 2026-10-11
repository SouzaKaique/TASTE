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
        min-height: 26px;
        padding: 0.2rem 0.55rem;
        font-size: 0.6875rem;
        font-weight: 700;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        border-radius: var(--radius-sm);
        border: 1px solid var(--color-border-strong);
        background: transparent;
        color: var(--color-text-secondary);
        white-space: nowrap;
      }
      .tag::before { content: '#'; margin-right: 0.15em; color: var(--brass); }
      .tag--soft { color: var(--color-text-primary); }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TagComponent {
  label = input.required<string>();
  tone = input<'default' | 'soft'>('default');
}
