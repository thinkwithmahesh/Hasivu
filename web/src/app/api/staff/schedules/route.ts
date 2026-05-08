import { ok, schedules } from '../../_utils/launch-data';

export async function GET() {
  return ok(schedules);
}
