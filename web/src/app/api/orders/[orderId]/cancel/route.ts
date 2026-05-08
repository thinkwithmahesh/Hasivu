import { NextRequest } from 'next/server';
import { DELETE } from '../route';

export async function POST(request: NextRequest, context: { params: { orderId: string } }) {
  return DELETE(request, context);
}
