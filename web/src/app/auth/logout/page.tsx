import { redirect } from 'next/navigation';

export default function AuthLogoutPage() {
  redirect('/logout');
}
