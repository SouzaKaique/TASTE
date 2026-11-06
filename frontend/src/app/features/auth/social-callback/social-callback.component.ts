import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { returnUrlFrom } from '../../../core/guards/auth.guard';
import { pendingInvite } from '../../../core/services/pending-invite';
import { SocialResult, SocialAuthService } from '../../../core/services/social-auth.service';
import { SocialService } from '../../../core/services/social.service';
import { ToastService } from '../../../shared/services/toast.service';
import { LogoComponent } from '../../../shared/components/logo/logo.component';
import { hasOnboarded } from '../../onboarding/onboarding.component';
import { AuthAsideComponent } from '../auth-aside/auth-aside.component';

type Phase = 'waiting' | 'close-window' | 'link' | 'error';

const POLL_MS = 1500;
/** O servidor guarda o login por 10 minutos. */
const GIVE_UP_MS = 10 * 60 * 1000;

/**
 * Onde o login com Google/Apple termina. Três situações:
 * - voltou nesta mesma aba: entra na hora;
 * - app instalado: esta tela espera enquanto o login acontece na outra janela;
 * - é a outra janela: só avisa que pode fechar (quem entra é o app).
 */
@Component({
  selector: 'app-social-callback',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, LogoComponent, AuthAsideComponent],
  templateUrl: './social-callback.component.html',
  styleUrl: '../auth.shared.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SocialCallbackComponent {
  private readonly social = inject(SocialAuthService);
  private readonly socialNetwork = inject(SocialService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected readonly phase = signal<Phase>('waiting');
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly linkEmail = signal('');
  protected readonly linking = signal(false);
  protected readonly passwordControl = inject(FormBuilder).nonNullable.control('', Validators.required);

  private readonly flow;
  private readonly startedAt = Date.now();
  private pollTimer?: ReturnType<typeof setTimeout>;
  private polling = false;

  constructor() {
    const query = inject(ActivatedRoute).snapshot.queryParamMap;
    this.flow = this.social.currentFlow(query.get('state'));

    if (query.has('janela')) {
      this.phase.set('close-window');
      window.close();
    } else if (!this.flow) {
      this.fail('Este login expirou. Comece de novo.');
    } else {
      const poll = () => this.poll();
      // Fechar a janela do login traz o app de volta: confere na hora, sem esperar o próximo ciclo
      document.addEventListener('visibilitychange', poll);
      inject(DestroyRef).onDestroy(() => {
        clearTimeout(this.pollTimer);
        document.removeEventListener('visibilitychange', poll);
      });
      this.poll();
    }
  }

  protected confirmPassword(): void {
    if (!this.flow || this.passwordControl.invalid) {
      this.passwordControl.markAsTouched();
      return;
    }
    this.linking.set(true);
    this.errorMessage.set(null);
    this.social.link(this.flow, this.passwordControl.value).subscribe({
      next: (result) => this.handle(result),
      error: (err: Error) => {
        this.linking.set(false);
        this.errorMessage.set(err.message);
      },
    });
  }

  private poll(): void {
    if (!this.flow || this.polling || this.phase() !== 'waiting' || document.hidden) return;
    clearTimeout(this.pollTimer);
    this.polling = true;
    this.social.result(this.flow).subscribe({
      next: (result) => {
        this.polling = false;
        this.handle(result);
      },
      error: (err: Error) => {
        this.polling = false;
        this.fail(err.message);
      },
    });
  }

  private handle(result: SocialResult): void {
    if (result.status === 'pending') {
      if (Date.now() - this.startedAt > GIVE_UP_MS) {
        this.fail('Este login expirou. Comece de novo.');
      } else {
        this.pollTimer = setTimeout(() => this.poll(), POLL_MS);
      }
    } else if (result.status === 'link-required') {
      this.linkEmail.set(result.email);
      this.phase.set('link');
    } else {
      this.finish(result.newAccount);
    }
  }

  private finish(newAccount: boolean): void {
    this.toast.success(newAccount ? 'Conta criada! Boas-vindas ao TASTE.' : 'Que bom te ver de novo!');
    this.acceptPendingInvite();
    const back = this.flow?.back ?? null;
    const destination = newAccount && !back && !hasOnboarded() ? '/boas-vindas' : returnUrlFrom(back);
    this.router.navigateByUrl(destination, { replaceUrl: true });
  }

  private fail(message: string): void {
    this.social.clearFlow();
    this.errorMessage.set(message);
    this.phase.set('error');
  }

  /** Abriu um convite antes de entrar: vira amigo de quem convidou. */
  private acceptPendingInvite(): void {
    const code = pendingInvite.get();
    if (!code) return;
    pendingInvite.clear();
    this.socialNetwork.acceptInvite(code).subscribe({
      next: (friend) => this.toast.success(`Agora você e ${friend.displayName} são amigos.`),
      error: () => undefined,
    });
  }
}
