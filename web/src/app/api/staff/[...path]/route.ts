import { NextRequest, NextResponse } from 'next/server';

const staffMembers = [
  {
    id: 'staff-kitchen-demo',
    firstName: 'Demo',
    lastName: 'Kitchen',
    name: 'Demo Kitchen',
    role: 'kitchen_staff',
    department: 'kitchen',
    status: 'active',
    email: 'kitchen.demo@hasivu.local',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const today = new Date().toISOString().slice(0, 10);
const schedules = [
  {
    id: 'schedule-kitchen-demo-today',
    staffId: 'staff-kitchen-demo',
    date: today,
    startTime: '08:00',
    endTime: '15:00',
    status: 'scheduled',
    shiftId: 'lunch-service',
    notes: 'Lunch service and delivery confirmation coverage',
  },
];

function ok(data: unknown) {
  return NextResponse.json({ success: true, data });
}

function notImplemented() {
  return NextResponse.json(
    {
      success: false,
      error: 'Staff mutations are not enabled in the launch Docker profile',
    },
    { status: 501 }
  );
}

export async function GET(_request: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path.join('/');

  if (path === 'members') {
    return ok(staffMembers);
  }

  if (path === 'schedules') {
    return ok(schedules);
  }

  if (path === 'metrics') {
    return ok({
      totalStaff: staffMembers.length,
      activeStaff: staffMembers.filter(member => member.status === 'active').length,
      scheduledToday: schedules.filter(schedule => schedule.date === today).length,
    });
  }

  if (path === 'attendance') {
    return ok([]);
  }

  if (path === 'tasks') {
    return ok([]);
  }

  return NextResponse.json({ success: false, error: 'Staff endpoint not found' }, { status: 404 });
}

export async function POST() {
  return notImplemented();
}

export async function PUT() {
  return notImplemented();
}

export async function PATCH() {
  return notImplemented();
}
