'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import {
  registrationStep1Schema,
  registrationStep2Schema,
  registrationStep3Schema,
  type RegistrationStep1FormData,
  type RegistrationStep2FormData,
  type RegistrationStep3FormData,
} from './schemas';

interface MultiStepRegistrationFormProps {
  onSubmit: (
    data: RegistrationStep1FormData & RegistrationStep2FormData & RegistrationStep3FormData
  ) => Promise<void>;
  onValidateSchoolId?: (schoolId: string) => Promise<boolean>;
  onValidateParentLink?: (email: string, studentId: string) => Promise<boolean>;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
}

/**
 * TEMPORARILY DISABLED: Architectural mismatch between schemas and UI requires restructuring
 *
 * See Agent 19 analysis:
 * - Step 1 schema expects: email, password, confirmPassword, role, acceptTerms
 * - Step 1 UI tries to render: email, firstName, lastName (step 2 fields!)
 * - Step 2 schema expects: firstName, lastName, phoneNumber, dateOfBirth, grade, studentId
 * - Step 3 schema expects: emergencyContact fields, termsAccepted, privacyAccepted
 *
 * TODO: Restructure component to match schema expectations or update schemas to match UI flow
 *
 * Original implementation preserved in git history (commit before Agent 20 fixes)
 */
export function MultiStepRegistrationForm(props: MultiStepRegistrationFormProps) {
  return (
    <Card className={props.className}>
      <CardHeader>
        <CardTitle>Registration Temporarily Unavailable</CardTitle>
        <CardDescription>
          This feature is being restructured to fix a schema/UI mismatch.
          <br />
          Please use the simplified login flow or contact your school administrator.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600">
          We're working to restore full registration functionality. Thank you for your patience.
        </p>
      </CardContent>
    </Card>
  );
}
