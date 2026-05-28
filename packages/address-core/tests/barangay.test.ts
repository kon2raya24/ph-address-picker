import { describe, it, expect, vi } from 'vitest';
import { createAddressStore } from '../src/store';
import type { Option } from '../src/types';

const flush = () => new Promise((r) => setTimeout(r, 0));
const BRGYS: Option[] = [
  { code: '072217001', name: 'Adlaon' },
  { code: '072217002', name: 'Agsungot' },
];

describe('barangay async loading', () => {
  it('with no fetcher, barangay stays idle and empty', () => {
    const s = createAddressStore();
    s.selectCity('072217');
    expect(s.getState().barangayStatus).toBe('idle');
    expect(s.getState().options.barangays).toEqual([]);
  });

  it('goes loading → ready and populates barangays', async () => {
    const fetchBarangays = vi.fn(async () => BRGYS);
    const s = createAddressStore({ fetchBarangays });
    s.selectCity('072217');
    expect(s.getState().barangayStatus).toBe('loading');
    expect(s.getState().options.barangays).toEqual([]);
    await flush();
    expect(s.getState().barangayStatus).toBe('ready');
    expect(s.getState().options.barangays).toEqual(BRGYS);
    s.selectBarangay('072217001');
    expect(s.getState().value.barangay?.name).toBe('Adlaon');
  });

  it('goes to error status when the fetch rejects', async () => {
    const fetchBarangays = vi.fn(async () => {
      throw new Error('boom');
    });
    const s = createAddressStore({ fetchBarangays });
    s.selectCity('072217');
    await flush();
    expect(s.getState().barangayStatus).toBe('error');
    expect(s.getState().options.barangays).toEqual([]);
  });

  it('caches per city (no refetch on revisit)', async () => {
    const fetchBarangays = vi.fn(async () => BRGYS);
    const s = createAddressStore({ fetchBarangays });
    s.selectCity('072217');
    await flush();
    s.selectCity('133900'); // Manila
    await flush();
    s.selectCity('072217'); // back — served from cache, ready immediately
    expect(s.getState().barangayStatus).toBe('ready');
    expect(fetchBarangays).toHaveBeenCalledTimes(2);
  });

  it('ignores a stale response when a newer city is selected', async () => {
    const resolvers: Record<string, (v: Option[]) => void> = {};
    const fetchBarangays = vi.fn(
      (code: string) => new Promise<Option[]>((res) => (resolvers[code] = res)),
    );
    const s = createAddressStore({ fetchBarangays });
    s.selectCity('072217'); // A — loading
    s.selectCity('133900'); // B — supersedes A
    resolvers['072217']([{ code: 'stale', name: 'Stale' }]); // A resolves late
    await flush();
    expect(s.getState().barangayStatus).toBe('loading'); // A ignored, still awaiting B
    resolvers['133900']([{ code: 'fresh', name: 'Fresh' }]);
    await flush();
    expect(s.getState().options.barangays).toEqual([{ code: 'fresh', name: 'Fresh' }]);
  });

  it('selecting a region clears any loaded barangays', async () => {
    const fetchBarangays = vi.fn(async () => BRGYS);
    const s = createAddressStore({ fetchBarangays });
    s.selectCity('072217');
    await flush();
    expect(s.getState().options.barangays).toEqual(BRGYS);
    s.selectRegion('01');
    expect(s.getState().barangayStatus).toBe('idle');
    expect(s.getState().options.barangays).toEqual([]);
  });
});
