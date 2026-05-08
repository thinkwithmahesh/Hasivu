import { deferredFeatureResponse } from '../../_utils/feature-scope';

export async function GET() {
  return deferredFeatureResponse('Inventory suppliers');
}

export async function POST() {
  return deferredFeatureResponse('Inventory supplier creation');
}
