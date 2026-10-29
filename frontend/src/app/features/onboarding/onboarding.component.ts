import { ChangeDetectionStrategy, Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { SocialService } from '../../core/services/social.service';
import { ShareService } from '../../shared/services/share.service';
import { ToastService } from '../../shared/services/toast.service';
import { FoodArtComponent } from '../../shared/components/food-art/food-art.component';

const DONE_KEY = 'taste.onboarded';

/** Já viu as boas-vindas neste aparelho? */
export function hasOnboarded(): boolean {
  try {
    return localStorage.getItem(DONE_KEY) === '1';
  } catch {
    return true;
  }
}

interface Slide {
  title: string;
  text: string;
  art: string[];
}

/**
 * Boas-vindas de quem acabou de criar a conta: 3 telas que passam arrastando para o lado
 * (rolagem nativa com "encaixe", como nos apps) e uma final com os primeiros passos.
 */
@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [FoodArtComponent],
  templateUrl: './onboarding.component.html',
  styleUrl: './onboarding.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OnboardingComponent {
  private readonly router = inject(Router);
  private readonly social = inject(SocialService);
  private readonly share = inject(ShareService);
  private readonly toast = inject(ToastService);
  protected readonly firstName = (inject(AuthService).user()?.displayName ?? '').split(' ')[0];

  protected readonly slides: Slide[] = [
    {
      title: 'Seu diário de comida',
      text: 'Registre cada prato em segundos: tire a foto, escolha o restaurante perto de você e dê a nota.',
      art: ['pizza'],
    },
    {
      title: 'Indicações de quem você confia',
      text: 'Veja o que seus amigos andam comendo e salve em "Quero ir" o que deu vontade.',
      art: ['sushi'],
    },
    {
      title: 'Descubra e relembre',
      text: 'Encontre os lugares em alta na sua cidade e, no fim do ano, veja o seu Top 3.',
      art: ['café'],
    },
  ];

  /** Telas: as 3 apresentações + a final (primeiros passos). */
  protected readonly total = this.slides.length + 1;
  protected readonly current = signal(0);
  protected readonly inviting = signal(false);

  private readonly track = viewChild.required<ElementRef<HTMLElement>>('track');

  /** Atualiza a bolinha ativa conforme a pessoa arrasta. */
  protected onScroll(): void {
    const el = this.track().nativeElement;
    this.current.set(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)));
  }

  protected goTo(index: number): void {
    const el = this.track().nativeElement;
    el.scrollTo({ left: index * el.clientWidth, behavior: 'smooth' });
  }

  protected next(): void {
    this.goTo(Math.min(this.total - 1, this.current() + 1));
  }

  protected invite(): void {
    this.inviting.set(true);
    this.social.myInviteCode().subscribe({
      next: (code) => {
        this.inviting.set(false);
        this.share.share({
          title: 'Vem pro TASTE',
          text: 'Tô usando o TASTE pra guardar os pratos que eu como e ver onde os amigos andam comendo. Entra pelo meu convite:',
          path: `/convite/${code}`,
        });
      },
      error: (err: Error) => {
        this.inviting.set(false);
        this.toast.error(err.message);
      },
    });
  }

  protected finish(to: string): void {
    try {
      localStorage.setItem(DONE_KEY, '1');
    } catch {
      // sem armazenamento: as boas-vindas só aparecem logo após o cadastro mesmo
    }
    this.router.navigateByUrl(to);
  }
}
