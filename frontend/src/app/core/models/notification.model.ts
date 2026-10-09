export type NotificationType = 'friend-request' | 'friend-accepted' | 'like' | 'comment';

export interface AppNotification {
  id: string;
  type: NotificationType;
  actor: { id: string; displayName: string; username: string; avatarUrl: string | null };
  experienceId: string | null;
  dishName: string | null;
  snippet: string | null;
  read: boolean;
  createdAt: string;
}
