import { deferredFeatureResponse } from '../../_utils/feature-scope';

export async function GET() {
  return deferredFeatureResponse('Staff schedules');
}

export async function POST() {
  return deferredFeatureResponse('Staff schedule creation');
}
