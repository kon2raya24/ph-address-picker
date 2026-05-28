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
});
