import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-avatar',
  standalone: true,
  template: `
    @if (src()) {
      <img class="avatar" [class]="'avatar--' + size()" [src]="src()" [alt]="name()" />
    } @else {
      <span class="avatar avatar--initials" [class]="'avatar--' + size()" [attr.aria-label]="name()">
        {{ initials() }}
      </span>
    }
  `,
  styleUrl: './avatar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvatarComponent {
  src = input<string | null>(null);
  name = input('');
  size = input<'xs' | 'sm' | 'md' | 'lg' | 'xl'>('md');

  protected readonly initials = computed(() => {
    const parts = this.name().trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
  });
}
