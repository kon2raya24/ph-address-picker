import {
  deriveState,
  fromInitial,
  withRegion,
  withProvince,
  withCity,
  withZip,
  withBarangay,
  EMPTY_VALUE,
} from './reducer.js';
import type {
  AddressState,
  AddressStore,
  AddressStoreOptions,
  AddressValue,
  BarangayStatus,
  Fetcher,
  Option,
  ZipPolicy,
} from './types.js';

/**
 * Create a headless, framework-agnostic address-picker store.
 * Region/province/city options come from @ph-dev-utils/core; ZIP autofill from the
 * bundled zip-by-city map. If `fetchBarangays` is provided, selecting a city lazily
 * loads that city's barangays (race-guarded + cached); otherwise the barangay level
 * stays idle/empty. No DOM; network only via the injected fetcher.
 */
export function createAddressStore(opts: AddressStoreOptions = {}): AddressStore {
  const zipPolicy: ZipPolicy = opts.zipPolicy ?? 'first';
  const fetchBarangays: Fetcher | undefined = opts.fetchBarangays;
  const cache = new Map<string, Option[]>();

  let value: AddressValue = fromInitial(opts.initialValue, zipPolicy);
  let barangays: Option[] = [];
  let barangayStatus: BarangayStatus = 'idle';
  let token = 0; // guards against out-of-order async barangay responses

  const listeners = new Set<() => void>();

  function build(): AddressState {
    const base = deriveState(value);
    return {
      ...base,
      options: { ...base.options, barangays },
      barangayStatus,
    };
  }

  let cachedState: AddressState = build();

  function commit(): void {
    cachedState = build();
    for (const l of listeners) l();
  }

  /** Reset + (if a fetcher exists) lazily load the selected city's barangays. */
  function loadBarangays(cityMunCode: string | null): void {
    barangays = [];
    barangayStatus = 'idle';
    const myToken = ++token; // cancels any in-flight request

    if (!fetchBarangays || !cityMunCode) return;

    const cached = cache.get(cityMunCode);
    if (cached) {
      barangays = cached;
      barangayStatus = 'ready';
      return;
    }

    barangayStatus = 'loading';
    void fetchBarangays(cityMunCode).then(
      (list) => {
        if (myToken !== token) return; // a newer selection superseded this one
        cache.set(cityMunCode, list);
        barangays = list;
        barangayStatus = 'ready';
        commit();
      },
      () => {
        if (myToken !== token) return;
        barangayStatus = 'error';
        commit();
      },
    );
  }

  return {
    getState: () => cachedState,
    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    selectRegion(code) {
      value = withRegion(code);
      loadBarangays(null);
      commit();
    },
    selectProvince(code) {
      value = withProvince(value, code);
      loadBarangays(null);
      commit();
    },
    selectCity(code) {
      value = withCity(value, code, zipPolicy);
      loadBarangays(code);
      commit();
    },
    selectBarangay(code) {
      value = withBarangay(value, code, barangays);
      commit();
    },
    setZip(zip) {
      value = withZip(value, zip);
      commit();
    },
    reset() {
      value = EMPTY_VALUE;
      loadBarangays(null);
      commit();
    },
  };
}
