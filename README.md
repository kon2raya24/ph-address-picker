# ph-address-picker

[![npm version](https://img.shields.io/npm/v/@ph-dev-utils/address-react?label=npm&color=cb3837&logo=npm)](https://www.npmjs.com/package/@ph-dev-utils/address-react)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Made in PH](https://img.shields.io/badge/made%20in-🇵🇭%20Philippines-0038A8)](https://github.com/kon2raya24)

A **cascading Philippine address picker** for React — region → province → city/municipality → ZIP, with ZIP autofill. Built on the [`@ph-dev-utils`](https://github.com/kon2raya24/ph-dev-utils) data packages. Handles the things every PH address form gets wrong: **NCR has no provinces**, **independent cities** (Isabela, Cotabato) aren't under any province, and **big cities have many ZIP codes** (Manila, Davao).

```bash
npm install @ph-dev-utils/address-react
```

```tsx
import { PhAddressPicker, type AddressValue } from '@ph-dev-utils/address-react';
import '@ph-dev-utils/address-react/theme.css'; // optional

function Checkout() {
  return <PhAddressPicker onChange={(v: AddressValue) => console.log(v)} />;
}
```

## Packages

| Package | What |
|---------|------|
| [`@ph-dev-utils/address-react`](packages/address-react) | React `<PhAddressPicker>` + `usePhAddress()` hook |
| [`@ph-dev-utils/address-core`](packages/address-core) | Headless, framework-agnostic store (no UI) — reuse to build Vue/web-component bindings |

## How it works

- **Region / province / city** come from `@ph-dev-utils/core` (bundled, ~167 KB, gzips well) — **zero network**.
- **ZIP autofill** uses a compact `cityMunCode → ZIP[]` map derived from `@ph-dev-utils/postal` at build time.
- **Barangay** — opt-in 4th level (`<PhAddressPicker showBarangay />`), lazy-loaded per city from the jsDelivr CDN (`@ph-dev-utils/address-data`), since the full barangay dataset is ~4 MB. Zero network unless enabled.
- **Headless core + thin React binding** (`useSyncExternalStore`, SSR-safe).

## Correctness notes

- **NCR / independent cities:** `province` can be `null` and that's a complete, valid value. The province step is hidden for NCR; independent cities (Isabela `099701`, Cotabato `129804`) are reachable in their region.
- **Multi-ZIP cities:** a city can have many ZIPs (Manila ~200, Davao 12). The picker autofills the first and exposes `zipOptions` + `zipAmbiguous`, with an editable ZIP field and a candidate dropdown — it never silently commits a wrong ZIP.
- Cities are resolved by 6-digit PSGC code, so the "Quezon City vs Quezon municipality" name ambiguity can't occur.

## Data & attribution

Region/province/city: PSA Q4 2024 PSGC (via `@ph-dev-utils/core`). ZIP: derived from `@ph-dev-utils/postal`, whose data comes from **GeoNames (CC BY 4.0)** — community-sourced, not an official PHLPost feed. See [`NOTICE`](NOTICE).

## Development

```bash
npm install
npm run build:data   # regenerate packages/address-core/data/zip-by-city.json
npm run build        # build address-core then address-react
npm test             # vitest (core + react)
npm run dev --workspace=ph-address-playground   # local demo
```

## License

MIT (code). Bundled ZIP data © GeoNames, CC BY 4.0 — see [`NOTICE`](NOTICE).
