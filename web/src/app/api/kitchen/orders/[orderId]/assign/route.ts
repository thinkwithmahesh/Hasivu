import { NextRequest } from 'next/server';

import { kitchenOrders, ok, staffMembers } from '../../../../_utils/launch-data';

export async function PUT(request: NextRequest, context: { params: { orderId: string } }) {
  const body = await request.json().catch(() => ({}));
  const order = kitchenOrders.find(item => item.id === context.params.orderId) || kitchenOrders[0];
  const staff = staffMembers.find(member => member.id === body.staffId) || staffMembers[0];

  return ok({
    ...order,
    assignedStaffId: staff.id,
    assignedStaff: {
      id: staff.id,
      firstName: staff.firstName,
      lastName: staff.lastName,
      email: staff.email,
      role: staff.role,
    },
    assignedAt: new Date().toISOString(),
  });
}
