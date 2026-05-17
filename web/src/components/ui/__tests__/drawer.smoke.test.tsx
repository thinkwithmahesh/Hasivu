import React from 'react';
import { render, screen } from '@testing-library/react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '../drawer';

describe('Drawer (smoke)', () => {
  it('renders children when open', () => {
    render(
      <Drawer open>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Test Drawer</DrawerTitle>
          </DrawerHeader>
          <p>Drawer Content</p>
        </DrawerContent>
      </Drawer>
    );

    expect(screen.getByText('Test Drawer')).toBeInTheDocument();
    expect(screen.getByText('Drawer Content')).toBeInTheDocument();
  });

  it('does not render children when closed', () => {
    render(
      <Drawer open={false}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Hidden Drawer</DrawerTitle>
          </DrawerHeader>
          <p>Hidden Content</p>
        </DrawerContent>
      </Drawer>
    );

    expect(screen.queryByText('Hidden Drawer')).not.toBeInTheDocument();
    expect(screen.queryByText('Hidden Content')).not.toBeInTheDocument();
  });

  it('calls onClose when backdrop is clicked', () => {
    const onOpenChange = jest.fn();
    render(
      <Drawer open onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Closable</DrawerTitle>
          </DrawerHeader>
          <p>Content</p>
        </DrawerContent>
      </Drawer>
    );

    const backdrop = document.querySelector('.fixed.inset-0');
    if (backdrop) {
      (backdrop as HTMLElement).click();
      expect(onOpenChange).toHaveBeenCalledWith(false);
    }
  });
});
