import {
  listRegions,
  listProvinces,
  listCitiesMunicipalities,
  findCityMunicipality,
  type CityMunicipality,
} from '@ph-dev-utils/core';
import { zipForCity } from './zip.js';
import type {
  AddressState,
  AddressValue,
  CityOption,
  Option,
  ZipPolicy,
  InitialValue,
} from './types.js';

const REGIONS: Option[] = listRegions().map((r) => ({ code: r.code, name: r.name }));

function toCityOption(c: CityMunicipality): CityOption {
  return { code: c.code, name: c.name, isCity: c.isCity };
}

function regionOption(code: string | null): Option | null {
  if (!code) return null;
  return REGIONS.find((r) => r.code === code) ?? null;
}

function provinceOption(code: string | null): Option | null {
  if (!code) return null;
  const p = listProvinces().find((x) => x.code === code);
  return p ? { code: p.code, name: p.name } : null;
}

function provincesFor(regionCode: string | null): Option[] {
  if (!regionCode) return [];
  return listProvinces(regionCode).map((p) => ({ code: p.code, name: p.name }));
}

/**
 * City options for the current region + (optional) province.
 * - province selected      → that province's cities/municipalities
 * - region has no provinces → all of the region's cities (NCR)
 * - provinced region, no province yet → the region's independent (province-null)
 *   HUCs only (e.g. City of Isabela r09, City of Cotabato r12) so they're reachable;
 *   normal cities appear once a province is chosen.
 */
function citiesFor(regionCode: string | null, provinceCode: string | null): CityOption[] {
  if (!regionCode) return [];
  if (provinceCode) {
    return listCitiesMunicipalities({ province: provinceCode }).map(toCityOption);
  }
  if (listProvinces(regionCode).length === 0) {
    return listCitiesMunicipalities({ region: regionCode }).map(toCityOption);
  }
  return listCitiesMunicipalities({ region: regionCode })
    .filter((c) => c.province === null)
    .map(toCityOption);
}

export const EMPTY_VALUE: AddressValue = {
  region: null,
  province: null,
  city: null,
  barangay: null,
  zip: null,
  zipOptions: [],
};

/** Derive the full state (options + flags) from a value. Pure. */
export function deriveState(value: AddressValue): AddressState {
  return {
    value,
    options: {
      regions: REGIONS,
      provinces: provincesFor(value.region?.code ?? null),
      cities: citiesFor(value.region?.code ?? null, value.province?.code ?? null),
      barangays: [],
    },
    barangayStatus: 'idle',
    zipAmbiguous: value.zipOptions.length > 1,
  };
}

export function withRegion(code: string | null): AddressValue {
  return { ...EMPTY_VALUE, region: regionOption(code) };
}

export function withProvince(value: AddressValue, code: string | null): AddressValue {
  return {
    ...EMPTY_VALUE,
    region: value.region,
    province: provinceOption(code),
  };
}

export function withCity(value: AddressValue, code: string | null, zipPolicy: ZipPolicy): AddressValue {
  if (!code) {
    return { ...value, city: null, barangay: null, zip: null, zipOptions: [] };
  }
  const c = findCityMunicipality(code); // matches by exact 6-digit code
  if (!c) {
    return { ...value, city: null, barangay: null, zip: null, zipOptions: [] };
  }
  const zipOptions = zipForCity(c.code);
  return {
    region: regionOption(c.region),
    province: provinceOption(c.province), // null for NCR / independent HUCs — valid
    city: { code: c.code, name: c.name, isCity: c.isCity },
    barangay: null,
    zip: zipPolicy === 'first' ? (zipOptions[0] ?? null) : null,
    zipOptions,
  };
}

export function withZip(value: AddressValue, zip: string | null): AddressValue {
  return { ...value, zip: zip && zip.trim() ? zip.trim() : null };
}

export function fromInitial(init: InitialValue | undefined, zipPolicy: ZipPolicy): AddressValue {
  if (!init) return EMPTY_VALUE;
  let value: AddressValue = EMPTY_VALUE;
  if (init.cityCode) {
    value = withCity(EMPTY_VALUE, init.cityCode, zipPolicy);
  } else if (init.provinceCode) {
    const prov = provinceOption(init.provinceCode);
    value = { ...EMPTY_VALUE, region: regionOption(prov ? regionOfProvince(init.provinceCode) : null), province: prov };
  } else if (init.regionCode) {
    value = withRegion(init.regionCode);
  }
  if (init.zip) value = withZip(value, init.zip);
  return value;
}

function regionOfProvince(provinceCode: string): string | null {
  const p = listProvinces().find((x) => x.code === provinceCode);
  return p ? p.region : null;
}
