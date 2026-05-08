import OrderConfirmationClient from './OrderConfirmationClient';

interface OrderConfirmationPageProps {
  params: Promise<{
    orderId: string;
  }>;
}

export default async function OrderConfirmationPage({ params }: OrderConfirmationPageProps) {
  const { orderId } = await params;
  return <OrderConfirmationClient orderId={orderId} />;
}
