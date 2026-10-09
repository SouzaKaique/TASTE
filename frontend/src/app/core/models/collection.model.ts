export type CollectionPrivacy = 'public' | 'private';

export interface Collection {
  id: string;
  userId: string;
  name: string;
  description?: string;
  coverImageUrl?: string;
  privacy: CollectionPrivacy;
  experienceIds: string[];
  createdAt: string;
}
