import { Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { FeedItem, FriendshipStatus, UserSummary } from '../models';
import { MOCK_FEED } from '../mock-data/feed.mock';
import { MOCK_USERS } from '../mock-data/users.mock';
import { mockResponse } from './mock-http.util';

@Injectable({ providedIn: 'root' })
export class SocialService {
  private readonly feed = signal<FeedItem[]>([...MOCK_FEED]);
  private readonly friendships = signal<Record<string, FriendshipStatus>>({
    u2: 'friends',
    u3: 'friends',
    u4: 'pending-received',
    u5: 'friends',
  });

  getFeed(): Observable<FeedItem[]> {
    return mockResponse(
      [...this.feed()].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
      400,
    );
  }

  toggleLike(feedItemId: string): void {
    this.feed.update((items) =>
      items.map((item) =>
        item.id === feedItemId
          ? { ...item, likedByMe: !item.likedByMe, likesCount: item.likesCount + (item.likedByMe ? -1 : 1) }
          : item,
      ),
    );
  }

  addComment(feedItemId: string, text: string): void {
    this.feed.update((items) =>
      items.map((item) =>
        item.id === feedItemId
          ? {
              ...item,
              comments: [
                ...item.comments,
                {
                  id: `cm-${Date.now()}`,
                  userId: 'u1',
                  userDisplayName: 'Clara Marques',
                  userAvatarUrl: 'https://picsum.photos/seed/clara-marques/200/200',
                  text,
                  createdAt: new Date().toISOString(),
                },
              ],
            }
          : item,
      ),
    );
  }

  removeComment(feedItemId: string, commentId: string): void {
    this.feed.update((items) =>
      items.map((item) =>
        item.id === feedItemId
          ? { ...item, comments: item.comments.filter((c) => c.id !== commentId) }
          : item,
      ),
    );
  }

  searchUsers(term: string): Observable<UserSummary[]> {
    const normalized = term.trim().toLowerCase();
    const results: UserSummary[] = MOCK_USERS.filter((u) => u.id !== 'u1')
      .filter(
        (u) =>
          !normalized ||
          u.username.toLowerCase().includes(normalized) ||
          u.displayName.toLowerCase().includes(normalized),
      )
      .map((u) => ({
        id: u.id,
        displayName: u.displayName,
        username: u.username,
        avatarUrl: u.avatarUrl,
        friendshipStatus: this.friendships()[u.id] ?? 'none',
      }));
    return mockResponse(results, 350);
  }

  friendshipStatus(userId: string): FriendshipStatus {
    return this.friendships()[userId] ?? 'none';
  }

  friendsList(): Observable<UserSummary[]> {
    const friends = MOCK_USERS.filter((u) => this.friendships()[u.id] === 'friends').map((u) => ({
      id: u.id,
      displayName: u.displayName,
      username: u.username,
      avatarUrl: u.avatarUrl,
      friendshipStatus: 'friends' as FriendshipStatus,
    }));
    return mockResponse(friends);
  }

  sendFriendRequest(userId: string): void {
    this.friendships.update((map) => ({ ...map, [userId]: 'pending-sent' }));
  }

  acceptFriendRequest(userId: string): void {
    this.friendships.update((map) => ({ ...map, [userId]: 'friends' }));
  }

  declineFriendRequest(userId: string): void {
    this.friendships.update((map) => ({ ...map, [userId]: 'none' }));
  }

  removeFriend(userId: string): void {
    this.friendships.update((map) => ({ ...map, [userId]: 'none' }));
  }

  blockUser(userId: string): void {
    this.friendships.update((map) => ({ ...map, [userId]: 'blocked' }));
  }
}
