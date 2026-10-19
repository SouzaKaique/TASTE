import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { returnUrlFrom } from '../../../core/guards/auth.guard';
import { pendingInvite } from '../../../core/services/pending-invite';
import { SocialService } from '../../../core/services/social.service';
import { AuthService } from '../../../core/services/auth.service';
import { ServerStatusService } from '../../../core/services/server-status.service';
import { ToastService } from '../../../shared/services/toast.service';
import { LogoComponent } from '../../../shared/components/logo/logo.component';
import { AuthAsideComponent } from '../auth-aside/auth-aside.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, LogoComponent, AuthAsideComponent],
  templateUrl: './login.component.html',
  styleUrl: '../auth.shared.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  protected readonly serverStatus = inject(ServerStatusService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly social = inject(SocialService);
  private readonly toast = inject(ToastService);

  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly showPassword = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    this.auth.login(this.form.getRawValue()).pipe(this.serverStatus.watch()).subscribe({
      next: () => {
        this.loading.set(false);
        this.toast.success('Que bom te ver de novo!');
        this.acceptPendingInvite();
        this.router.navigateByUrl(returnUrlFrom(this.route.snapshot.queryParamMap.get('voltar')));
      },
      error: (err: Error) => {
        this.loading.set(false);
        this.errorMessage.set(err.message);
      },
    });
  }

  /** Abriu um convite antes de entrar: vira amigo de quem convidou. */
  private acceptPendingInvite(): void {
    const code = pendingInvite.get();
    if (!code) return;
    pendingInvite.clear();
    this.social.acceptInvite(code).subscribe({
      next: (friend) => this.toast.success(`Agora você e ${friend.displayName} são amigos.`),
      error: () => undefined,
    });
  }
}
