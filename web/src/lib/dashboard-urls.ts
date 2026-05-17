/** Post-login dashboard path for a JWT / profile `role` string. */
export function getDashboardUrlForRole(role: string): string {
  const map: Record<string, string> = {
    admin: '/dashboard/admin',
    school_admin: '/dashboard/admin',
    parent: '/dashboard/parent',
    student: '/dashboard/student',
    vendor: '/dashboard/vendor',
    kitchen: '/dashboard/kitchen',
    kitchen_staff: '/dashboard/kitchen',
    teacher: '/dashboard/teacher',
  };
  return map[role] || '/dashboard/parent';
}
