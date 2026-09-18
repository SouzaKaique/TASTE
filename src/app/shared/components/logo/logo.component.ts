import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type LogoVariant = 'full' | 'mark' | 'stacked';
export type LogoTone = 'brand' | 'light' | 'dark';

@Component({
  selector: 'app-logo',
  standalone: true,
  templateUrl: './logo.component.html',
  styleUrl: './logo.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogoComponent {
  variant = input<LogoVariant>('full');
  tone = input<LogoTone>('brand');
  showTagline = input(false);
}
