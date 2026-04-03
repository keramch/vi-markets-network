import { collection, query, where, getDocs } from 'firebase/firestore';
import { firestore } from '../services/firebase';

/**
 * Convert a display name into a URL-friendly slug.
 * "Salt Spring Saturday Market" → "salt-spring-saturday-market"
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')   // drop non-alphanumeric (except spaces/hyphens)
    .trim()
    .replace(/[\s]+/g, '-')          // spaces → single hyphen
    .replace(/-{2,}/g, '-')          // collapse multiple hyphens
    .replace(/^-+|-+$/g, '');        // strip leading/trailing hyphens
}

/**
 * Generate a slug that is unique within the given Firestore collection.
 * If "salt-spring-market" already exists, tries "salt-spring-market-2", "-3", etc.
 */
export async function generateUniqueSlug(
  name: string,
  col: 'markets' | 'vendors',
): Promise<string> {
  const base = slugify(name);
  let candidate = base;
  let suffix = 2;

  while (true) {
    const snap = await getDocs(
      query(collection(firestore, col), where('slug', '==', candidate)),
    );
    if (snap.empty) return candidate;
    candidate = `${base}-${suffix}`;
    suffix++;
  }
}
