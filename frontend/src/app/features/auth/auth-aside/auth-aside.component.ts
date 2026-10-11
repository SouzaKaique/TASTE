import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LogoComponent } from '../../../shared/components/logo/logo.component';

/** Painel de apresentação ao lado dos formulários de login/cadastro (só no desktop). */
@Component({
  selector: 'app-auth-aside',
  standalone: true,
  imports: [LogoComponent],
  templateUrl: './auth-aside.component.html',
  styleUrl: './auth-aside.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthAsideComponent {
  // Conteúdo de exemplo, rotulado como ilustrativo na tela
  protected readonly previewLines = [
    { friend: 'Marina · há 2 h', dish: 'Pad thai de camarão', place: 'Bangkok Garden · Londrina', score: '5,0' },
    { friend: 'Rafael · ontem', dish: 'Menu degustação', place: 'Manu · Curitiba', score: '4,5' },
    { friend: 'Júlia · 3 dias', dish: 'Esfiha de carne', place: 'Ponto da Esfiha · Assis', score: '4,0' },
  ];
}
