import { FriendshipStatus } from './social.model';

export type ProfileVisibility = 'public' | 'private';

export interface UserStats {
  totalExperiences: number;
  totalRestaurants: number;
  totalCities: number;
  totalFavorites: number;
  averageRating: number;
}

export interface User {
  id: string;
  displayName: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  bio: string;
  createdAt: string;
  profileVisibility: ProfileVisibility;
  stats: UserStats;
  /** Situação da amizade com quem está vendo (só em perfis de outras pessoas). */
  friendshipStatus?: FriendshipStatus | null;
}

export interface AuthCredentials {
  email: string;
  password: string;
  /** Código do link de convite, quando a pessoa chegou por um. */
  inviteCode?: string;
}

export interface RegisterPayload {
  displayName: string;
  username: string;
  email: string;
  password: string;
}
