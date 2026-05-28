import {
  createAddressStore,
  createJsDelivrFetcher,
  type AddressState,
  type AddressStore,
  type AddressValue,
  type CityOption,
  type Option,
} from '@ph-dev-utils/address-core';

const LABELS = {
  region: 'Region',
  province: 'Province',
  city: 'City / Municipality',
  barangay: 'Barangay',
  zip: 'ZIP Code',
};
const PLACEHOLDERS = {
  region: 'Select region…',
  province: 'Select province…',
  city: 'Select city / municipality…',
  barangay: 'Select barangay…',
  zip: 'ZIP',
};

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  return node;
}

/** Build a label + control field. Returns the wrapper plus the label/control nodes. */
function field(idPrefix: string, key: string, label: string) {
  const wrapper = el('div', 'ph-ap__field');
  const lab = el('label', 'ph-ap__label');
  lab.htmlFor = `${idPrefix}-${key}`;
  lab.textContent = label;
  wrapper.appendChild(lab);
  return { wrapper, label: lab };
}

function fillSelect(
  select: HTMLSelectElement,
  placeholder: string,
  options: readonly Option[],
  value: string | null,
  disabled: boolean,
): void {
  select.disabled = disabled;
  select.textContent = '';
  const ph = el('option');
  ph.value = '';
  ph.textContent = placeholder;
  select.appendChild(ph);
  for (const o of options) {
    const opt = el('option');
    opt.value = o.code;
    opt.textContent = o.name;
    select.appendChild(opt);
  }
  select.value = value ?? '';
}

/**
 * `<ph-address-picker>` — framework-agnostic cascading Philippine address picker.
 *
 * Attributes: `show-zip` (default true; set `"false"` to hide), `show-barangay`
 * (default false), `zip-policy` (`first` | `none`), `region` / `province` / `city`
 * / `zip` (initial PSGC codes / ZIP), `id-prefix`, `disabled`, `required`.
 *
 * Emits a `ph-change` CustomEvent whose `detail` is the {@link AddressValue}.
 */
export class PhAddressPickerElement extends HTMLElement {
  private store: AddressStore | null = null;
  private built = false;
  private prevValue: AddressValue | null = null;
  private unsubscribe: (() => void) | null = null;

  private regionSel!: HTMLSelectElement;
  private provinceField!: HTMLDivElement;
  private provinceSel!: HTMLSelectElement;
  private citySel!: HTMLSelectElement;
  private barangayField: HTMLDivElement | null = null;
  private barangaySel: HTMLSelectElement | null = null;
  private barangayHint: HTMLElement | null = null;
  private zipField: HTMLDivElement | null = null;
  private zipInput: HTMLInputElement | null = null;
  private zipOptionsSel: HTMLSelectElement | null = null;

  private get showZip(): boolean {
    return this.getAttribute('show-zip') !== 'false';
  }
  private get showBarangay(): boolean {
    return this.hasAttribute('show-barangay') && this.getAttribute('show-barangay') !== 'false';
  }
  private get idPrefix(): string {
    return this.getAttribute('id-prefix') || 'ph-ap';
  }
  private get isDisabled(): boolean {
    return this.hasAttribute('disabled');
  }
  private get isRequired(): boolean {
    return this.hasAttribute('required');
  }

  connectedCallback(): void {
    if (this.built) return;
    this.built = true;

    const zipPolicy = this.getAttribute('zip-policy') === 'none' ? 'none' : 'first';
    this.store = createAddressStore({
      zipPolicy,
      fetchBarangays: this.showBarangay ? createJsDelivrFetcher() : undefined,
      initialValue: {
        regionCode: this.getAttribute('region') ?? undefined,
        provinceCode: this.getAttribute('province') ?? undefined,
        cityCode: this.getAttribute('city') ?? undefined,
        zip: this.getAttribute('zip') ?? undefined,
      },
    });

    this.buildDom();
    this.prevValue = this.store.getState().value;
    this.render();
    this.unsubscribe = this.store.subscribe(() => this.onStoreChange());
  }

  disconnectedCallback(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
  }

