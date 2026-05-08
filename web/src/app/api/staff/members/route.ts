import { ok, staffMembers } from '../../_utils/launch-data';

export async function GET() {
  return ok(staffMembers);
}
