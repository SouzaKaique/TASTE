import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LogoComponent } from '../../shared/components/logo/logo.component';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { BottomNavComponent } from '../bottom-nav/bottom-nav.component';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, LogoComponent, AvatarComponent, BottomNavComponent],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellComponent {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly navItems: NavItem[] = [
    { label: 'Início', icon: 'bi-house', route: '/app/inicio' },
    { label: 'Minhas experiências', icon: 'bi-journal-richtext', route: '/app/experiencias' },
    { label: 'Descobrir', icon: 'bi-compass', route: '/app/descobrir' },
    { label: 'Restaurantes', icon: 'bi-shop', route: '/app/restaurantes' },
    { label: 'Mapa', icon: 'bi-geo-alt', route: '/app/mapa' },
    { label: 'Amigos / Feed', icon: 'bi-people', route: '/app/social' },
    { label: 'Retrospectiva', icon: 'bi-stars', route: '/app/retrospectiva' },
    { label: 'Favoritos', icon: 'bi-heart', route: '/app/favoritos' },
    { label: 'Perfil', icon: 'bi-person-circle', route: '/app/perfil' },
  ];

  protected logout(): void {
    this.auth.logout();
    this.router.navigate(['/entrar']);
  }
}
