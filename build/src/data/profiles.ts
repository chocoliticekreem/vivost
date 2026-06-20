/**
 * Profile model + data source.
 *
 * Data now comes from the scraper: ./profiles.generated.ts is produced by
 * scraper/transform.mjs from real Vivastreet listings. To refresh, re-run the
 * scraper + `node transform.mjs`. (Future: replace with live DB queries.)
 */

export interface ProfileAttribute {
  label: string;
  value: string;
}

export interface Profile {
  id: string;
  name: string;
  categorySlug: string;
  location: string;
  area?: string | null;
  hourlyRate: number;
  availability: string;
  imageColor: string;
  photos: string[];
  description: string;
  phone?: string | null;
  age?: number | null;
  gender?: string | null;
  ethnicity?: string | null;
  languages?: string[];
  services?: string[];
  verified?: boolean;
  hasPhone?: boolean;
  region?: string | null;
  flags?: string[];
  adType?: string | null;
  serviceFor?: string | null;
  sourceUrl?: string;
  attributes: ProfileAttribute[];
}

import { PROFILES as GENERATED_PROFILES } from './profiles.generated';

export const PROFILES: Profile[] = GENERATED_PROFILES;
