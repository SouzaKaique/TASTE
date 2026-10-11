import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './bottom-nav.component.html',
  styleUrl: './bottom-nav.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BottomNavComponent {
  protected readonly items = [
    { label: 'Início', icon: 'bi-house', route: '/app/inicio' },
    { label: 'Descobrir', icon: 'bi-compass', route: '/app/descobrir' },
    { label: 'Adicionar', icon: 'bi-plus-circle-fill', route: '/app/experiencias/nova', isCta: true },
    { label: 'Social', icon: 'bi-people', route: '/app/social' },
    { label: 'Perfil', icon: 'bi-person-circle', route: '/app/perfil' },
  ];
}
