import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Popover, PopoverContent, PopoverTrigger } from '../popover';

// Radix portals confuse jsdom teardown; inline portal content for stable unmount in unit tests.
jest.mock('@radix-ui/react-popover', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  const actual = jest.requireActual('@radix-ui/react-popover');
  return {
    ...actual,
    Portal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

describe('Popover (smoke)', () => {
  it('renders content when defaultOpen', () => {
    render(
      <Popover defaultOpen>
        <PopoverTrigger asChild>
          <button type="button">Open</button>
        </PopoverTrigger>
        <PopoverContent>Panel text</PopoverContent>
      </Popover>
    );

    expect(screen.getByText('Panel text')).toBeInTheDocument();
  });

  it('opens on trigger click', async () => {
    const user = userEvent.setup();
    render(
      <Popover>
        <PopoverTrigger asChild>
          <button type="button">Menu</button>
        </PopoverTrigger>
        <PopoverContent>Hidden panel</PopoverContent>
      </Popover>
    );

    await user.click(screen.getByRole('button', { name: 'Menu' }));
    expect(await screen.findByText('Hidden panel')).toBeInTheDocument();
  });
});
