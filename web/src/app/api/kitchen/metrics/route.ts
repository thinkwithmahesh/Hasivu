import { kitchenMetrics, ok } from '../../_utils/launch-data';

export async function GET() {
  return ok(kitchenMetrics());
}
