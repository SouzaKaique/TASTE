import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../shared/services/toast.service';
import { ProfileVisibility } from '../../../core/models';

@Component({
  selector: 'app-privacy',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './privacy.component.html',
  styleUrl: '../settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrivacyComponent {
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  protected readonly visibility = signal<ProfileVisibility>(this.auth.user()?.profileVisibility ?? 'public');
  protected readonly defaultExperienceVisibility = signal<'public' | 'friends' | 'private'>('public');
  protected readonly allowComments = signal(true);
  protected readonly blockedUsers = signal<string[]>([]);

  protected setVisibility(value: ProfileVisibility): void {
    const previous = this.visibility();
    this.visibility.set(value);
    this.auth.updateProfile({ profileVisibility: value }).subscribe({
      next: () => this.toast.success('Preferência de privacidade atualizada.'),
      error: (err: Error) => {
        this.visibility.set(previous);
        this.toast.error(err.message);
      },
    });
  }
}
