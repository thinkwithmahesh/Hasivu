"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { 
  User, Phone, Upload, Shield, Bell, Utensils, CreditCard,
  Camera, Check, X, AlertTriangle, Save, _Eye, _EyeOff,
  Clock, Smartphone, Mail, _Heart, _Zap
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
  _profilePreferencesSchema,
  type ProfileManagementData,
  type RfidLinkingData,
  type _ProfilePreferencesData,
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
