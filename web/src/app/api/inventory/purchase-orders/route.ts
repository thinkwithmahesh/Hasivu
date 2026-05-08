import { ok, purchaseOrders } from '../../_utils/launch-data';

export async function GET() {
  return ok(purchaseOrders);
}
