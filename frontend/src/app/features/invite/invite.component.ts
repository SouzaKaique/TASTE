import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { SocialService } from '../../core/services/social.service';
import { pendingInvite } from '../../core/services/pending-invite';
import { ToastService } from '../../shared/services/toast.service';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { LogoComponent } from '../../shared/components/logo/logo.component';

interface Inviter {
  displayName: string;
  username: string;
  avatarUrl: string | null;
}

/** Página do link de convite: mostra quem convidou e leva ao cadastro (ou aceita, se já tem conta). */
@Component({
  selector: 'app-invite',
  standalone: true,
  imports: [RouterLink, AvatarComponent, LogoComponent],
  templateUrl: './invite.component.html',
  styleUrl: './invite.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InviteComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly social = inject(SocialService);
  private readonly toast = inject(ToastService);
  protected readonly auth = inject(AuthService);

  protected readonly code = this.route.snapshot.paramMap.get('code') ?? '';
  protected readonly inviter = signal<Inviter | null>(null);
  protected readonly notFound = signal(false);
  protected readonly accepting = signal(false);

  ngOnInit(): void {
    this.social.inviter(this.code).subscribe({
      next: (inviter) => {
        this.inviter.set(inviter);
        // Sem conta ainda: guarda o convite para valer depois do cadastro/login
        if (!this.auth.isAuthenticated()) pendingInvite.set(this.code);
      },
      error: () => this.notFound.set(true),
    });
  }

  protected isMe(): boolean {
    return this.auth.user()?.username === this.inviter()?.username;
  }

  protected accept(): void {
    this.accepting.set(true);
    this.social.acceptInvite(this.code).subscribe({
      next: (friend) => {
        this.toast.success(`Agora você e ${friend.displayName} são amigos.`);
        this.router.navigate(['/app/perfil', friend.username]);
      },
      error: (err: Error) => {
        this.accepting.set(false);
        this.toast.error(err.message);
      },
    });
  }
}
