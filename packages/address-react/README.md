# @ph-dev-utils/address-react

[![npm version](https://img.shields.io/npm/v/@ph-dev-utils/address-react?label=npm&color=cb3837&logo=npm)](https://www.npmjs.com/package/@ph-dev-utils/address-react)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](../../LICENSE)

React **cascading Philippine address picker** — region → province → city/municipality → ZIP, with ZIP autofill. Handles NCR (no provinces), independent cities, and multi-ZIP cities correctly.

```bash
npm install @ph-dev-utils/address-react
```

## Component

```tsx
import { PhAddressPicker, type AddressValue } from '@ph-dev-utils/address-react';
import '@ph-dev-utils/address-react/theme.css'; // optional styled preset

<PhAddressPicker
  onChange={(v: AddressValue) => console.log(v)}
  defaultValue={{ cityCode: '072217' }}  // optional: seed an edit form (region/province/zip auto-derived)
/>
```

### Props

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `onChange` | `(v: AddressValue) => void` | — | Fires on every change (not on mount) |
| `defaultValue` | `{ regionCode?, provinceCode?, cityCode?, zip? }` | — | Uncontrolled seed; `cityCode` alone hydrates the whole cascade |
| `zipPolicy` | `'first' \| 'none'` | `'first'` | Autofill first candidate ZIP, or leave blank |
| `showZip` | `boolean` | `true` | Render the ZIP field |
| `showBarangay` | `boolean` | `false` | Render the barangay field (lazy-loads per city from jsDelivr) |
| `searchable` | `boolean` | `false` | Type-to-filter combobox for the long lists (city/municipality + barangay) instead of a native `<select>` — a province can hold 50+ municipalities |
| `fetchBarangays` | `(cityMunCode) => Promise<{code,name}[]>` | jsDelivr | Override the barangay source (self-host / mirror) |
| `labels` / `placeholders` | `{ region?, province?, city?, barangay?, zip? }` | English | For i18n / Tagalog |
| `disabled` `required` `id` `className` | — | — | Standard form props |

### `AddressValue`

```ts
interface AddressValue {
  region:   { code; name } | null;
  province: { code; name } | null;  // null is valid (NCR / independent cities)
  city:     { code; name; isCity } | null;
  barangay: { code; name } | null;  // v0.2
  zip: string | null;               // autofilled, user-overridable
  zipOptions: string[];             // all candidate ZIPs for the city
}
```

## Hook

For custom UI, use the headless hook (same logic, your markup):

```tsx
import { usePhAddress } from '@ph-dev-utils/address-react';

const { value, options, zipAmbiguous, selectRegion, selectProvince, selectCity, setZip, reset }
  = usePhAddress({ onChange, defaultValue });
```

### Searchable (typeahead) fields

```tsx
<PhAddressPicker searchable />
```

`searchable` swaps the **city/municipality** and **barangay** fields for an accessible type-to-filter combobox (WAI-ARIA combobox + listbox: arrow keys, Enter to select, Esc to revert, selection always resolved by PSGC code). Region and province stay native `<select>` since they are always short. The standalone `Combobox` is also exported if you want it elsewhere. Note: a combobox trades the native mobile picker wheel for searchability — leave it off (the default) if your audience is mostly mobile and your lists are short.

## Styling

Ships **unstyled** with `.ph-ap*` class names. Import `@ph-dev-utils/address-react/theme.css` for a default PH-themed look, or target the classes yourself. The theme is recolorable via `--ph-ap-*` CSS custom properties. SSR-safe (`useSyncExternalStore`, no `window`/`fetch` at import). The theme covers the searchable combobox (`.ph-ap__combobox`, `.ph-ap__listbox`, `.ph-ap__option`).

## Notes

- **NCR** hides the province step (`province: null` is valid). **Independent cities** (Isabela, Cotabato) are reachable in their region.
- **Multi-ZIP cities** (Manila ~200, Davao 12): the ZIP is autofilled but editable, with a candidate dropdown when `zipAmbiguous`. ZIP data is community-sourced (GeoNames), not an official PHLPost feed.
- **Barangay** (opt-in via `showBarangay`) lazy-loads a city's barangays from the jsDelivr CDN (`@ph-dev-utils/address-data`) — zero network unless enabled; optional, with a loading/error hint.

## License

MIT (code). Bundled ZIP data © GeoNames, CC BY 4.0.
