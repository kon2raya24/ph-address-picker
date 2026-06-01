# @ph-dev-utils/address-element

[![npm version](https://img.shields.io/npm/v/@ph-dev-utils/address-element?label=npm&color=cb3837&logo=npm)](https://www.npmjs.com/package/@ph-dev-utils/address-element)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](../../LICENSE)

A framework-agnostic **`<ph-address-picker>` Web Component** — cascading Philippine address picker (region → province → city/municipality → barangay → ZIP). Works in **Vue, Angular, Svelte, or plain HTML**. Built on the headless [`@ph-dev-utils/address-core`](https://www.npmjs.com/package/@ph-dev-utils/address-core); for React, use [`@ph-dev-utils/address-react`](https://www.npmjs.com/package/@ph-dev-utils/address-react).

```bash
npm install @ph-dev-utils/address-element
```

```html
<script type="module">
  import '@ph-dev-utils/address-element';
  import '@ph-dev-utils/address-element/theme.css'; // optional

  const picker = document.querySelector('ph-address-picker');
  picker.addEventListener('ph-change', (e) => console.log(e.detail)); // AddressValue
</script>

<ph-address-picker show-barangay></ph-address-picker>
```

Importing the package auto-registers the `<ph-address-picker>` element.

## Attributes

| Attribute | Default | Notes |
|-----------|---------|-------|
| `show-zip` | `true` | Set `"false"` to hide the ZIP field |
| `show-barangay` | `false` | Lazy-loads barangays per city from the jsDelivr CDN |
| `searchable` | `false` | Type-to-filter combobox for the long lists (city/municipality + barangay) instead of a native `<select>`; region/province stay native. Arrow keys / Enter / Esc; order-independent matching (typing "Cebu City" finds "City of Cebu") |
| `zip-policy` | `first` | `first` autofills a ZIP; `none` leaves it blank |
| `region` / `province` / `city` / `zip` | — | Initial PSGC codes / ZIP (`city` alone hydrates the cascade) |
| `id-prefix` | `ph-ap` | Prefix for field ids (label association) |
| `disabled` `required` | — | Standard form semantics |

## Event

`ph-change` — a `CustomEvent` whose `detail` is the `AddressValue` (`{ region, province, city, barangay, zip, zipOptions, ... }`). Fires when the value changes.

## Framework use

- **Vue:** `<ph-address-picker show-barangay @ph-change="onChange" />` (mark it a custom element in your Vue compiler config).
- **Angular:** add `CUSTOM_ELEMENTS_SCHEMA`, then `<ph-address-picker (ph-change)="...">`.
- **Svelte / vanilla:** use directly; listen for `ph-change`.

## Notes

**Client-side only.** Like all custom elements it `extends HTMLElement`, so import it in the browser — in SSR frameworks (Nuxt, Angular Universal, SvelteKit) import it lazily on mount (e.g. `onMounted(() => import('@ph-dev-utils/address-element'))`), not at module top level during server render.

Light-DOM rendering with `.ph-ap*` classes, so the optional `theme.css` (or your own CSS) applies. Handles NCR (no provinces), independent cities, and multi-ZIP cities — same correctness as the React package. ZIP/barangay data is community-sourced (GeoNames CC BY 4.0), not an official PHLPost feed.

## License

MIT (code). Bundled ZIP/barangay data © GeoNames / PSA PSGC.
