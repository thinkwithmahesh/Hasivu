import { deferredFeatureResponse } from '../../_utils/feature-scope';

export async function GET() {
  return deferredFeatureResponse('Staff directory');
}

export async function POST() {
  return deferredFeatureResponse('Staff member creation');
}
