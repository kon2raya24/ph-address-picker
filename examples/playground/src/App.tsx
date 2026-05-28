import { useState } from 'react';
import { PhAddressPicker, type AddressValue } from '@ph-dev-utils/address-react';
import '@ph-dev-utils/address-react/theme.css';

export function App() {
  const [value, setValue] = useState<AddressValue | null>(null);
  return (
    <main style={{ maxWidth: 480, margin: '3rem auto', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ color: '#0038a8' }}>ph-address-picker</h1>
      <p>Region → Province → City/Municipality → ZIP (NCR skips province; Manila is multi-ZIP).</p>
      <PhAddressPicker onChange={setValue} />
      <h2 style={{ fontSize: '1rem', marginTop: '1.5rem' }}>Value</h2>
      <pre style={{ background: '#f1f5f9', padding: '1rem', borderRadius: 8, overflow: 'auto' }}>
        {JSON.stringify(value, null, 2)}
      </pre>
    </main>
  );
}
