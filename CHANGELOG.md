# Changelog

## [Unreleased]

## [0.2.0] - 2026-05-28

### Added

- **Barangay level** — the 4th cascade step, lazy-loaded per city.
  - New data-only package **`@ph-dev-utils/address-data`** (v0.1.0): per-city barangay chunks `barangays/<cityMunCode>.json` (1,634 files, 42,046 barangays, PSA Q4 2024 PSGC). Served via the jsDelivr CDN — **not** a code dependency, never enters the consumer bundle.
  - **`@ph-dev-utils/address-core`** (0.2.0): `createJsDelivrFetcher({ baseUrl?, dataVersion? })` + async barangay loading in the store (`barangayStatus: idle→loading→ready/error`, race-guarded + in-memory cached). `selectBarangay()` is now functional; new `withBarangay` reducer + `DATA_VERSION` export.
  - **`@ph-dev-utils/address-react`** (0.2.0): `<PhAddressPicker showBarangay />` renders a barangay `<select>` with loading/error states (defaults to the jsDelivr fetcher; override via `fetchBarangays`). `usePhAddress` now returns `selectBarangay`.

### Notes

- Barangay is **opt-in** (`showBarangay`, default false) — v0.1 consumers are unaffected (zero network unless enabled).
- Barangay is optional (form not blocked); on fetch error the field shows a hint and stays empty.
- Tests: 17 vitest (core) + 6 (react). address-core's tsconfig adds `lib: ["DOM"]` for `fetch` types (types only).

## [0.1.0] - 2026-05-28

Initial release. Cascading Philippine address picker for React, built on the `@ph-dev-utils` data packages.

### Added

- **`@ph-dev-utils/address-core`** — headless, framework-agnostic store: region → province → city/municipality → ZIP cascade with ZIP autofill. Region/province/city from `@ph-dev-utils/core`; ZIP from a bundled `cityMunCode → ZIP[]` map derived from `@ph-dev-utils/postal`. `createAddressStore()` + `zipForCity()`. No DOM/network.
- **`@ph-dev-utils/address-react`** — React binding: `<PhAddressPicker>` + `usePhAddress()` (`useSyncExternalStore`, SSR-safe). Native `<select>` fields for accessibility; ZIP input with a candidate dropdown for multi-ZIP cities. Optional `theme.css` (PH colors via CSS custom properties).
- Reproducible data pipeline (`scripts/build-data.mjs`) generating the ZIP-by-city map (1,574 cities). Vite + React playground in `examples/playground`.

### Correctness

- NCR has no provinces → province step hidden; `province: null` is a valid complete state.
- Independent cities (City of Isabela `099701` r09, City of Cotabato `129804` r12) are reachable in their region despite having no province.
- Multi-ZIP cities (Manila ~200 ZIPs, Davao 12, six 3-ZIP municipalities) expose `zipOptions` + `zipAmbiguous`; ZIP autofills but stays editable — never silently commits a wrong code.
- Cities resolve strictly by 6-digit PSGC code (no Quezon-City name ambiguity).

### Notes

- ZIP data is community-sourced (GeoNames, CC BY 4.0) + PHLPost-reconciled — not an official PHLPost feed.
- Tests: 11 vitest (core) + 5 vitest (react). Playground bundle ~75 KB gzipped.

### Deferred to v0.2+

- Barangay level (lazy-loaded per city from a CDN; core's `Fetcher`/`barangayStatus` are stubbed for it).
- Vue binding, `<ph-address-picker>` web component, typeahead combobox for the city list.
