import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Experience } from '../../../core/models';

/** Uma experiência como linha do quadro: data, prato, lugar e a etiqueta de nota à direita. */
@Component({
  selector: 'app-experience-line',
  standalone: true,
  imports: [RouterLink, DatePipe, DecimalPipe],
  templateUrl: './experience-line.component.html',
  styleUrl: './experience-line.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperienceLineComponent {
  experience = input.required<Experience>();
}
