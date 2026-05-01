import React from 'react';
import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../card';
import { Badge } from '../badge';

describe('Card (smoke)', () => {
  it('renders all card sub-components', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Test Title</CardTitle>
        </CardHeader>
        <CardContent>Test Content</CardContent>
        <CardFooter>Test Footer</CardFooter>
      </Card>
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
    expect(screen.getByText('Test Footer')).toBeInTheDocument();
  });

  it('accepts elevated prop', () => {
    const { container } = render(<Card elevated>Elevated Card</Card>);
    expect(container.firstChild).toHaveClass('shadow-md');
  });

  it('accepts a ref', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<Card ref={ref}>Ref Card</Card>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe('Badge (smoke)', () => {
  it('renders with default variant', () => {
    render(<Badge>Default</Badge>);
    expect(screen.getByText('Default')).toBeInTheDocument();
  });

  it('renders info variant', () => {
    render(<Badge variant="info">Info Badge</Badge>);
    expect(screen.getByText('Info Badge')).toBeInTheDocument();
  });

  it('renders success variant', () => {
    render(<Badge variant="success">Active</Badge>);
    const badge = screen.getByText('Active');
    expect(badge).toBeInTheDocument();
  });

  it('renders destructive variant', () => {
    render(<Badge variant="destructive">Error</Badge>);
    expect(screen.getByText('Error')).toBeInTheDocument();
  });
});
