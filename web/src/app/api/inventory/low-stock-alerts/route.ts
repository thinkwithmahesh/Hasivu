import { inventoryItems, ok } from '../../_utils/launch-data';

export async function GET() {
  return ok(
    inventoryItems
      .filter(item => item.currentStock <= item.minStock)
      .map(item => ({
        itemId: item.id,
        itemName: item.name,
        currentStock: item.currentStock,
        minStock: item.minStock,
      }))
  );
}
