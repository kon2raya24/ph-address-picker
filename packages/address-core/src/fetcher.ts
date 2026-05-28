import type { Fetcher, Option } from './types.js';

/**
 * Pinned @ph-dev-utils/address-data major.minor served by the default jsDelivr
 * fetcher. `@0.1` resolves to the latest 0.1.x on the CDN (immutable per patch,
 * cache-friendly). Override via `createJsDelivrFetcher({ dataVersion })`.
 */
export const DATA_VERSION = '0.1';

/**
 * Build a barangay {@link Fetcher} that pulls a single city's barangays from the
 * jsDelivr CDN (npm-backed `@ph-dev-utils/address-data`). Network I/O happens only
 * when the returned function is called — safe to construct during SSR.
 *
 * @param baseUrl    override the CDN base (self-host / proxy / mirror)
 * @param dataVersion override the pinned address-data version
 */
export function createJsDelivrFetcher(
  opts: { baseUrl?: string; dataVersion?: string } = {},
): Fetcher {
  const version = opts.dataVersion ?? DATA_VERSION;
  const base =
    opts.baseUrl ?? `https://cdn.jsdelivr.net/npm/@ph-dev-utils/address-data@${version}/barangays`;
  return async (cityMunCode: string): Promise<Option[]> => {
    const res = await fetch(`${base}/${encodeURIComponent(cityMunCode)}.json`);
    if (!res.ok) {
      throw new Error(`address-data fetch failed (${res.status}) for ${cityMunCode}`);
    }
    return (await res.json()) as Option[];
  };
}
