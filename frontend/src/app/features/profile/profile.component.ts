import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ExperienceService } from '../../core/services/experience.service';
import { CollectionService } from '../../core/services/collection.service';
import { SocialService } from '../../core/services/social.service';
import { MOCK_USERS } from '../../core/mock-data/users.mock';
import { Collection, Experience, User } from '../../core/models';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { ExperienceCardComponent } from '../../shared/components/experience-card/experience-card.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/components/error-state/error-state.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [RouterLink, AvatarComponent, ExperienceCardComponent, EmptyStateComponent, ErrorStateComponent],
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

  protected readonly currentUser = this.auth.user;
  protected readonly viewedUser = signal<User | null>(null);
  protected readonly notFound = signal(false);
  protected readonly experiences = signal<Experience[]>([]);
  protected readonly collections = signal<Collection[]>([]);

  protected readonly isOwnProfile = computed(() => {
    const username = this.route.snapshot.paramMap.get('username');
    return !username || username === this.currentUser()?.username;
  });

  protected readonly isPrivateAndBlocked = computed(
    () => !this.isOwnProfile() && this.viewedUser()?.profileVisibility === 'private',
  );

  constructor() {
    const username = this.route.snapshot.paramMap.get('username');

    if (!username || username === this.currentUser()?.username) {
      this.viewedUser.set(this.currentUser());
      this.loadContentFor('u1');
      return;
    }

    const found = MOCK_USERS.find((u) => u.username === username);
    if (!found) {
      this.notFound.set(true);
      return;
    }
    this.viewedUser.set(found);
    if (found.profileVisibility === 'public') {
      this.loadContentFor(found.id);
    }
  }

  private loadContentFor(userId: string): void {
    this.experienceService.list().subscribe((list) => {
      this.experiences.set(list.filter((e) => e.userId === userId && e.visibility !== 'private'));
    });
    this.collectionService.list().subscribe((list) => {
      this.collections.set(list.filter((c) => c.userId === userId && c.privacy === 'public'));
    });
  }

  protected friendshipStatus(userId: string) {
    return this.socialService.friendshipStatus(userId);
  }

  protected sendRequest(userId: string): void {
    this.socialService.sendFriendRequest(userId);
  }
}
