// Generates packages/address-data/barangays/<cityMunCode>.json — one small file per
// city/municipality, each an array of { code, name } barangays. The address picker
// lazy-fetches these per selected city from the jsDelivr CDN (npm-backed).
//
// Source: @ph-dev-utils/psgc-barangays (PSA Q4 2024 PSGC, 42,046 barangays).
// Run from repo root: node scripts/build-barangay-chunks.mjs

import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { listBarangays } from '@ph-dev-utils/psgc-barangays';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '../packages/address-data/barangays');

// Group barangays by their 6-digit parent city/municipality code.
const byCity = new Map();
for (const b of listBarangays()) {
  if (!byCity.has(b.cityMunCode)) byCity.set(b.cityMunCode, []);
  byCity.get(b.cityMunCode).push({ code: b.code, name: b.name });
}

// Fresh output dir.
rmSync(OUT_DIR, { recursive: true, force: true });
mkdirSync(OUT_DIR, { recursive: true });

let files = 0;
let maxCity = { code: '', n: 0 };
for (const [cityMunCode, list] of byCity) {
  list.sort((a, b) => (a.code < b.code ? -1 : a.code > b.code ? 1 : 0));
  writeFileSync(join(OUT_DIR, `${cityMunCode}.json`), JSON.stringify(list) + '\n');
  files++;
  if (list.length > maxCity.n) maxCity = { code: cityMunCode, n: list.length };
}

console.log(`cities (chunk files) : ${files}`);
console.log(`total barangays      : ${listBarangays().length}`);
console.log(`largest city         : ${maxCity.code} (${maxCity.n} barangays)`);
