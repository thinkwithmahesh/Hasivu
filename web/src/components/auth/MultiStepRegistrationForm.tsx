'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  User,
  Mail,
  School,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ChevronRight,
  ChevronLeft,
  Check,
  Upload,
  AlertCircle,
  Users,
  GraduationCap,
  Shield,
  ChefHat,
  UserCheck,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

import {
  registrationStep1Schema,
  registrationStep2Schema,
  registrationStep3Schema,
  type RegistrationStep1Data,
  type RegistrationStep2Data,
  type RegistrationStep3Data,
  detectRoleFromEmail,
} from './schemas';

interface MultiStepRegistrationFormProps {
  onSubmit: (
    data: RegistrationStep1Data & RegistrationStep2Data & RegistrationStep3Data
  ) => Promise<void>;
  onValidateSchoolId?: (schoolId: string) => Promise<boolean>;
  onValidateParentLink?: (email: string, studentId: string) => Promise<boolean>;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
}

const STEPS = [
  { id: 1, title: 'Personal Information', description: 'Basic details and role' },
  { id: 2, title: 'School Information', description: 'Validation and linking' },
  { id: 3, title: 'Security Setup', description: 'Password and contacts' },
];

const ROLE_OPTIONS = [
  { value: 'student', label: 'Student', icon: GraduationCap, description: 'Access meal ordering' },
  {
    value: 'parent',
    label: 'Parent/Guardian',
    icon: Users,
    description: "Manage children's accounts",
  },
  { value: 'teacher', label: 'Teacher', icon: School, description: 'Educational staff' },
  { value: 'admin', label: 'Administrator', icon: Shield, description: 'System administration' },
  { value: 'kitchen', label: 'Kitchen Staff', icon: ChefHat, description: 'Meal preparation' },
];

