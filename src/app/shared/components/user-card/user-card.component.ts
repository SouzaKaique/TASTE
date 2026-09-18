import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UserSummary } from '../../../core/models';
import { AvatarComponent } from '../avatar/avatar.component';

@Component({
  selector: 'app-user-card',
  standalone: true,
  imports: [RouterLink, AvatarComponent],
  templateUrl: './user-card.component.html',
  styleUrl: './user-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserCardComponent {
  user = input.required<UserSummary>();
  sendRequest = output<string>();
  acceptRequest = output<string>();
  declineRequest = output<string>();
  removeFriend = output<string>();
}
