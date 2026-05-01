import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../button';

describe('Button (smoke)', () => {
  it('renders and handles click', async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();

    render(
      <Button type="button" onClick={onClick}>
        Save
      </Button>
    );

    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
