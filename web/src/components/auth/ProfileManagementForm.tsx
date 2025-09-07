"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { 
  User, Phone, Upload, Shield, Bell, Utensils, CreditCard,
  Camera, Check, X, AlertTriangle, Save, Eye, EyeOff,
  Clock, Smartphone, Mail, Heart, Zap
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import {
  profileManagementSchema,
  rfidLinkingSchema,
  profilePreferencesSchema,
  type ProfileManagementData,
  type RfidLinkingData,
  type ProfilePreferencesData,
  DIETARY_RESTRICTIONS,
  COMMON_ALLERGENS
} from "./schemas"

interface ProfileManagementFormProps {
  // Data handlers
  onUpdateProfile: (data: ProfileManagementData) => Promise<void>
  onLinkRfidCard?: (data: RfidLinkingData) => Promise<void>
  onUploadAvatar?: (file: File) => Promise<string>
  onValidateRfidCard?: (cardNumber: string) => Promise<boolean>
  
  // Initial data
  initialData?: Partial<ProfileManagementData>
  userRole?: "student" | "parent" | "teacher" | "admin" | "kitchen"
  linkedCards?: Array<{ id: string; number: string; status: "active" | "inactive" }>
  
  // State
  isLoading?: boolean
  error?: string | null
  success?: string | null
  className?: string
}

const SPICE_LEVELS = [
  { value: "mild", label: "Mild", icon: "🟢" },
  { value: "medium", label: "Medium", icon: "🟡" },
  { value: "spicy", label: "Spicy", icon: "🔴" }
]

const CUISINE_OPTIONS = [
  "Italian", "Chinese", "Indian", "Mexican", "Thai", "Japanese",
  "Mediterranean", "American", "French", "Korean", "Middle Eastern"
]

const SESSION_TIMEOUT_OPTIONS = [
  { value: "15", label: "15 minutes" },
  { value: "30", label: "30 minutes" },
  { value: "60", label: "1 hour" },
  { value: "120", label: "2 hours" }
]

