import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SocialAuthService, SocialProvider } from '../../../core/services/social-auth.service';

/** Botões "Continuar com Google / Apple". Só aparecem depois de configurados no servidor. */
@Component({
  selector: 'app-social-login',
  standalone: true,
  template: `
    @if (social.providers().google || social.providers().apple) {
      <div class="social-login">
        @if (social.providers().google) {
          <button type="button" class="social-btn social-btn--google" [disabled]="!ready() || opening()" (click)="open('google')">
            <svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
            </svg>
            Continuar com Google
          </button>
        }
        @if (social.providers().apple) {
          <button type="button" class="social-btn social-btn--apple" [disabled]="!ready() || opening()" (click)="open('apple')">
            <i class="bi bi-apple" aria-hidden="true"></i>
            Continuar com a Apple
          </button>
        }
        <p class="social-login__terms">Ao continuar, você aceita os termos de uso.</p>
        <p class="social-login__or"><span>ou use seu e-mail</span></p>
      </div>
    }
  `,
  styleUrl: './social-login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SocialLoginComponent {
  protected readonly social = inject(SocialAuthService);
  private readonly route = inject(ActivatedRoute);

  protected readonly ready = signal(false);
  protected readonly opening = signal(false);
  private flow: Awaited<ReturnType<SocialAuthService['prepare']>> | null = null;

  constructor() {
    this.social.loadProviders();
    this.social.prepare().then((flow) => {
      this.flow = flow;
      this.ready.set(true);
    });
  }

  protected open(provider: SocialProvider): void {
    if (!this.flow) return;
    this.opening.set(true);
    this.social.start(provider, this.flow, this.route.snapshot.queryParamMap.get('voltar'));
  }
}
