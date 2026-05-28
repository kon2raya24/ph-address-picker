# Changelog

## [Unreleased]

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