export function ProfileManagementForm({
  onUpdateProfile,
  onLinkRfidCard,
  onUploadAvatar,
  onValidateRfidCard,
  initialData,
  userRole = "student",
  linkedCards = [],
  isLoading = false,
  error,
  success,
  className
}: ProfileManagementFormProps) {
  const [activeTab, setActiveTab] = React.useState("personal")
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(
    initialData?.personalInfo?.avatar || null
  )
  const [rfidValidationStatus, setRfidValidationStatus] = React.useState<{
    [key: string]: boolean | null
  }>({})

  // Main profile form
  const profileForm = useForm<ProfileManagementData>({
    resolver: zodResolver(profileManagementSchema),
    defaultValues: {
      personalInfo: {
        firstName: initialData?.personalInfo?.firstName || "",
        lastName: initialData?.personalInfo?.lastName || "",
        phone: initialData?.personalInfo?.phone || "",
        avatar: initialData?.personalInfo?.avatar || ""
      },
      preferences: {
        dietaryRestrictions: initialData?.preferences?.dietaryRestrictions || [],
        allergens: initialData?.preferences?.allergens || [],
        customDietaryNotes: initialData?.preferences?.customDietaryNotes || "",
        mealPreferences: {
          spiceLevel: initialData?.preferences?.mealPreferences?.spiceLevel || "medium",
          preferredCuisine: initialData?.preferences?.mealPreferences?.preferredCuisine || [],
          dislikedFoods: initialData?.preferences?.mealPreferences?.dislikedFoods || []
        },
        notificationPreferences: {
          mealReminders: initialData?.preferences?.notificationPreferences?.mealReminders ?? true,
          orderConfirmations: initialData?.preferences?.notificationPreferences?.orderConfirmations ?? true,
          promotionalEmails: initialData?.preferences?.notificationPreferences?.promotionalEmails ?? false,
          smsNotifications: initialData?.preferences?.notificationPreferences?.smsNotifications ?? true
        }
      },
      securitySettings: {
        twoFactorEnabled: initialData?.securitySettings?.twoFactorEnabled ?? false,
        loginNotifications: initialData?.securitySettings?.loginNotifications ?? true,
        sessionTimeout: initialData?.securitySettings?.sessionTimeout || "30"
      }
    }
  })

  // RFID card linking form
  const rfidForm = useForm<RfidLinkingData>({
    resolver: zodResolver(rfidLinkingSchema),
    defaultValues: {
      cardNumber: "",
      confirmCardNumber: "",
      securityPin: ""
    }
  })

  const watchedRfidCard = rfidForm.watch("cardNumber")

  // RFID card validation
  React.useEffect(() => {
    const validateCard = async () => {
      if (watchedRfidCard && watchedRfidCard.length === 8 && onValidateRfidCard) {
        try {
          const isValid = await onValidateRfidCard(watchedRfidCard)
          setRfidValidationStatus(prev => ({ ...prev, [watchedRfidCard]: isValid }))
        } catch (error) {
          setRfidValidationStatus(prev => ({ ...prev, [watchedRfidCard]: false }))
        }
      }
    }

    const debounceTimer = setTimeout(validateCard, 500)
    return () => clearTimeout(debounceTimer)
  }, [watchedRfidCard, onValidateRfidCard])

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && onUploadAvatar) {
      try {
        const avatarUrl = await onUploadAvatar(file)
        setAvatarPreview(avatarUrl)
        profileForm.setValue("personalInfo.avatar", avatarUrl)
      } catch (error) {
        console.error("Avatar upload error:", error)
      }
    } else if (file) {
      // Local preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
        profileForm.setValue("personalInfo.avatar", reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleProfileSubmit = async (data: ProfileManagementData) => {
    try {
      await onUpdateProfile(data)
    } catch (error) {
      console.error("Profile update error:", error)
    }
  }

  const handleRfidSubmit = async (data: RfidLinkingData) => {
    if (onLinkRfidCard) {
      try {
        await onLinkRfidCard(data)
        rfidForm.reset()
      } catch (error) {
        console.error("RFID linking error:", error)
      }
    }
  }

  const renderPersonalInfoTab = () => (
    <div className="space-y-6">
      {/* Avatar Upload */}
      <div className="flex flex-col items-center space-y-4">
        <Avatar className="w-24 h-24">
          <AvatarImage src={avatarPreview || undefined} />
          <AvatarFallback>
            <Camera className="h-8 w-8 text-gray-400" />
          </AvatarFallback>
        </Avatar>
        
        <div className="flex flex-col items-center space-y-2">
          <label className="cursor-pointer">
            <span className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              <Upload className="h-4 w-4 mr-2" />
              {avatarPreview ? "Change Photo" : "Upload Photo"}
            </span>
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleAvatarUpload}
              disabled={isLoading}
            />
          </label>
          <p className="text-xs text-gray-500">JPG, PNG up to 2MB</p>
        </div>
      </div>

      {/* Personal Information */}
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={profileForm.control}
          name="personalInfo.firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>First Name</FormLabel>
              <FormControl>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input {...field} placeholder="John" className="pl-10" disabled={isLoading} />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={profileForm.control}
          name="personalInfo.lastName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Last Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Doe" disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={profileForm.control}
        name="personalInfo.phone"
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
                  disabled={isLoading}
                />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )

  const renderDietaryPreferencesTab = () => (
    <div className="space-y-6">
      {/* Dietary Restrictions */}
      <FormField
        control={profileForm.control}
        name="preferences.dietaryRestrictions"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Dietary Restrictions</FormLabel>
            <FormDescription>
              Select all that apply to your dietary needs
            </FormDescription>
            <div className="grid grid-cols-2 gap-3">
              {DIETARY_RESTRICTIONS.map((restriction) => (
                <div key={restriction} className="flex items-center space-x-2">
                  <Checkbox
                    id={`restriction-${restriction}`}
                    checked={field.value?.includes(restriction)}
                    onCheckedChange={(checked) => {
                      const updatedRestrictions = checked
                        ? [...(field.value || []), restriction]
                        : field.value?.filter((r) => r !== restriction) || []
                      field.onChange(updatedRestrictions)
                    }}
                    disabled={isLoading}
                  />
                  <Label
                    htmlFor={`restriction-${restriction}`}
                    className="text-sm font-normal capitalize"
                  >
                    {restriction}
                  </Label>
                </div>
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Allergens */}
      <FormField
        control={profileForm.control}
        name="preferences.allergens"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Allergens & Food Sensitivities
            </FormLabel>
            <FormDescription>
              Critical: Please select all allergens for safety
            </FormDescription>
            <div className="grid grid-cols-2 gap-3">
              {COMMON_ALLERGENS.map((allergen) => (
                <div key={allergen} className="flex items-center space-x-2">
                  <Checkbox
                    id={`allergen-${allergen}`}
                    checked={field.value?.includes(allergen)}
                    onCheckedChange={(checked) => {
                      const updatedAllergens = checked
                        ? [...(field.value || []), allergen]
                        : field.value?.filter((a) => a !== allergen) || []
                      field.onChange(updatedAllergens)
                    }}
                    disabled={isLoading}
                  />
                  <Label
                    htmlFor={`allergen-${allergen}`}
                    className="text-sm font-normal capitalize"
                  >
                    {allergen}
                  </Label>
                </div>
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Custom Notes */}
      <FormField
        control={profileForm.control}
        name="preferences.customDietaryNotes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Additional Dietary Notes</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                placeholder="Any additional dietary requirements, medical conditions, or special instructions..."
                className="min-h-[100px]"
                maxLength={500}
                disabled={isLoading}
              />
            </FormControl>
            <FormDescription>
              {field.value?.length || 0}/500 characters
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Meal Preferences */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">Meal Preferences</h4>
        
        <FormField
          control={profileForm.control}
          name="preferences.mealPreferences.spiceLevel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Spice Level Preference</FormLabel>
              <FormControl>
                <div className="grid grid-cols-3 gap-3">
                  {SPICE_LEVELS.map((level) => (
                    <label
                      key={level.value}
                      className={`flex items-center justify-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                        field.value === level.value
                          ? "border-primary-500 bg-primary-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        value={level.value}
                        checked={field.value === level.value}
                        onChange={field.onChange}
                        className="sr-only"
                        disabled={isLoading}
                      />
                      <span className="text-lg">{level.icon}</span>
                      <span className="font-medium">{level.label}</span>
                    </label>
                  ))}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={profileForm.control}
          name="preferences.mealPreferences.preferredCuisine"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preferred Cuisines</FormLabel>
              <FormDescription>Select your favorite types of cuisine</FormDescription>
              <div className="grid grid-cols-2 gap-2">
                {CUISINE_OPTIONS.map((cuisine) => (
                  <div key={cuisine} className="flex items-center space-x-2">
                    <Checkbox
                      id={`cuisine-${cuisine}`}
                      checked={field.value?.includes(cuisine)}
                      onCheckedChange={(checked) => {
                        const updatedCuisines = checked
                          ? [...(field.value || []), cuisine]
                          : field.value?.filter((c) => c !== cuisine) || []
                        field.onChange(updatedCuisines)
                      }}
                      disabled={isLoading}
                    />
                    <Label
                      htmlFor={`cuisine-${cuisine}`}
                      className="text-sm font-normal"
                    >
                      {cuisine}
                    </Label>
                  </div>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  )

  const renderRfidCardTab = () => (
    <div className="space-y-6">
      {/* Existing Cards */}
      {linkedCards.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900 flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Linked RFID Cards
          </h4>
          
          {linkedCards.map((card) => (
            <div
              key={card.id}
              className="flex items-center justify-between p-3 border rounded-lg bg-gray-50"
            >
              <div className="flex items-center space-x-3">
                <CreditCard className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium">Card ****{card.number.slice(-4)}</p>
                  <p className="text-sm text-gray-500">
                    Full number: {card.number}
                  </p>
                </div>
              </div>
              <Badge variant={card.status === "active" ? "default" : "secondary"}>
                {card.status}
              </Badge>
            </div>
          ))}
          
          <Separator className="my-4" />
        </div>
      )}

      {/* Link New Card */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">Link New RFID Card</h4>
        
        <Form {...rfidForm}>
          <form onSubmit={rfidForm.handleSubmit(handleRfidSubmit)} className="space-y-4">
            <FormField
              control={rfidForm.control}
              name="cardNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>RFID Card Number</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        {...field}
                        placeholder="A1B2C3D4"
                        className="pl-10 pr-10 font-mono uppercase"
                        maxLength={8}
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        disabled={isLoading}
                      />
                      {watchedRfidCard && rfidValidationStatus[watchedRfidCard] !== null && (
                        <div className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                          rfidValidationStatus[watchedRfidCard] ? "text-green-500" : "text-red-500"
                        }`}>
                          {rfidValidationStatus[watchedRfidCard] ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>
                    8-character hexadecimal code found on your RFID card
                  </FormDescription>
                  <FormMessage />
                  {watchedRfidCard && rfidValidationStatus[watchedRfidCard] === false && (
                    <p className="text-sm text-red-600">
                      Card not found or already linked to another account
                    </p>
                  )}
                </FormItem>
              )}
            />

            <FormField
              control={rfidForm.control}
              name="confirmCardNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Card Number</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="A1B2C3D4"
                      className="font-mono uppercase"
                      maxLength={8}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={rfidForm.control}
              name="securityPin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Security PIN</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      placeholder="0000"
                      className="text-center text-lg tracking-wider"
                      maxLength={4}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    4-digit PIN for card security (will be required for meal purchases)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Linking Card...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Link RFID Card
                </>
              )}
            </Button>
          </form>
        </Form>
      </div>

      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Your RFID card allows quick meal purchases without entering payment details. 
          Keep your card secure and report lost cards immediately.
        </AlertDescription>
      </Alert>
    </div>
  )

  const renderNotificationTab = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900 flex items-center gap-2">
          <Bell className="h-4 w-4" />
          Notification Preferences
        </h4>

        <div className="space-y-4">
          <FormField
            control={profileForm.control}
            name="preferences.notificationPreferences.mealReminders"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Meal Reminders</FormLabel>
                  <FormDescription>
                    Get notified about upcoming meal times and deadlines
                  </FormDescription>
                </div>
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isLoading}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={profileForm.control}
            name="preferences.notificationPreferences.orderConfirmations"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Order Confirmations</FormLabel>
                  <FormDescription>
                    Receive confirmation when orders are placed and ready
                  </FormDescription>
                </div>
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isLoading}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={profileForm.control}
            name="preferences.notificationPreferences.smsNotifications"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    SMS Notifications
                  </FormLabel>
                  <FormDescription>
                    Receive important updates via text message
                  </FormDescription>
                </div>
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isLoading}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={profileForm.control}
            name="preferences.notificationPreferences.promotionalEmails"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Promotional Emails
                  </FormLabel>
                  <FormDescription>
                    Special offers, new menu items, and school events
                  </FormDescription>
                </div>
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isLoading}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h4 className="font-medium text-gray-900 flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Security Settings
        </h4>

        <FormField
          control={profileForm.control}
          name="securitySettings.twoFactorEnabled"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Two-Factor Authentication</FormLabel>
                <FormDescription>
                  Add an extra layer of security to your account
                </FormDescription>
              </div>
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isLoading}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={profileForm.control}
          name="securitySettings.loginNotifications"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Login Notifications</FormLabel>
                <FormDescription>
                  Get notified when someone signs into your account
                </FormDescription>
              </div>
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isLoading}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={profileForm.control}
          name="securitySettings.sessionTimeout"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Session Timeout
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select timeout duration" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {SESSION_TIMEOUT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Automatically sign out after this period of inactivity
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  )

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Profile Management</CardTitle>
        <CardDescription>
          Manage your personal information, dietary preferences, and security settings
        </CardDescription>
      </CardHeader>

      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4">
            <Check className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <Form {...profileForm}>
          <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="personal" className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Personal
                </TabsTrigger>
                <TabsTrigger value="dietary" className="flex items-center gap-1">
                  <Utensils className="h-3 w-3" />
                  Dietary
                </TabsTrigger>
                <TabsTrigger value="rfid" className="flex items-center gap-1">
                  <CreditCard className="h-3 w-3" />
                  RFID Card
                </TabsTrigger>
                <TabsTrigger value="notifications" className="flex items-center gap-1">
                  <Bell className="h-3 w-3" />
                  Settings
                </TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="space-y-4">
                {renderPersonalInfoTab()}
              </TabsContent>

              <TabsContent value="dietary" className="space-y-4">
                {renderDietaryPreferencesTab()}
              </TabsContent>

              <TabsContent value="rfid" className="space-y-4">
                {renderRfidCardTab()}
              </TabsContent>

              <TabsContent value="notifications" className="space-y-4">
                {renderNotificationTab()}
              </TabsContent>
            </Tabs>

            <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
              <Button
                type="submit"
                disabled={isLoading}
                className="min-w-[120px]"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}