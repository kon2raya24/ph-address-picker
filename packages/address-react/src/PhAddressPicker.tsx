import { useMemo } from 'react';
import { usePhAddress } from './usePhAddress.js';
import { createJsDelivrFetcher } from '@ph-dev-utils/address-core';
import type { AddressValue, Fetcher, InitialValue, ZipPolicy } from '@ph-dev-utils/address-core';

export interface PhAddressLabels {
  region?: string;
  province?: string;
  city?: string;
  barangay?: string;
  zip?: string;
}

export interface PhAddressPickerProps {
  /** Seed from known PSGC codes (editing a saved address). Uncontrolled. */
  defaultValue?: InitialValue;
  onChange?: (value: AddressValue) => void;
  zipPolicy?: ZipPolicy;
  /** Show the ZIP field. Default true. */
  showZip?: boolean;
  /** Show the barangay field (lazy-loads per city). Default false. */
  showBarangay?: boolean;
  /** Override the barangay fetcher. Defaults to the jsDelivr CDN when `showBarangay` is on. */
  fetchBarangays?: Fetcher;
  labels?: PhAddressLabels;
  placeholders?: PhAddressLabels;
  disabled?: boolean;
  required?: boolean;
  /** Prefix for field ids (label association). Defaults to "ph-ap". */
  id?: string;
  className?: string;
}

const DEFAULT_LABELS: Required<PhAddressLabels> = {
  region: 'Region',
  province: 'Province',
  city: 'City / Municipality',
  barangay: 'Barangay',
  zip: 'ZIP Code',
};

const DEFAULT_PLACEHOLDERS: Required<PhAddressLabels> = {
  region: 'Select region…',
  province: 'Select province…',
  city: 'Select city / municipality…',
  barangay: 'Select barangay…',
  zip: 'ZIP',
};

export function PhAddressPicker(props: PhAddressPickerProps) {
  const {
    defaultValue,
    onChange,
    zipPolicy,
    showZip = true,
    showBarangay = false,
    fetchBarangays,
    labels,
    placeholders,
    disabled = false,
    required = false,
    id = 'ph-ap',
    className,
  } = props;

  const barangayFetcher = useMemo(
    () => (showBarangay ? (fetchBarangays ?? createJsDelivrFetcher()) : undefined),
    [showBarangay, fetchBarangays],
  );

  const a = usePhAddress({ defaultValue, onChange, zipPolicy, fetchBarangays: barangayFetcher });
  const L = { ...DEFAULT_LABELS, ...labels };
  const P = { ...DEFAULT_PLACEHOLDERS, ...placeholders };

  const hasProvinces = a.options.provinces.length > 0;
  const fieldId = (k: string) => `${id}-${k}`;

  return (
    <div className={`ph-ap${className ? ` ${className}` : ''}`}>
      <div className="ph-ap__field">
        <label className="ph-ap__label" htmlFor={fieldId('region')}>
          {L.region}
        </label>
        <select
          id={fieldId('region')}
          className="ph-ap__select"
          value={a.value.region?.code ?? ''}
          disabled={disabled}
          required={required}
          onChange={(e) => a.selectRegion(e.target.value || null)}
        >
          <option value="">{P.region}</option>
          {a.options.regions.map((r) => (
            <option key={r.code} value={r.code}>
              {r.name}
            </option>
          ))}
        </select>
      </div>

      {hasProvinces && (
        <div className="ph-ap__field">
          <label className="ph-ap__label" htmlFor={fieldId('province')}>
            {L.province}
          </label>
          <select
            id={fieldId('province')}
            className="ph-ap__select"
            value={a.value.province?.code ?? ''}
            disabled={disabled || !a.value.region}
            onChange={(e) => a.selectProvince(e.target.value || null)}
          >
            <option value="">{P.province}</option>
            {a.options.provinces.map((p) => (
              <option key={p.code} value={p.code}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="ph-ap__field">
        <label className="ph-ap__label" htmlFor={fieldId('city')}>
          {L.city}
        </label>
        <select
          id={fieldId('city')}
          className="ph-ap__select"
          value={a.value.city?.code ?? ''}
          disabled={disabled || a.options.cities.length === 0}
          required={required}
          onChange={(e) => a.selectCity(e.target.value || null)}
        >
          <option value="">{P.city}</option>
          {a.options.cities.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {showBarangay && (
        <div className="ph-ap__field">
          <label className="ph-ap__label" htmlFor={fieldId('barangay')}>
            {L.barangay}
          </label>
          <select
            id={fieldId('barangay')}
            className="ph-ap__select"
            value={a.value.barangay?.code ?? ''}
            disabled={disabled || a.barangayStatus !== 'ready'}
            aria-busy={a.barangayStatus === 'loading'}
            aria-describedby={
              a.barangayStatus === 'loading' || a.barangayStatus === 'error'
                ? fieldId('brgy-hint')
                : undefined
            }
            onChange={(e) => a.selectBarangay(e.target.value || null)}
          >
            <option value="">
              {a.barangayStatus === 'loading' ? 'Loading barangays…' : P.barangay}
            </option>
            {a.options.barangays.map((b) => (
              <option key={b.code} value={b.code}>
                {b.name}
              </option>
            ))}
          </select>
          {(a.barangayStatus === 'loading' || a.barangayStatus === 'error') && (
            <span id={fieldId('brgy-hint')} className="ph-ap__hint" role="status" aria-live="polite">
              {a.barangayStatus === 'loading'
                ? 'Loading barangays…'
                : "Couldn't load barangays — barangay is optional, or reselect the city to retry."}
            </span>
          )}
        </div>
      )}

      {showZip && (
        <div className="ph-ap__field">
          <label className="ph-ap__label" htmlFor={fieldId('zip')}>
            {L.zip}
          </label>
          <div className="ph-ap__zip">
            <input
              id={fieldId('zip')}
              className="ph-ap__input"
              type="text"
              inputMode="numeric"
              maxLength={4}
              placeholder={P.zip}
              value={a.value.zip ?? ''}
              disabled={disabled}
              required={required}
              aria-describedby={a.zipAmbiguous ? fieldId('zip-hint') : undefined}
              onChange={(e) => a.setZip(e.target.value || null)}
            />
            {a.zipAmbiguous && (
              <select
                aria-label={`${L.zip} options`}
                className="ph-ap__select ph-ap__zip-options"
                value={a.value.zip ?? ''}
                disabled={disabled}
                onChange={(e) => a.setZip(e.target.value || null)}
              >
                {a.value.zipOptions.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
            )}
          </div>
          {a.zipAmbiguous && (
            <span id={fieldId('zip-hint')} className="ph-ap__hint">
              This city has multiple ZIP codes — autofilled with one; pick or edit as needed.
            </span>
          )}
        </div>
      )}
    </div>
  );
}
