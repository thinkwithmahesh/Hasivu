import { deferredFeatureResponse } from '../../_utils/feature-scope';

export async function GET() {
  return deferredFeatureResponse('Inventory metrics');
}
