import { ok, suppliers } from '../../_utils/launch-data';

export async function GET() {
  return ok(suppliers);
}