export function MultiStepRegistrationForm({
  onSubmit,
  onValidateSchoolId,
  _onValidateParentLink,
  isLoading = false,
  error,
  className,
}: MultiStepRegistrationFormProps) {
  const [currentStep, setCurrentStep] = React.useState(1);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [profileImage, setProfileImage] = React.useState<string | null>(null);
  const [schoolIdValid, setSchoolIdValid] = React.useState<boolean | null>(null);
  const [formData, setFormData] = React.useState<any>({});

  // Step forms
  const step1Form = useForm<RegistrationStep1Data>({
    resolver: zodResolver(registrationStep1Schema),
    defaultValues: {
      email: '',
      firstName: '',
      lastName: '',
      role: 'student',
    },
  });

  const step2Form = useForm<RegistrationStep2Data>({
    resolver: zodResolver(registrationStep2Schema),
    defaultValues: {
      schoolId: '',
      classGrade: '',
      parentStudentLink: '',
      department: '',
      employeeId: '',
    },
  });

  const step3Form = useForm<RegistrationStep3Data>({
    resolver: zodResolver(registrationStep3Schema),
    defaultValues: {
      password: '',
      confirmPassword: '',
      phone: '',
      emergencyContact: {
        name: '',
        phone: '',
        relationship: '',
      },
      termsAccepted: false,
      privacyAccepted: false,
    },
  });

  const currentForm = currentStep === 1 ? step1Form : currentStep === 2 ? step2Form : step3Form;
  const progress = (currentStep / STEPS.length) * 100;

  // Watch form values
  const watchedEmail = step1Form.watch('email');
  const watchedRole = step1Form.watch('role');
  const watchedSchoolId = step2Form.watch('schoolId');

  // Role detection
  React.useEffect(() => {
    if (watchedEmail && watchedEmail.includes('@hasivu.edu')) {
      const detectedRole = detectRoleFromEmail(watchedEmail);
      if (detectedRole) {
        step1Form.setValue('role', detectedRole as any);
      }
    }
  }, [watchedEmail, step1Form]);

  // School ID validation
  React.useEffect(() => {
    const validateSchoolId = async () => {
      if (watchedSchoolId && watchedSchoolId.length === 9 && onValidateSchoolId) {
        try {
          const isValid = await onValidateSchoolId(watchedSchoolId);
          setSchoolIdValid(isValid);
        } catch (error) {
          setSchoolIdValid(false);
        }
      } else {
        setSchoolIdValid(null);
      }
    };

    const debounceTimer = setTimeout(validateSchoolId, 500);
    return () => clearTimeout(debounceTimer);
  }, [watchedSchoolId, onValidateSchoolId]);

  const handleNext = async () => {
    const isValid = await currentForm.trigger();
    if (isValid) {
      const currentData = currentForm.getValues();
      setFormData(prev => ({ ...prev, ...currentData }));

      if (currentStep < STEPS.length) {
        setCurrentStep(prev => prev + 1);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleFinalSubmit = async () => {
    const isValid = await step3Form.trigger();
    if (isValid) {
      const finalData = {
        ...formData,
        ...step3Form.getValues(),
        profileImage,
      };
      await onSubmit(finalData);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
        <p className="text-sm text-gray-600">Tell us about yourself</p>
      </div>

      <Form {...step1Form}>
        <form className="space-y-4">
          <FormField
            control={step1Form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>HASIVU School Email</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      {...field}
                      type="email"
                      placeholder="your.name@hasivu.edu"
                      className="pl-10"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={step1Form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input {...field} placeholder="John" className="pl-10" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={step1Form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Doe" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={step1Form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role</FormLabel>
                <FormControl>
                  <div className="grid grid-cols-1 gap-3">
                    {ROLE_OPTIONS.map(option => {
                      const IconComponent = option.icon;
                      return (
                        <label
                          key={option.value}
                          className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                            field.value === option.value
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="radio"
                            value={option.value}
                            checked={field.value === option.value}
                            onChange={field.onChange}
                            className="sr-only"
                          />
                          <IconComponent className="h-5 w-5 text-primary-600" />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{option.label}</div>
                            <div className="text-sm text-gray-500">{option.description}</div>
                          </div>
                          {field.value === option.value && (
                            <Check className="h-4 w-4 text-primary-600" />
                          )}
                        </label>
                      );
                    })}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">School Information</h3>
        <p className="text-sm text-gray-600">Verify your school details</p>
      </div>

      <Form {...step2Form}>
        <form className="space-y-4">
          <FormField
            control={step2Form.control}
            name="schoolId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>School ID</FormLabel>
                <FormControl>
                  <div className="relative">
                    <School className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      {...field}
                      placeholder="HSV123456"
                      className="pl-10 pr-10"
                      maxLength={9}
                    />
                    {schoolIdValid !== null && (
                      <div
                        className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                          schoolIdValid ? 'text-green-500' : 'text-red-500'
                        }`}
                      >
                        {schoolIdValid ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <AlertCircle className="h-4 w-4" />
                        )}
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
                {schoolIdValid === false && (
                  <p className="text-sm text-red-600">
                    School ID not found. Please contact administration.
                  </p>
                )}
              </FormItem>
            )}
          />

          {watchedRole === 'student' && (
            <FormField
              control={step2Form.control}
              name="classGrade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Class/Grade</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., Grade 10, Class A" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {watchedRole === 'parent' && (
            <FormField
              control={step2Form.control}
              name="parentStudentLink"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Student Email (to link)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="student.123@hasivu.edu" />
                  </FormControl>
                  <FormMessage />
                  <p className="text-sm text-gray-500">
                    Enter your child's school email to link accounts
                  </p>
                </FormItem>
              )}
            />
          )}

          {(watchedRole === 'teacher' || watchedRole === 'admin') && (
            <>
              <FormField
                control={step2Form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Mathematics, Administration" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={step2Form.control}
                name="employeeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employee ID</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="EMP001" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}
        </form>
      </Form>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Security Setup</h3>
        <p className="text-sm text-gray-600">Secure your account</p>
      </div>

      <Form {...step3Form}>
        <form className="space-y-4">
          {/* Profile Picture Upload */}
          <div className="text-center">
            <Label className="block text-sm font-medium text-gray-700 mb-2">
              Profile Picture (Optional)
            </Label>
            <div className="flex flex-col items-center space-y-2">
              <Avatar className="w-20 h-20">
                <AvatarImage src={profileImage || undefined} />
                <AvatarFallback>
                  <Upload className="h-8 w-8 text-gray-400" />
                </AvatarFallback>
              </Avatar>
              <label className="cursor-pointer">
                <span className="text-sm text-primary-600 hover:text-primary-500">
                  {profileImage ? 'Change Photo' : 'Upload Photo'}
                </span>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <FormField
              control={step3Form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        {...field}
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Create secure password"
                        className="pl-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-gray-500">
                    Must include uppercase, lowercase, number, and special character
                  </p>
                </FormItem>
              )}
            />

            <FormField
              control={step3Form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        {...field}
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm your password"
                        className="pl-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={step3Form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      {...field}
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      className="pl-10"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Emergency Contact */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700">Emergency Contact</Label>

            <FormField
              control={step3Form.control}
              name="emergencyContact.name"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input {...field} placeholder="Emergency contact name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={step3Form.control}
                name="emergencyContact.phone"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input {...field} placeholder="Emergency phone" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={step3Form.control}
                name="emergencyContact.relationship"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input {...field} placeholder="Relationship" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Terms and Privacy */}
          <div className="space-y-3">
            <FormField
              control={step3Form.control}
              name="termsAccepted"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <Label className="text-sm text-gray-600">
                      I accept the{' '}
                      <a href="/terms" className="text-primary-600 hover:underline">
                        Terms and Conditions
                      </a>
                    </Label>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={step3Form.control}
              name="privacyAccepted"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <Label className="text-sm text-gray-600">
                      I accept the{' '}
                      <a href="/privacy" className="text-primary-600 hover:underline">
                        Privacy Policy
                      </a>
                    </Label>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
          </div>
        </form>
      </Form>
    </div>
  );

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Join HASIVU Platform</CardTitle>
        <CardDescription className="text-center">
          Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1].title}
        </CardDescription>

        {/* Progress Bar */}
        <div className="mt-4">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            {STEPS.map((step, index) => (
              <span
                key={step.id}
                className={`${index + 1 <= currentStep ? 'text-primary-600 font-medium' : ''}`}
              >
                {step.title}
              </span>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}

        <div className="flex justify-between mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1 || isLoading}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          {currentStep < STEPS.length ? (
            <Button type="button" onClick={handleNext} disabled={isLoading}>
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button type="button" onClick={handleFinalSubmit} disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating Account...
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4 mr-2" />
                  Create Account
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
