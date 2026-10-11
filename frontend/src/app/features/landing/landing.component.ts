import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LogoComponent } from '../../shared/components/logo/logo.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, LogoComponent],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingComponent {
  // Ordem visual do pódio: 2º, 1º, 3º
  protected readonly podium = [
    { rank: 2, dish: 'Moqueca capixaba' },
    { rank: 1, dish: 'Risoto de funghi' },
    { rank: 3, dish: 'Torta de limão' },
  ];

  // Conteúdo de exemplo da prévia (rotulado como ilustrativo na página)
  protected readonly previewLines = [
    { friend: 'Marina · há 2 h', dish: 'Pad thai de camarão', place: 'Bangkok Garden · Londrina', score: '5,0' },
    { friend: 'Rafael · ontem', dish: 'Menu degustação', place: 'Manu · Curitiba', score: '4,5' },
    { friend: 'Júlia · 3 dias', dish: 'Esfiha de carne', place: 'Ponto da Esfiha · Assis', score: '4,0' },
  ];

  protected readonly steps = [
    { title: 'Registre o prato', text: 'Nome, restaurante, nota de 1 a 5 e, se quiser, foto e um relato. Leva menos de um minuto, ali mesmo na mesa.' },
    { title: 'Seus amigos veem', text: 'Cada registro vira uma indicação no feed de quem você adicionou. Eles curtem, comentam e você recebe o aviso.' },
    { title: 'Descubra onde ir', text: 'Busque restaurantes do Brasil todo e veja quais lugares a sua turma mais indicou nos últimos dias.' },
  ];
}
