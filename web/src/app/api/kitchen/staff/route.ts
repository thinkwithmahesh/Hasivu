import { ok, staffMembers } from '../../_utils/launch-data';

export async function GET() {
  return ok(
    staffMembers.map(member => ({
      id: member.id,
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      role: member.role,
    }))
  );
}
