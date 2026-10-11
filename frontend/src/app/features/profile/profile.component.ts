import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ExperienceService } from '../../core/services/experience.service';
import { CollectionService } from '../../core/services/collection.service';
import { SocialService } from '../../core/services/social.service';
import { Collection, Experience, User } from '../../core/models';
import { ToastService } from '../../shared/services/toast.service';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { ExperienceCardComponent } from '../../shared/components/experience-card/experience-card.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/components/error-state/error-state.component';
import { LoadingStateComponent } from '../../shared/components/loading-state/loading-state.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [RouterLink, AvatarComponent, ExperienceCardComponent, EmptyStateComponent, ErrorStateComponent, LoadingStateComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);
  private readonly experienceService = inject(ExperienceService);
  private readonly collectionService = inject(CollectionService);
  private readonly socialService = inject(SocialService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly currentUser = this.auth.user;
  protected readonly viewedUser = signal<User | null>(null);
  protected readonly loading = signal(true);
  protected readonly notFound = signal(false);
  protected readonly experiences = signal<Experience[]>([]);
  protected readonly collections = signal<Collection[]>([]);

  protected readonly isOwnProfile = computed(() => {
    const viewed = this.viewedUser();
    return !!viewed && viewed.id === this.currentUser()?.id;
  });

  protected readonly friendshipStatus = computed(() => this.viewedUser()?.friendshipStatus ?? 'none');

  /** Perfil privado de quem não é amigo: o backend não devolve experiências. */
  protected readonly isPrivateAndBlocked = computed(
    () => !this.isOwnProfile() && this.viewedUser()?.profileVisibility === 'private' && this.friendshipStatus() !== 'friends',
  );

  constructor() {
    // O mesmo componente atende /app/perfil e /app/perfil/:username (inclusive ao navegar entre perfis).
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => this.load(params.get('username')));
  }

  private load(username: string | null): void {
    this.loading.set(true);
    this.notFound.set(false);
    this.experiences.set([]);
    this.collections.set([]);

    const me = this.currentUser();
    if (!username || username === me?.username) {
      this.viewedUser.set(me);
      this.experienceService.list().subscribe({
        next: (list) => {
          this.experiences.set(list);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
      this.collectionService.list().subscribe((list) => this.collections.set(list.filter((c) => c.userId === me?.id)));
      return;
    }

    this.auth.getPublicProfile(username).subscribe({
      next: (user) => {
        this.viewedUser.set(user);
        this.experienceService.listForUser(username).subscribe({
          next: (list) => {
            this.experiences.set(list);
            this.loading.set(false);
          },
          error: () => this.loading.set(false),
        });
      },
      error: () => {
        this.notFound.set(true);
        this.loading.set(false);
      },
    });
  }

  protected sendRequest(): void {
    const user = this.viewedUser();
    if (!user) return;
    this.socialService.sendFriendRequest(user.id).subscribe({
      next: (summary) => {
        this.toast.success(summary.friendshipStatus === 'friends' ? 'Agora vocês são amigos!' : 'Solicitação enviada.');
        this.load(user.username);
      },
      error: (err: Error) => this.toast.error(err.message),
    });
  }

  protected acceptRequest(): void {
    const user = this.viewedUser();
    if (!user) return;
    this.socialService.acceptFriendRequest(user.id).subscribe({
      next: () => {
        this.toast.success('Agora vocês são amigos!');
        this.load(user.username);
      },
      error: (err: Error) => this.toast.error(err.message),
    });
  }
}
