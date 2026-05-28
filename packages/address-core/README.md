# @ph-dev-utils/address-core

[![npm version](https://img.shields.io/npm/v/@ph-dev-utils/address-core?label=npm&color=cb3837&logo=npm)](https://www.npmjs.com/package/@ph-dev-utils/address-core)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](../../LICENSE)

**Headless, framework-agnostic** state machine for a cascading Philippine address picker — region → province → city/municipality → ZIP. No UI, no DOM, no network. This is the engine behind [`@ph-dev-utils/address-react`](https://www.npmjs.com/package/@ph-dev-utils/address-react); use it to build your own Vue / web-component / vanilla binding.

```bash
npm install @ph-dev-utils/address-core
```

## Usage

```ts
import { createAddressStore } from '@ph-dev-utils/address-core';

const store = createAddressStore({ zipPolicy: 'first' });
const unsub = store.subscribe(() => render(store.getState()));

store.selectRegion('07');      // Central Visayas
store.selectProvince('0722');  // Cebu
store.selectCity('072217');    // City of Cebu → zip autofills to '6000'
store.getState().value;        // { region, province, city, zip: '6000', zipOptions: ['6000'], ... }
```

`getState()` returns `{ value, options, barangayStatus, zipAmbiguous }`. Each `select*` resets downstream levels. `selectCity` sets `zipOptions` from the bundled ZIP-by-city map and autofills `zip` per `zipPolicy`.

## Store API

```ts
createAddressStore(opts?: {
  initialValue?: { regionCode?; provinceCode?; cityCode?; zip? };  // cityCode alone hydrates everything
  zipPolicy?: 'first' | 'none';
  fetchBarangays?: Fetcher;  // v0.2
});
// → { getState, subscribe, selectRegion, selectProvince, selectCity, selectBarangay, setZip, reset }
```

Region/province/city options come from `@ph-dev-utils/core` (a dependency). The only data this package bundles is a compact `cityMunCode → ZIP[]` map (`zipForCity(code)` is also exported).

## Notes

- **`province: null` is valid** — NCR has no provinces, and independent cities (Isabela `099701`, Cotabato `129804`) belong to no province. The reducer surfaces them correctly.
- **Cities resolve by 6-digit PSGC code**, avoiding name ambiguity (e.g. Quezon City vs Quezon municipality).
- **Multi-ZIP cities** expose all candidates in `zipOptions` + `zipAmbiguous`; ZIP autofill never silently commits a wrong code.
- SSR-safe: pure reducer, no `window`/`fetch` at import time.
- **Barangay** (`barangayStatus`, `Fetcher`) is stubbed for v0.2 (lazy-loaded per city).

## License

MIT (code). Bundled ZIP data © GeoNames, CC BY 4.0.
