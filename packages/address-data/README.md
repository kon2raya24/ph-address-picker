# @ph-dev-utils/address-data

Per-city **PSGC barangay chunks** for the [`@ph-dev-utils/address-*`](https://github.com/kon2raya24/ph-address-picker) pickers. One small JSON file per city/municipality (1,634 files, 42,046 barangays total — PSA Q4 2024 PSGC), each an array of `{ code, name }`.

**This is not a code dependency** — you don't `import` it. The address picker lazy-fetches a single city's file on demand from the jsDelivr CDN:

```
https://cdn.jsdelivr.net/npm/@ph-dev-utils/address-data@0.1.0/barangays/072217.json
```

Splitting barangays into per-city files (vs. one ~4 MB bundle) keeps the picker's bundle tiny — only the selected city's barangays (usually a few KB) are fetched.

Data: PSA Q4 2024 PSGC via [`@ph-dev-utils/psgc-barangays`](https://www.npmjs.com/package/@ph-dev-utils/psgc-barangays). Each file's barangays join `@ph-dev-utils/core`'s `CityMunicipality.code`.

## License

MIT
