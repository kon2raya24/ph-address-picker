import { describe, it, expect } from 'vitest';
import '../src/index'; // auto-registers <ph-address-picker>

function mount(attrs: Record<string, string> = {}): HTMLElement {
  document.body.innerHTML = '';
  const node = document.createElement('ph-address-picker');
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  document.body.appendChild(node); // triggers connectedCallback
  return node;
}

function sel(root: HTMLElement, key: string): HTMLSelectElement {
  return root.querySelector(`#ph-ap-${key}`) as HTMLSelectElement;
}

function change(node: HTMLSelectElement | HTMLInputElement, value: string): void {
  node.value = value;
  node.dispatchEvent(new Event(node.tagName === 'INPUT' ? 'input' : 'change', { bubbles: true }));
}

function hasOption(s: HTMLSelectElement, value: string): boolean {
  return [...s.options].some((o) => o.value === value);
}

describe('<ph-address-picker>', () => {
  it('registers the custom element', () => {
    expect(customElements.get('ph-address-picker')).toBeTruthy();
  });

  it('renders the region/city/zip fields by default', () => {
    const elx = mount();
    expect(sel(elx, 'region')).toBeTruthy();
    expect(sel(elx, 'city')).toBeTruthy();
    expect(elx.querySelector('#ph-ap-zip')).toBeTruthy();
  });

  it('cascades region → province → city and emits ph-change with autofilled ZIP', () => {
    const elx = mount();
    let detail: any = null;
    elx.addEventListener('ph-change', (e) => {
      detail = (e as CustomEvent).detail;
    });

    change(sel(elx, 'region'), '07');
    change(sel(elx, 'province'), '0722');
    expect(hasOption(sel(elx, 'city'), '072217')).toBe(true);
    change(sel(elx, 'city'), '072217');

    expect(detail.city.code).toBe('072217');
    expect(detail.zip).toBe('6000');
    expect((elx.querySelector('#ph-ap-zip') as HTMLInputElement).value).toBe('6000');
  });

  it('hides the province field for NCR and reaches Manila', () => {
    const elx = mount();
    change(sel(elx, 'region'), '13');
    const provField = sel(elx, 'province').closest('.ph-ap__field') as HTMLElement;
    expect(provField.style.display).toBe('none');
    expect(hasOption(sel(elx, 'city'), '133900')).toBe(true);
  });

  it('hides the ZIP field with show-zip="false"', () => {
    const elx = mount({ 'show-zip': 'false' });
    expect(elx.querySelector('#ph-ap-zip')).toBeNull();
  });

  it('seeds from the city attribute (hydration)', () => {
    const elx = mount({ city: '072217' });
    expect(sel(elx, 'region').value).toBe('07');
    expect(sel(elx, 'city').value).toBe('072217');
    expect((elx.querySelector('#ph-ap-zip') as HTMLInputElement).value).toBe('6000');
  });
});
