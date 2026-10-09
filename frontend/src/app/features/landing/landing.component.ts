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
  protected readonly features = [
    {
      icon: 'bi-journal-richtext',
      title: 'Diário gastronômico',
      description: 'Registre cada prato, sobremesa e bebida com fotos, notas e um relato pessoal.',
    },
    {
      icon: 'bi-star',
      title: 'Avaliações de 1 a 5 estrelas',
      description: 'Uma nota simples e pessoal para cada experiência — sem critérios complicados.',
    },
    {
      icon: 'bi-people',
      title: 'Rede social gastronômica',
      description: 'Siga amigos, curta e comente as descobertas de quem você confia.',
    },
    {
      icon: 'bi-geo-alt',
      title: 'Mapa de experiências',
      description: 'Visualize todos os lugares que você já visitou, cidade por cidade.',
    },
    {
      icon: 'bi-stars',
      title: 'Retrospectiva anual',
      description: 'Descubra automaticamente as três melhores experiências do seu ano.',
    },
    {
      icon: 'bi-collection',
      title: 'Coleções e favoritos',
      description: 'Organize seus pratos e restaurantes preferidos em listas temáticas.',
    },
  ];
}
