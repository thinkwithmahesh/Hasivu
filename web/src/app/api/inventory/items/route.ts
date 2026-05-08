import { inventoryItems, ok } from '../../_utils/launch-data';

export async function GET() {
  return ok(inventoryItems);
}
