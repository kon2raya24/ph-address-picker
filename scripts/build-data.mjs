// Generates packages/address-core/data/zip-by-city.json: a compact
// { [cityMunCode]: string[] } map (6-digit PSGC code -> distinct 4-digit ZIPs),
// derived from @ph-dev-utils/postal. This is the only bundled data the picker
// adds; region/province/city come transitively from @ph-dev-utils/core.
//
// Run from repo root: node scripts/build-data.mjs

import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { listPostalCodes } from '@ph-dev-utils/postal';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '../packages/address-core/data');
const OUT = join(OUT_DIR, 'zip-by-city.json');

const VERIFIED_ON = '2026-05-28';

const byCity = new Map();
let skippedNull = 0;
for (const e of listPostalCodes()) {
  if (e.cityMunCode === null) {
    skippedNull++;
    continue; // barangay-level / spelling-variant ZIPs with no city join
  }
  if (!byCity.has(e.cityMunCode)) byCity.set(e.cityMunCode, new Set());
  byCity.get(e.cityMunCode).add(e.zip);
}

// Sorted object: cities by code, ZIPs ascending — deterministic output.
const zips = {};
for (const code of [...byCity.keys()].sort()) {
  zips[code] = [...byCity.get(code)].sort();
}

const multiZip = Object.values(zips).filter((z) => z.length > 1).length;
const payload = {
  _meta: {
    description: 'cityMunCode (6-digit PSGC) -> distinct 4-digit ZIP codes',
    source: 'Derived from @ph-dev-utils/postal (ZIP data: GeoNames CC BY 4.0; reconciled vs PHLPost locator)',
    join: 'keys join @ph-dev-utils/core CityMunicipality.code',
    verified_on: VERIFIED_ON,
    cities: Object.keys(zips).length,
    multi_zip_cities: multiZip,
    notes: [
      'ZIPs are NOT unique and a city can have many (Manila ~200, Davao 12) — arrays preserve all.',
      'Community-sourced, not an official PHLPost feed.',
    ],
  },
  zips,
};

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT, JSON.stringify(payload, null, 2) + '\n');

console.log(`cities with ZIPs : ${Object.keys(zips).length}`);
console.log(`multi-ZIP cities : ${multiZip}`);
console.log(`skipped (null)   : ${skippedNull}`);
