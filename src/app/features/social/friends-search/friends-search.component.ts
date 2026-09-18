import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserSummary } from '../../../core/models';
import { SocialService } from '../../../core/services/social.service';
import { UserCardComponent } from '../../../shared/components/user-card/user-card.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-friends-search',
  standalone: true,
  imports: [FormsModule, UserCardComponent, EmptyStateComponent, LoadingStateComponent],
  templateUrl: './friends-search.component.html',
  styleUrl: './friends-search.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FriendsSearchComponent {
  private readonly socialService = inject(SocialService);
  private readonly toast = inject(ToastService);

  protected readonly term = signal('');
  protected readonly loading = signal(true);
  protected readonly results = signal<UserSummary[]>([]);
  protected readonly pendingReceived = signal<UserSummary[]>([]);

  constructor() {
    this.search();
  }

  protected search(): void {
    this.loading.set(true);
    this.socialService.searchUsers(this.term()).subscribe((results) => {
      this.results.set(results);
      this.pendingReceived.set(results.filter((r) => r.friendshipStatus === 'pending-received'));
      this.loading.set(false);
    });
  }

  protected sendRequest(userId: string): void {
    this.socialService.sendFriendRequest(userId);
    this.toast.success('Solicitação enviada.');
    this.search();
  }

  protected acceptRequest(userId: string): void {
    this.socialService.acceptFriendRequest(userId);
    this.toast.success('Agora vocês são amigos!');
    this.search();
  }

  protected declineRequest(userId: string): void {
    this.socialService.declineFriendRequest(userId);
    this.search();
  }

  protected removeFriend(userId: string): void {
    this.socialService.removeFriend(userId);
    this.toast.info('Amizade removida.');
    this.search();
  }
}
