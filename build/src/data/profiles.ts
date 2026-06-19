/**
 * NOTE: This module is a placeholder for a database. 
 * Replace these exports with database queries in the future.
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
  hourlyRate: number;
  availability: string;
  imageColor: string;
  description: string;
  attributes: ProfileAttribute[];
}

const LOREM = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec odio. Praesent libero. Sed cursus ante dapibus diam.";

export const PROFILES: Profile[] = Array.from({ length: 20 }).map((_, index) => {
  const id = (index + 1).toString();
  const categories = ['escorts', 'massage', 'companionship', 'virtual'];
  const colors = ['#e0f2f1', '#fce4ec', '#fff3e0', '#f3e5f5', '#e8f5e9'];
  const cities = ['London', 'Manchester', 'Birmingham', 'Leeds'];
  
  const categorySlug = categories[index % categories.length];
  
  return {
    id,
    name: `Profile ${id}`,
    categorySlug,
    location: cities[index % cities.length],
    hourlyRate: 50 + (index * 10),
    availability: index % 2 === 0 ? 'Available Now' : 'By Appointment',
    imageColor: colors[index % colors.length],
    description: LOREM,
    attributes: [
      { label: 'Experience', value: `${(index % 5) + 1} years` },
      { label: 'Language', value: 'English' },
      { label: 'Verification', value: 'ID Verified' }
    ]
  };
});