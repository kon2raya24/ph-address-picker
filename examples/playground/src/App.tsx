import { useState } from 'react';
import { PhAddressPicker, type AddressValue } from '@ph-dev-utils/address-react';
import '@ph-dev-utils/address-react/theme.css';

export function App() {
  const [value, setValue] = useState<AddressValue | null>(null);
  const [searchable, setSearchable] = useState(true);
  const [showBarangay, setShowBarangay] = useState(false);
  return (
    <main style={{ maxWidth: 480, margin: '3rem auto', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ color: '#0038a8' }}>ph-address-picker</h1>
      <p>Region → Province → City/Municipality → ZIP (NCR skips province; Manila is multi-ZIP).</p>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
        <label>
          <input type="checkbox" checked={searchable} onChange={(e) => setSearchable(e.target.checked)} />{' '}
          searchable (type-to-filter)
        </label>
        <label>
          <input type="checkbox" checked={showBarangay} onChange={(e) => setShowBarangay(e.target.checked)} />{' '}
          show barangay
        </label>
      </div>
      <PhAddressPicker
        // remount when toggles change so the field type swaps cleanly
        key={`${searchable}-${showBarangay}`}
        searchable={searchable}
        showBarangay={showBarangay}
        onChange={setValue}
      />
      <h2 style={{ fontSize: '1rem', marginTop: '1.5rem' }}>Value</h2>
      <pre style={{ background: '#f1f5f9', padding: '1rem', borderRadius: 8, overflow: 'auto' }}>
        {JSON.stringify(value, null, 2)}
      </pre>
    </main>
  );
}
