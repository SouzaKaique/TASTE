import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Restaurant } from '../../../core/models';
import { RestaurantCoverComponent } from '../restaurant-cover/restaurant-cover.component';

@Component({
  selector: 'app-restaurant-card',
  standalone: true,
  imports: [RouterLink, RestaurantCoverComponent],
  templateUrl: './restaurant-card.component.html',
  styleUrl: './restaurant-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RestaurantCardComponent {
  restaurant = input.required<Restaurant>();
  /** Foto pública registrada pela comunidade neste restaurante, se houver. */
  coverUrl = input<string | null | undefined>(null);
}
