import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PhAddressPicker } from '../src/PhAddressPicker';

describe('<PhAddressPicker>', () => {
  it('associates labels with their selects', () => {
    render(<PhAddressPicker />);
    expect(screen.getByLabelText('Region')).toBeInTheDocument();
    expect(screen.getByLabelText('City / Municipality')).toBeInTheDocument();
    expect(screen.getByLabelText('ZIP Code')).toBeInTheDocument();
  });

  it('cascades Central Visayas → Cebu → Cebu City and autofills ZIP via onChange', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<PhAddressPicker onChange={onChange} />);

    await user.selectOptions(screen.getByLabelText('Region'), '07');
    await user.selectOptions(screen.getByLabelText('Province'), '0722');
    await user.selectOptions(screen.getByLabelText('City / Municipality'), '072217');

    const last = onChange.mock.calls.at(-1)![0];
    expect(last.city.code).toBe('072217');
    expect(last.zip).toBe('6000');
    expect(screen.getByLabelText('ZIP Code')).toHaveValue('6000');
  });

  it('hides the province step for NCR and reaches Manila', async () => {
    const user = userEvent.setup();
    render(<PhAddressPicker />);
    await user.selectOptions(screen.getByLabelText('Region'), '13');
    expect(screen.queryByLabelText('Province')).toBeNull();
    await user.selectOptions(screen.getByLabelText('City / Municipality'), '133900');
    // Manila is multi-ZIP → a candidate ZIP select appears.
    expect(screen.getByLabelText('ZIP Code options')).toBeInTheDocument();
  });

  it('hides the ZIP field when showZip is false', () => {
    render(<PhAddressPicker showZip={false} />);
    expect(screen.queryByLabelText('ZIP Code')).toBeNull();
  });

  it('seeds from defaultValue (edit-form hydration)', () => {
    render(<PhAddressPicker defaultValue={{ cityCode: '072217' }} />);
    expect(screen.getByLabelText('Region')).toHaveValue('07');
    expect(screen.getByLabelText('City / Municipality')).toHaveValue('072217');
    expect(screen.getByLabelText('ZIP Code')).toHaveValue('6000');
  });

  it('loads the barangay field via the fetcher when showBarangay is set', async () => {
    const fetchBarangays = vi.fn(async () => [{ code: '072217001', name: 'Adlaon' }]);
    const user = userEvent.setup();
    render(<PhAddressPicker showBarangay fetchBarangays={fetchBarangays} />);

    await user.selectOptions(screen.getByLabelText('Region'), '07');
    await user.selectOptions(screen.getByLabelText('Province'), '0722');
    await user.selectOptions(screen.getByLabelText('City / Municipality'), '072217');

    expect(screen.getByLabelText('Barangay')).toBeInTheDocument();
    expect(await screen.findByRole('option', { name: 'Adlaon' })).toBeInTheDocument();
    expect(fetchBarangays).toHaveBeenCalledWith('072217');
  });

  describe('searchable combobox', () => {
    it('renders the city field as a combobox, type-filters, and selects by code on click', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(<PhAddressPicker searchable onChange={onChange} />);

      // Region/province stay native selects even when searchable.
      await user.selectOptions(screen.getByLabelText('Region'), '07');
      await user.selectOptions(screen.getByLabelText('Province'), '0722');

      const city = screen.getByLabelText('City / Municipality');
      expect(city).toHaveAttribute('role', 'combobox');

      await user.click(city);
      // User types the common "Cebu City" form; PSA stores "City of Cebu".
      // Token-AND matching bridges the word-order difference.
      await user.type(city, 'cebu city');
      const opt = await screen.findByRole('option', { name: 'City of Cebu' });
      await user.click(opt);

      const last = onChange.mock.calls.at(-1)![0];
      expect(last.city.code).toBe('072217');
      expect(last.zip).toBe('6000');
      expect(city).toHaveValue('City of Cebu');
    });

    it('selects with keyboard (ArrowDown + Enter) and resolves by code', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(<PhAddressPicker searchable onChange={onChange} />);

      await user.selectOptions(screen.getByLabelText('Region'), '07');
      await user.selectOptions(screen.getByLabelText('Province'), '0722');

      const city = screen.getByLabelText('City / Municipality');
      await user.click(city);
      await user.type(city, 'city of cebu');
      await user.keyboard('{ArrowDown}{Enter}');

      const last = onChange.mock.calls.at(-1)![0];
      expect(last.city.code).toBe('072217');
      expect(city).toHaveValue('City of Cebu');
    });

    it('reverts to the selected name when blurred with a partial query', async () => {
      const user = userEvent.setup();
      render(<PhAddressPicker searchable defaultValue={{ cityCode: '072217' }} />);

      const city = screen.getByLabelText('City / Municipality');
      expect(city).toHaveValue('City of Cebu'); // hydrated

      await user.click(city);
      await user.clear(city);
      await user.type(city, 'zzz no match');
      expect(await screen.findByText('No matching city / municipality')).toBeInTheDocument();

      await user.tab(); // blur without choosing
      expect(city).toHaveValue('City of Cebu'); // reverted, selection intact
    });
  });
});
