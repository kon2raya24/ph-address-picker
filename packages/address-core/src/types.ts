export interface Option {
  /** PSGC code (2-digit region / 4-digit province / 6-digit city-mun / 9-digit barangay). */
  code: string;
  name: string;
}

export interface CityOption extends Option {
  /** True if PSA classifies it as a city; false for a municipality. */
  isCity: boolean;
}

export interface AddressValue {
  region: Option | null;
  /** `null` is a VALID complete state for NCR and independent/HUC cities. */
  province: Option | null;
  city: CityOption | null;
  /** v0.2 — always `null` in v0.1. */
  barangay: Option | null;
  /** Autofilled from the city's ZIP(s); user-overridable. */
  zip: string | null;
  /** All candidate ZIPs for the selected city (a city can have many). */
  zipOptions: string[];
}

export interface AddressOptions {
  regions: Option[];
  /** Empty for regions without provinces (NCR) — UI should hide/skip the province step. */
  provinces: Option[];
  cities: CityOption[];
  /** v0.2 — always `[]` in v0.1. */
  barangays: Option[];
}

export type BarangayStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface AddressState {
  value: AddressValue;
  options: AddressOptions;
  /** v0.2 barangay fetch status — `'idle'` in v0.1. */
  barangayStatus: BarangayStatus;
  /** True when the selected city has more than one candidate ZIP (e.g. Manila). */
  zipAmbiguous: boolean;
}

/** v0.2 — fetches a city's barangays (e.g. from a CDN). Unused in v0.1. */
export type Fetcher = (cityMunCode: string) => Promise<Option[]>;

export type ZipPolicy = 'first' | 'none';

export interface InitialValue {
  regionCode?: string;
  provinceCode?: string;
  cityCode?: string;
  zip?: string;
}

export interface AddressStoreOptions {
  initialValue?: InitialValue;
  /** `'first'` (default) autofills the first candidate ZIP on city select; `'none'` leaves it null. */
  zipPolicy?: ZipPolicy;
  /** v0.2 — barangay fetcher. Unused in v0.1. */
  fetchBarangays?: Fetcher;
}

export interface AddressStore {
  getState(): AddressState;
  subscribe(listener: () => void): () => void;
  selectRegion(code: string | null): void;
  selectProvince(code: string | null): void;
  selectCity(code: string | null): void;
  /** v0.2 — no-op in v0.1. */
  selectBarangay(code: string | null): void;
  setZip(zip: string | null): void;
  reset(): void;
}
