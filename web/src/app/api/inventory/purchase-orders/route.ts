import { deferredFeatureResponse } from '../../_utils/feature-scope';

export async function GET() {
  return deferredFeatureResponse('Inventory purchase orders');
}

export async function POST() {
  return deferredFeatureResponse('Inventory purchase order creation');
}
