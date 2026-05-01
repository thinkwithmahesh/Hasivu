import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '../input-otp';

describe('InputOTP (smoke)', () => {
  it('renders a hidden textbox for entry', () => {
    render(
      <InputOTP maxLength={4} value="">
        <InputOTPGroup>
          {Array.from({ length: 4 }, (_, i) => (
            <InputOTPSlot key={i} index={i} />
          ))}
        </InputOTPGroup>
      </InputOTP>
    );

    expect(screen.getByRole('textbox', { hidden: true })).toBeInTheDocument();
  });

  it('invokes onChange when typing', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    render(
      <InputOTP maxLength={4} value="" onChange={onChange}>
        <InputOTPGroup>
          {Array.from({ length: 4 }, (_, i) => (
            <InputOTPSlot key={i} index={i} />
          ))}
        </InputOTPGroup>
      </InputOTP>
    );

    const input = screen.getByRole('textbox', { hidden: true });
    await user.type(input, '12');

    expect(onChange).toHaveBeenCalled();
    expect(onChange.mock.calls.map(c => c[0])).toEqual(['1', '2']);
  });
});
