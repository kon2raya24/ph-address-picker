import {
  deriveState,
  fromInitial,
  withRegion,
  withProvince,
  withCity,
  withZip,
  EMPTY_VALUE,
} from './reducer.js';
import type { AddressState, AddressStore, AddressStoreOptions } from './types.js';

/**
 * Create a headless, framework-agnostic address-picker store.
 * Region/province/city options come from @ph-dev-utils/core; ZIP autofill from the
 * bundled zip-by-city map. No DOM, no network (barangay fetch is a v0.2 stub).
 */
export function createAddressStore(opts: AddressStoreOptions = {}): AddressStore {
  const zipPolicy = opts.zipPolicy ?? 'first';
  let state: AddressState = deriveState(fromInitial(opts.initialValue, zipPolicy));
  const listeners = new Set<() => void>();

  function commit(next: AddressState): void {
    state = next;
    for (const l of listeners) l();
  }

  return {
    getState: () => state,
    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    selectRegion(code) {
      commit(deriveState(withRegion(code)));
    },
    selectProvince(code) {
      commit(deriveState(withProvince(state.value, code)));
    },
    selectCity(code) {
      commit(deriveState(withCity(state.value, code, zipPolicy)));
    },
    selectBarangay() {
      // v0.2 — barangay lazy-loading not implemented in v0.1.
    },
    setZip(zip) {
      commit(deriveState(withZip(state.value, zip)));
    },
    reset() {
      commit(deriveState(EMPTY_VALUE));
    },
  };
}
