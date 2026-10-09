export type FriendshipStatus = 'none' | 'pending-sent' | 'pending-received' | 'friends' | 'blocked' | 'self';

export interface UserSummary {
  id: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  friendshipStatus: FriendshipStatus;
}

export type FeedActivityType =
  | 'new-experience'
  | 'new-favorite'
  | 'new-collection'
  | 'retrospective-shared';

export interface FeedComment {
  id: string;
  userId: string;
  userDisplayName: string;
  userAvatarUrl: string | null;
  text: string;
  createdAt: string;
}

export interface FeedItem {
  id: string;
  type: FeedActivityType;
  user: UserSummary;
  createdAt: string;
  experienceId?: string;
  dishName?: string;
  restaurantName?: string;
  city?: string;
  rating?: number;
  photoUrl?: string;
  text?: string;
  collectionName?: string;
  likesCount: number;
  likedByMe: boolean;
  comments: FeedComment[];
}
