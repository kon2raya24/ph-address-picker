import { describe, it, expect } from 'vitest';
import { createAddressStore } from '../src/store';

describe('createAddressStore — cascade', () => {
  it('starts empty with all 17 regions available', () => {
    const s = createAddressStore();
    const st = s.getState();
    expect(st.value.region).toBeNull();
    expect(st.options.regions.length).toBe(17);
    expect(st.options.provinces).toEqual([]);
    expect(st.options.cities).toEqual([]);
  });

  it('region → province → city (Central Visayas → Cebu → Cebu City) with ZIP autofill', () => {
    const s = createAddressStore();
    s.selectRegion('07');
    expect(s.getState().options.provinces.length).toBeGreaterThan(0);
    // No province-null HUC in region 07, so cities are empty until a province is picked.
    expect(s.getState().options.cities).toEqual([]);

    s.selectProvince('0722'); // Cebu
    const cities = s.getState().options.cities;
    expect(cities.some((c) => c.code === '072217')).toBe(true); // Cebu City present

    s.selectCity('072217');
    const v = s.getState().value;
    expect(v.city?.name).toBe('City of Cebu');
    expect(v.region?.code).toBe('07');
    expect(v.province?.code).toBe('0722');
    expect(v.zip).toBe('6000');
    expect(v.zipOptions).toEqual(['6000']);
    expect(s.getState().zipAmbiguous).toBe(false);
  });

  it('selecting a region resets downstream province/city/zip', () => {
    const s = createAddressStore();
    s.selectRegion('07');
    s.selectProvince('0722');
    s.selectCity('072217');
    s.selectRegion('01'); // change region
    const v = s.getState().value;
    expect(v.province).toBeNull();
    expect(v.city).toBeNull();
    expect(v.zip).toBeNull();
    expect(v.zipOptions).toEqual([]);
  });
});

describe('NCR / null-province handling', () => {
  it('NCR (region 13) has no provinces and lists cities directly', () => {
    const s = createAddressStore();
    s.selectRegion('13');
    expect(s.getState().options.provinces).toEqual([]); // UI hides province step
    const cities = s.getState().options.cities;
    expect(cities.length).toBeGreaterThan(10); // 17 NCR LGUs
    expect(cities.some((c) => c.code === '133900')).toBe(true); // Manila
  });

  it('Manila is multi-ZIP (ambiguous) and has null province', () => {
    const s = createAddressStore();
    s.selectRegion('13');
    s.selectCity('133900');
    const v = s.getState().value;
    expect(v.province).toBeNull();
    expect(v.zipOptions.length).toBeGreaterThan(1);
    expect(s.getState().zipAmbiguous).toBe(true);
    expect(v.zip).toBe(v.zipOptions[0]); // autofilled with first candidate
  });

  it('independent city in a provinced region is reachable before picking a province (Isabela City, r09)', () => {
    const s = createAddressStore();
    s.selectRegion('09');
    expect(s.getState().options.provinces.length).toBeGreaterThan(0);
    expect(s.getState().options.cities.some((c) => c.code === '099701')).toBe(true);
    s.selectCity('099701');
    expect(s.getState().value.city?.name).toContain('Isabela');
    expect(s.getState().value.province).toBeNull();
  });
});

describe('ZIP behavior', () => {
  it('zipPolicy "none" does not autofill', () => {
    const s = createAddressStore({ zipPolicy: 'none' });
    s.selectRegion('07');
    s.selectProvince('0722');
    s.selectCity('072217');
    expect(s.getState().value.zip).toBeNull();
    expect(s.getState().value.zipOptions).toEqual(['6000']);
  });

  it('setZip overrides the autofilled ZIP', () => {
    const s = createAddressStore();
    s.selectRegion('07');
    s.selectProvince('0722');
    s.selectCity('072217');
    s.setZip('6001');
    expect(s.getState().value.zip).toBe('6001');
  });
});

describe('hydration via initialValue', () => {
  it('seeds region/province/city/zip from a cityCode alone', () => {
    const s = createAddressStore({ initialValue: { cityCode: '072217' } });
    const v = s.getState().value;
    expect(v.region?.code).toBe('07');
    expect(v.province?.code).toBe('0722');
    expect(v.city?.code).toBe('072217');
    expect(v.zip).toBe('6000');
  });

  it('resolves city strictly by code (no Quezon-City name ambiguity)', () => {
    const s = createAddressStore({ initialValue: { cityCode: '137404' } });
    const v = s.getState().value;
    expect(v.city?.name).toBe('Quezon City');
    expect(v.region?.code).toBe('13');
    expect(v.province).toBeNull();
  });
});

describe('subscribe', () => {
  it('notifies listeners on change and stops after unsubscribe', () => {
    const s = createAddressStore();
    let n = 0;
    const unsub = s.subscribe(() => n++);
    s.selectRegion('07');
    expect(n).toBe(1);
    unsub();
    s.selectRegion('01');
    expect(n).toBe(1);
  });
});
