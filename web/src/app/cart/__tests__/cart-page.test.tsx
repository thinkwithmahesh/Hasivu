import { fireEvent, render, screen } from '@testing-library/react';
import { useRouter } from 'next/navigation';

import { useCart } from '@/contexts/CartContext';

import CartPage from '../page';

jest.mock('@/contexts/CartContext', () => ({
  useCart: jest.fn(),
}));

const mockedUseCart = useCart as jest.Mock;
const push = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

const mockedUseRouter = useRouter as jest.Mock;

const baseCart = {
  items: [],
  subtotal: 0,
  tax: 0,
  taxRate: 0.05,
  deliveryFee: 0,
  discount: 0,
  total: 0,
  itemCount: 0,
  lastUpdated: new Date('2026-05-07T00:00:00.000Z'),
};

describe('CartPage', () => {
  const updateQuantity = jest.fn();
  const removeItem = jest.fn();

  beforeEach(() => {
    mockedUseRouter.mockReturnValue({ push });
    mockedUseCart.mockReturnValue({
      cart: baseCart,
      isLoading: false,
      updateQuantity,
      removeItem,
    });
  });

  it('renders a loading state', () => {
    mockedUseCart.mockReturnValue({
      cart: baseCart,
      isLoading: true,
      updateQuantity,
      removeItem,
    });

    render(<CartPage />);

    expect(screen.getByText(/Loading cart/i)).toBeInTheDocument();
  });

  it('renders the empty-cart state with a menu link', () => {
    render(<CartPage />);

    expect(screen.getByRole('heading', { name: /Your cart is empty/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Browse menu/i })).toHaveAttribute('href', '/daily-menu');
  });

  it('renders cart totals and routes to checkout', () => {
    mockedUseCart.mockReturnValue({
      cart: {
        ...baseCart,
        items: [
          {
            id: 'cart-item-1',
            menuItemId: 'menu-1',
            menuItem: { name: 'Vegetable Biryani' },
            quantity: 2,
            deliveryDate: new Date('2026-05-08T00:00:00.000Z'),
            unitPrice: 85,
            totalPrice: 170,
            addedAt: new Date('2026-05-07T00:00:00.000Z'),
          },
        ],
        subtotal: 170,
        tax: 8.5,
        deliveryFee: 50,
        total: 228.5,
        itemCount: 2,
      },
      isLoading: false,
      updateQuantity,
      removeItem,
    });

    render(<CartPage />);

    expect(screen.getByRole('heading', { name: /^Cart$/i })).toBeInTheDocument();
    expect(screen.getByText('Vegetable Biryani')).toBeInTheDocument();
    expect(screen.getByText(/^Total/)).toHaveTextContent('₹228.50');

    fireEvent.click(screen.getByRole('button', { name: /Proceed to checkout/i }));
    expect(push).toHaveBeenCalledWith('/checkout');
  });

  it('updates and removes items from cart controls', () => {
    mockedUseCart.mockReturnValue({
      cart: {
        ...baseCart,
        items: [
          {
            id: 'cart-item-1',
            menuItemId: 'menu-1',
            menuItem: { name: 'Paneer Sandwich' },
            quantity: 1,
            deliveryDate: new Date('2026-05-08T00:00:00.000Z'),
            unitPrice: 45,
            totalPrice: 45,
            addedAt: new Date('2026-05-07T00:00:00.000Z'),
          },
        ],
        subtotal: 45,
        tax: 2.25,
        deliveryFee: 50,
        total: 97.25,
        itemCount: 1,
      },
      isLoading: false,
      updateQuantity,
      removeItem,
    });

    render(<CartPage />);

    fireEvent.click(screen.getByRole('button', { name: /Increase quantity/i }));
    expect(updateQuantity).toHaveBeenCalledWith('cart-item-1', 2);

    fireEvent.click(screen.getByRole('button', { name: /Decrease quantity/i }));
    expect(updateQuantity).toHaveBeenCalledWith('cart-item-1', 0);

    fireEvent.click(screen.getByRole('button', { name: /Remove item/i }));
    expect(removeItem).toHaveBeenCalledWith('cart-item-1');
  });
});
