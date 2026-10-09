import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../shared/services/toast.service';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { resizeImageToDataUrl } from '../../shared/utils/image-resize.util';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, AvatarComponent],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent {
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);

  protected readonly user = this.auth.user;
  protected readonly avatarPreview = signal<string | null>(this.auth.user()?.avatarUrl ?? null);
  protected readonly saving = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    displayName: [this.auth.user()?.displayName ?? '', Validators.required],
    // O username identifica a conta e não pode ser alterado.
    username: [{ value: this.auth.user()?.username ?? '', disabled: true }],
    bio: [this.auth.user()?.bio ?? '', Validators.maxLength(2000)],
  });

  protected onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    resizeImageToDataUrl(file, 256)
      .then((dataUrl) => this.avatarPreview.set(dataUrl))
      .catch((err: Error) => this.toast.error(err.message));
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { displayName, bio } = this.form.getRawValue();
    this.saving.set(true);
    this.auth.updateProfile({ displayName, bio, avatarUrl: this.avatarPreview() ?? '' }).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success('Perfil atualizado.');
      },
      error: (err: Error) => {
        this.saving.set(false);
        this.toast.error(err.message);
      },
    });
  }
}
