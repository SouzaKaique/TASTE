import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
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
  protected readonly friends = signal<UserSummary[]>([]);

  private searchTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.searchTimer));
    this.refreshLists();
    this.search();
  }

  /** Espera a pessoa parar de digitar antes de consultar o servidor. */
  protected onTermChange(value: string): void {
    this.term.set(value);
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.search(), 300);
  }

  protected search(): void {
    this.loading.set(true);
    this.socialService.searchUsers(this.term()).subscribe({
      next: (results) => {
        this.results.set(results);
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.loading.set(false);
        this.toast.error(err.message);
      },
    });
  }

  protected sendRequest(userId: string): void {
    this.run(this.socialService.sendFriendRequest(userId), (user) =>
      this.toast.success(user.friendshipStatus === 'friends' ? 'Agora vocês são amigos!' : 'Solicitação enviada.'),
    );
  }

  protected acceptRequest(userId: string): void {
    this.run(this.socialService.acceptFriendRequest(userId), () => this.toast.success('Agora vocês são amigos!'));
  }

  protected declineRequest(userId: string): void {
    this.run(this.socialService.removeFriendship(userId), () => this.toast.info('Solicitação recusada.'));
  }

  protected removeFriend(userId: string): void {
    this.run(this.socialService.removeFriendship(userId), () => this.toast.info('Amizade removida.'));
  }

  private run<T>(request: Observable<T>, onSuccess: (value: T) => void): void {
    request.subscribe({
      next: (value) => {
        onSuccess(value);
        this.refreshLists();
        this.search();
      },
      error: (err: Error) => this.toast.error(err.message),
    });
  }

  private refreshLists(): void {
    this.socialService.pendingRequests().subscribe({ next: (list) => this.pendingReceived.set(list), error: () => undefined });
    this.socialService.friendsList().subscribe({ next: (list) => this.friends.set(list), error: () => undefined });
  }
}
