/**
 * NOTE: This module is a placeholder for a database. 
 * Replace these exports with database queries in the future.
 */

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
}

export const CATEGORIES: Category[] = [
  { id: '1', name: 'Escorts', slug: 'escorts', description: 'Professional escort services for social events and dates.' },
  { id: '2', name: 'Massage', slug: 'massage', description: 'Relaxing and therapeutic massage sessions.' },
  { id: '3', name: 'Companionship', slug: 'companionship', description: 'Friendly company for dinners, movies, or conversation.' },
  { id: '4', name: 'Virtual', slug: 'virtual', description: 'Remote companionship and online interaction services.' }
];