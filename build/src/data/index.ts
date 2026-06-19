import { CATEGORIES, Category } from './categories';
import { PROFILES, Profile } from './profiles';

/**
 * Data Access Layer - Helper functions for PlaceholderData
 */

export const getAllProfiles = (): Profile[] => {
  return PROFILES;
};

export const getProfileById = (id: string): Profile | undefined => {
  if (!id) {
    console.warn('[Data Error]: getProfileById called without an id');
    return undefined;
  }
  return PROFILES.find(p => p.id === id);
};

export const getProfilesByCategory = (slug: string): Profile[] => {
  return PROFILES.filter(p => p.categorySlug === slug);
};

export interface FilterOptions {
  categorySlug?: string;
  location?: string;
  maxRate?: number;
  keyword?: string;
}

export const filterProfiles = (options: FilterOptions): Profile[] => {
  try {
    return PROFILES.filter(profile => {
      if (options.categorySlug && profile.categorySlug !== options.categorySlug) return false;
      if (options.location && !profile.location.toLowerCase().includes(options.location.toLowerCase())) return false;
      if (options.maxRate && profile.hourlyRate > options.maxRate) return false;
      if (options.keyword) {
        const kw = options.keyword.toLowerCase();
        const inName = profile.name.toLowerCase().includes(kw);
        const inDesc = profile.description.toLowerCase().includes(kw);
        if (!inName && !inDesc) return false;
      }
      return true;
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Data Error]: filterProfiles failed. Details: ${msg}`);
    return [];
  }
};

export const sortProfiles = (profiles: Profile[], order: 'asc' | 'desc'): Profile[] => {
  return [...profiles].sort((a, b) => {
    return order === 'asc' 
      ? a.hourlyRate - b.hourlyRate 
      : b.hourlyRate - a.hourlyRate;
  });
};