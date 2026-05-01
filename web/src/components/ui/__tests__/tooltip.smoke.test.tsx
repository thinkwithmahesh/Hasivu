import React from 'react';
import { render, screen } from '@testing-library/react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../tooltip';

describe('Tooltip (smoke)', () => {
  it('renders open content when controlled', () => {
    render(
      <TooltipProvider delayDuration={0} skipDelayDuration={0}>
        <Tooltip open>
          <TooltipTrigger asChild>
            <button type="button">Trigger</button>
          </TooltipTrigger>
          <TooltipContent>Visible tip</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

    expect(screen.getByRole('button', { name: 'Trigger' })).toBeInTheDocument();
    expect(screen.getAllByText('Visible tip')[0]).toBeInTheDocument();
  });

  it('renders defaultOpen content for assertions without hover', () => {
    render(
      <TooltipProvider delayDuration={0} skipDelayDuration={0}>
        <Tooltip defaultOpen>
          <TooltipTrigger asChild>
            <span>Hover target</span>
          </TooltipTrigger>
          <TooltipContent>Default open</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

    expect(screen.getAllByText('Default open')[0]).toBeInTheDocument();
  });
});