  private buildDom(): void {
    const id = this.idPrefix;
    const root = el('div', 'ph-ap');

    const region = field(id, 'region', LABELS.region);
    this.regionSel = el('select', 'ph-ap__select');
    this.regionSel.id = `${id}-region`;
    this.regionSel.addEventListener('change', () =>
      this.store!.selectRegion(this.regionSel.value || null),
    );
    region.wrapper.appendChild(this.regionSel);
    root.appendChild(region.wrapper);

    const province = field(id, 'province', LABELS.province);
    this.provinceField = province.wrapper;
    this.provinceSel = el('select', 'ph-ap__select');
    this.provinceSel.id = `${id}-province`;
    this.provinceSel.addEventListener('change', () =>
      this.store!.selectProvince(this.provinceSel.value || null),
    );
    province.wrapper.appendChild(this.provinceSel);
    root.appendChild(province.wrapper);

    const city = field(id, 'city', LABELS.city);
    this.citySel = el('select', 'ph-ap__select');
    this.citySel.id = `${id}-city`;
    this.citySel.addEventListener('change', () =>
      this.store!.selectCity(this.citySel.value || null),
    );
    city.wrapper.appendChild(this.citySel);
    root.appendChild(city.wrapper);

    if (this.showBarangay) {
      const brgy = field(id, 'barangay', LABELS.barangay);
      this.barangayField = brgy.wrapper;
      this.barangaySel = el('select', 'ph-ap__select');
      this.barangaySel.id = `${id}-barangay`;
      this.barangaySel.addEventListener('change', () =>
        this.store!.selectBarangay(this.barangaySel!.value || null),
      );
      brgy.wrapper.appendChild(this.barangaySel);
      this.barangayHint = el('span', 'ph-ap__hint');
      this.barangayHint.id = `${id}-brgy-hint`;
      this.barangayHint.setAttribute('role', 'status');
      this.barangayHint.setAttribute('aria-live', 'polite');
      brgy.wrapper.appendChild(this.barangayHint);
      root.appendChild(brgy.wrapper);
    }

    if (this.showZip) {
      const zip = field(id, 'zip', LABELS.zip);
      this.zipField = zip.wrapper;
      const zipWrap = el('div', 'ph-ap__zip');
      this.zipInput = el('input', 'ph-ap__input');
      this.zipInput.id = `${id}-zip`;
      this.zipInput.type = 'text';
      this.zipInput.inputMode = 'numeric';
      this.zipInput.maxLength = 4;
      this.zipInput.placeholder = PLACEHOLDERS.zip;
      this.zipInput.addEventListener('input', () =>
        this.store!.setZip(this.zipInput!.value || null),
      );
      zipWrap.appendChild(this.zipInput);
      this.zipOptionsSel = el('select', 'ph-ap__select ph-ap__zip-options');
      this.zipOptionsSel.setAttribute('aria-label', `${LABELS.zip} options`);
      this.zipOptionsSel.addEventListener('change', () =>
        this.store!.setZip(this.zipOptionsSel!.value || null),
      );
      zipWrap.appendChild(this.zipOptionsSel);
      zip.wrapper.appendChild(zipWrap);
      root.appendChild(zip.wrapper);
    }

    this.appendChild(root);
  }

  private onStoreChange(): void {
    this.render();
    const value = this.store!.getState().value;
    if (value !== this.prevValue) {
      this.prevValue = value;
      this.dispatchEvent(
        new CustomEvent<AddressValue>('ph-change', {
          detail: value,
          bubbles: true,
          composed: true,
        }),
      );
    }
  }

  private render(): void {
    const state: AddressState = this.store!.getState();
    const { value, options } = state;
    const disabled = this.isDisabled;

    fillSelect(this.regionSel, PLACEHOLDERS.region, options.regions, value.region?.code ?? null, disabled);
    this.regionSel.required = this.isRequired;

    const hasProvinces = options.provinces.length > 0;
    this.provinceField.style.display = hasProvinces ? '' : 'none';
    fillSelect(
      this.provinceSel,
      PLACEHOLDERS.province,
      options.provinces,
      value.province?.code ?? null,
      disabled || !value.region,
    );

    fillSelect(
      this.citySel,
      PLACEHOLDERS.city,
      options.cities as CityOption[],
      value.city?.code ?? null,
      disabled || options.cities.length === 0,
    );
    this.citySel.required = this.isRequired;

    if (this.barangaySel && this.barangayHint) {
      const loading = state.barangayStatus === 'loading';
      fillSelect(
        this.barangaySel,
        loading ? 'Loading barangays…' : PLACEHOLDERS.barangay,
        options.barangays,
        value.barangay?.code ?? null,
        disabled || state.barangayStatus !== 'ready',
      );
      this.barangaySel.setAttribute('aria-busy', loading ? 'true' : 'false');
      if (loading) {
        this.barangayHint.textContent = 'Loading barangays…';
        this.barangayHint.style.display = '';
      } else if (state.barangayStatus === 'error') {
        this.barangayHint.textContent =
          "Couldn't load barangays — barangay is optional, or reselect the city to retry.";
        this.barangayHint.style.display = '';
      } else {
        this.barangayHint.textContent = '';
        this.barangayHint.style.display = 'none';
      }
    }

    if (this.zipInput && this.zipOptionsSel) {
      // Don't clobber the field while the user is typing in it.
      if (document.activeElement !== this.zipInput) {
        this.zipInput.value = value.zip ?? '';
      }
      this.zipInput.disabled = disabled;
      this.zipInput.required = this.isRequired;
      if (state.zipAmbiguous) {
        this.zipOptionsSel.style.display = '';
        fillSelect(this.zipOptionsSel, '', value.zipOptions.map((z) => ({ code: z, name: z })), value.zip ?? null, disabled);
      } else {
        this.zipOptionsSel.style.display = 'none';
      }
    }
  }
}

/** Register `<ph-address-picker>` (idempotent). Called automatically on import. */
export function definePhAddressPicker(tagName = 'ph-address-picker'): void {
  if (typeof customElements !== 'undefined' && !customElements.get(tagName)) {
    customElements.define(tagName, PhAddressPickerElement);
  }
}

definePhAddressPicker();
