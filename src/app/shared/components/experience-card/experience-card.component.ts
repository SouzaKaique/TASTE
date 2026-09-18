import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EXPERIENCE_CATEGORY_LABELS, Experience } from '../../../core/models';
import { StarRatingComponent } from '../star-rating/star-rating.component';
import { TagComponent } from '../tag/tag.component';

@Component({
  selector: 'app-experience-card',
  standalone: true,
  imports: [RouterLink, DatePipe, StarRatingComponent, TagComponent],
  templateUrl: './experience-card.component.html',
  styleUrl: './experience-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperienceCardComponent {
  experience = input.required<Experience>();
  compact = input(false);
  toggleFavorite = output<string>();

  protected readonly categoryLabels = EXPERIENCE_CATEGORY_LABELS;

  protected onFavoriteClick(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.toggleFavorite.emit(this.experience().id);
  }
}
