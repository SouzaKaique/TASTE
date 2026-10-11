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
  protected readonly benefits = [
    { icon: 'bi-journal-richtext', text: 'Registre pratos com foto, nota e um relato pessoal' },
    { icon: 'bi-star-fill', text: 'Avalie cada experiência de 1 a 5 estrelas' },
    { icon: 'bi-trophy', text: 'Descubra o seu Top 3 na retrospectiva do ano' },
  ];

  // Prévia ilustrativa do Top 3 (dados fictícios, apenas decorativos)
  protected readonly preview = [
    { rank: '1º', dish: 'Risoto de funghi', place: 'São Paulo' },
    { rank: '2º', dish: 'Moqueca capixaba', place: 'Vitória' },
    { rank: '3º', dish: 'Torta de limão', place: 'Rio de Janeiro' },
  ];
}
