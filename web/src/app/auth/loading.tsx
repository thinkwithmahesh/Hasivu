import { AuthLayout } from '@/components/auth/AuthLayout';
import { Loader2 } from 'lucide-react';

export default function AuthLoading() {
  return (
    <AuthLayout>
      <div className="flex flex-col items-center justify-center space-y-4 p-8">
        <Loader2 className="h-8 w-8 animate-spin text-hasivu-primary-600" />
        <p className="text-sm text-gray-600">Loading authentication page...</p>
      </div>
    </AuthLayout>
  );
}
