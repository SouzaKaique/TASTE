import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Restaurant } from '../../../core/models';

@Component({
  selector: 'app-restaurant-card',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './restaurant-card.component.html',
  styleUrl: './restaurant-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RestaurantCardComponent {
  restaurant = input.required<Restaurant>();
  /** Foto pública registrada pela comunidade neste restaurante, se houver. */
  coverUrl = input<string | null | undefined>(null);
}
