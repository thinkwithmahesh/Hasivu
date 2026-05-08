import { deferredFeatureResponse } from '../../_utils/feature-scope';

export async function GET() {
  return deferredFeatureResponse('Inventory items');
}

export async function POST() {
  return deferredFeatureResponse('Inventory item creation');
}
