import data from '../data/zip-by-city.json' with { type: 'json' };

const zips: Record<string, string[]> = (data as { zips: Record<string, string[]> }).zips;

/** All candidate 4-digit ZIPs for a 6-digit PSGC city/municipality code (may be empty). */
export function zipForCity(cityMunCode: string): string[] {
  return zips[cityMunCode] ?? [];
}
