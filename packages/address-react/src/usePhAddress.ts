import { useEffect, useRef, useSyncExternalStore } from 'react';
import { createAddressStore } from '@ph-dev-utils/address-core';
import type {
  AddressState,
  AddressStore,
  AddressValue,
  Fetcher,
  InitialValue,
  ZipPolicy,
} from '@ph-dev-utils/address-core';

export interface UsePhAddressOptions {
  /** Seed the picker from known PSGC codes (e.g. when editing a saved address). */
  defaultValue?: InitialValue;
  /** `'first'` (default) autofills the first candidate ZIP on city select; `'none'` leaves it blank. */
  zipPolicy?: ZipPolicy;
  /** Called whenever the address value changes (not on mount). */
  onChange?: (value: AddressValue) => void;
  /** v0.2 — barangay fetcher. Unused in v0.1. */
  fetchBarangays?: Fetcher;
}

export interface UsePhAddressResult extends AddressState {
  selectRegion: (code: string | null) => void;
  selectProvince: (code: string | null) => void;
  selectCity: (code: string | null) => void;
  selectBarangay: (code: string | null) => void;
  setZip: (zip: string | null) => void;
  reset: () => void;
}

export function usePhAddress(opts: UsePhAddressOptions = {}): UsePhAddressResult {
  const storeRef = useRef<AddressStore | null>(null);
  if (storeRef.current === null) {
    storeRef.current = createAddressStore({
      initialValue: opts.defaultValue,
      zipPolicy: opts.zipPolicy,
      fetchBarangays: opts.fetchBarangays,
    });
  }
  const store = storeRef.current;

  const state = useSyncExternalStore(store.subscribe, store.getState, store.getState);

  const onChangeRef = useRef(opts.onChange);
  onChangeRef.current = opts.onChange;
  const prevValueRef = useRef(state.value);
  useEffect(() => {
    if (prevValueRef.current !== state.value) {
      prevValueRef.current = state.value;
      onChangeRef.current?.(state.value);
    }
  }, [state.value]);

  return {
    ...state,
    selectRegion: store.selectRegion,
    selectProvince: store.selectProvince,
    selectCity: store.selectCity,
    selectBarangay: store.selectBarangay,
    setZip: store.setZip,
    reset: store.reset,
  };
}
