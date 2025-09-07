"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { 
  Bell, 
  Download, 
  Wifi, 
  WifiOff, 
  Battery, 
  Signal,
  Smartphone,
  Share,
  X,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react'

// PWA Install Prompt Component
interface PWAInstallPromptProps {
  onInstall: () => void
  onDismiss: () => void
  variant?: 'card' | 'banner' | 'fab'
}

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({
  onInstall,
  onDismiss,
  variant = 'card'
}) => {
  if (variant === 'banner') {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-primary text-white p-3 safe-area-pt animate-slide-down">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="flex items-center space-x-3">
            <Smartphone className="h-5 w-5" />
            <div>
              <p className="text-sm font-medium">Install HASIVU App</p>
              <p className="text-xs opacity-90">For a better experience</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button size="sm" variant="secondary" onClick={onInstall}>
              Install
            </Button>
            <Button size="sm" variant="ghost" onClick={onDismiss} className="text-white">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'fab') {
    return (
      <Button
        variant="fab"
        onClick={onInstall}
        className="fixed bottom-20 right-4 z-40 shadow-xl"
        haptic
      >
        <Download className="h-6 w-6" />
      </Button>
    )
  }

  return (
    <Card className="fixed bottom-20 left-4 right-4 z-40 mx-auto max-w-md border-primary/20 bg-gradient-to-r from-primary/5 to-blue-50 animate-slide-in-bottom">
      <div className="p-4">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Smartphone className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900">Install HASIVU App</h4>
            <p className="text-sm text-gray-600 mt-1">
              Get faster access, offline features, and push notifications.
            </p>
            <div className="flex space-x-2 mt-3">
              <Button size="sm" onClick={onInstall} haptic>
                Install Now
              </Button>
              <Button size="sm" variant="ghost" onClick={onDismiss}>
                Not now
              </Button>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={onDismiss}
            className="h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </Card>
  )
}

// Offline Status Indicator
interface OfflineStatusProps {
  isOnline: boolean
  onRetry?: () => void
  className?: string
}

export const OfflineStatus: React.FC<OfflineStatusProps> = ({
  isOnline,
  onRetry,
  className
}) => {
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    setShowBanner(!isOnline)
  }, [isOnline])

  if (!showBanner) return null

  return (
    <div className={cn(
      "fixed top-0 left-0 right-0 z-50 bg-orange-500 text-white p-3 safe-area-pt animate-slide-down",
      className
    )}>
      <div className="flex items-center justify-between max-w-md mx-auto">
        <div className="flex items-center space-x-3">
          <WifiOff className="h-5 w-5" />
          <div>
            <p className="text-sm font-medium">You're offline</p>
            <p className="text-xs opacity-90">Some features may be limited</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {onRetry && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onRetry}
              className="text-white hover:bg-white/20"
            >
              Retry
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowBanner(false)}
            className="h-6 w-6 p-0 text-white hover:bg-white/20"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// Push Notification Permission
interface NotificationPermissionProps {
  onPermissionGranted?: () => void
  onPermissionDenied?: () => void
}

export const NotificationPermission: React.FC<NotificationPermissionProps> = ({
  onPermissionGranted,
  onPermissionDenied
}) => {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission)
      
      // Show prompt after 5 seconds if permission is default
      if (Notification.permission === 'default') {
        const timer = setTimeout(() => setShowPrompt(true), 5000)
        return () => clearTimeout(timer)
      }
    }
  }, [])

  const requestPermission = useCallback(async () => {
    if ('Notification' in window) {
      try {
        const result = await Notification.requestPermission()
        setPermission(result)
        setShowPrompt(false)
        
        if (result === 'granted') {
          onPermissionGranted?.()
          // Show test notification
          new Notification('HASIVU Notifications Enabled', {
            body: 'You\'ll now receive updates about your orders and meal schedules.',
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-72x72.png'
          })
        } else {
          onPermissionDenied?.()
        }
      } catch (error) {
        console.error('Error requesting notification permission:', error)
      }
    }
  }, [onPermissionGranted, onPermissionDenied])

  if (!('Notification' in window) || permission === 'granted' || !showPrompt) {
    return null
  }

  return (
    <Card className="fixed bottom-20 left-4 right-4 z-40 mx-auto max-w-md border-blue-200 bg-blue-50 animate-slide-in-bottom">
      <div className="p-4">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Bell className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900">Stay Updated</h4>
            <p className="text-sm text-gray-600 mt-1">
              Get notified about order status, meal schedules, and important updates.
            </p>
            <div className="flex space-x-2 mt-3">
              <Button size="sm" onClick={requestPermission} haptic>
                Allow Notifications
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowPrompt(false)}>
                Not now
              </Button>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowPrompt(false)}
            className="h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </Card>
  )
}

// Network Status Indicator (for status bar)
export const NetworkStatusIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [connectionType, setConnectionType] = useState<string>('unknown')

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Get connection info if available
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      setConnectionType(connection.effectiveType || 'unknown')
      
      const handleConnectionChange = () => {
        setConnectionType(connection.effectiveType || 'unknown')
      }
      
      connection.addEventListener('change', handleConnectionChange)
      
      return () => {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
        connection.removeEventListener('change', handleConnectionChange)
      }
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <div className="flex items-center space-x-1">
      {isOnline ? (
        <>
          <Wifi className="h-4 w-4 text-green-600" />
          <span className="text-xs text-green-600 font-medium">
            {connectionType !== 'unknown' ? connectionType.toUpperCase() : 'Online'}
          </span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4 text-red-600" />
          <span className="text-xs text-red-600 font-medium">Offline</span>
        </>
      )}
    </div>
  )
}

// Background Sync Status
interface BackgroundSyncStatusProps {
  pendingActions: Array<{
    id: string
    type: 'order' | 'payment' | 'feedback'
    description: string
    timestamp: Date
  }>
  onRetryAction?: (actionId: string) => void
}

export const BackgroundSyncStatus: React.FC<BackgroundSyncStatusProps> = ({
  pendingActions,
  onRetryAction
}) => {
  if (pendingActions.length === 0) return null

  return (
    <Card className="mx-4 mb-4 border-amber-200 bg-amber-50">
      <div className="p-3">
        <div className="flex items-center space-x-2 mb-2">
          <Clock className="h-4 w-4 text-amber-600" />
          <span className="text-sm font-medium text-amber-800">
            Pending Actions ({pendingActions.length})
          </span>
        </div>
        <p className="text-xs text-amber-700 mb-3">
          These actions will be completed when you're back online.
        </p>
        <div className="space-y-2">
          {pendingActions.slice(0, 3).map((action) => (
            <div key={action.id} className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-900">{action.description}</p>
                <p className="text-xs text-gray-500">
                  {action.timestamp.toLocaleTimeString()}
                </p>
              </div>
              {onRetryAction && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onRetryAction(action.id)}
                  className="h-6 px-2 text-xs"
                >
                  Retry
                </Button>
              )}
            </div>
          ))}
        </div>
        {pendingActions.length > 3 && (
          <p className="text-xs text-amber-600 mt-2">
            +{pendingActions.length - 3} more actions pending
          </p>
        )}
      </div>
    </Card>
  )
}

// Share functionality for PWA
interface ShareButtonProps {
  title: string
  text: string
  url?: string
  className?: string
  variant?: 'button' | 'icon'
}

export const ShareButton: React.FC<ShareButtonProps> = ({
  title,
  text,
  url = window.location.href,
  className,
  variant = 'button'
}) => {
  const [canShare, setCanShare] = useState(false)

  useEffect(() => {
    setCanShare('share' in navigator)
  }, [])

  const handleShare = useCallback(async () => {
    if ('share' in navigator) {
      try {
        await navigator.share({ title, text, url })
        
        if ('vibrate' in navigator) {
          navigator.vibrate(10)
        }
      } catch (error) {
        // User cancelled or error occurred
        console.log('Share cancelled or failed:', error)
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(`${title}\n${text}\n${url}`)
        // Show toast notification
        alert('Link copied to clipboard!')
      } catch (error) {
        console.error('Failed to copy to clipboard:', error)
      }
    }
  }, [title, text, url])

  if (!canShare && !('clipboard' in navigator)) {
    return null
  }

  if (variant === 'icon') {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={handleShare}
        className={className}
        haptic
      >
        <Share className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <Button
      variant="outline"
      onClick={handleShare}
      className={className}
      haptic
    >
      <Share className="h-4 w-4 mr-2" />
      Share
    </Button>
  )
}

// Emergency notification banner for school emergencies
interface EmergencyBannerProps {
  message: string
  type: 'emergency' | 'alert' | 'info'
  onDismiss?: () => void
  actionButton?: {
    text: string
    action: () => void
  }
}

export const EmergencyBanner: React.FC<EmergencyBannerProps> = ({
  message,
  type,
  onDismiss,
  actionButton
}) => {
  const colors = {
    emergency: 'bg-red-600 text-white',
    alert: 'bg-orange-500 text-white',
    info: 'bg-blue-600 text-white'
  }

  const icons = {
    emergency: <AlertCircle className="h-5 w-5" />,
    alert: <AlertCircle className="h-5 w-5" />,
    info: <Bell className="h-5 w-5" />
  }

  return (
    <div className={cn(
      "fixed top-0 left-0 right-0 z-50 p-3 safe-area-pt animate-slide-down",
      colors[type]
    )}>
      <div className="flex items-center space-x-3 max-w-md mx-auto">
        {icons[type]}
        <p className="flex-1 text-sm font-medium">{message}</p>
        <div className="flex items-center space-x-2">
          {actionButton && (
            <Button
              size="sm"
              variant="ghost"
              onClick={actionButton.action}
              className="text-current border-current hover:bg-white/20"
            >
              {actionButton.text}
            </Button>
          )}
          {onDismiss && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onDismiss}
              className="h-6 w-6 p-0 text-current hover:bg-white/20"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// Quick RFID display for easy scanning
interface QuickRFIDDisplayProps {
  rfidCode: string
  studentName: string
  onCopy?: () => void
}

export const QuickRFIDDisplay: React.FC<QuickRFIDDisplayProps> = ({
  rfidCode,
  studentName,
  onCopy
}) => {
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(rfidCode)
      onCopy?.()
      
      if ('vibrate' in navigator) {
        navigator.vibrate(20)
      }
    } catch (error) {
      console.error('Failed to copy RFID code:', error)
    }
  }, [rfidCode, onCopy])

  return (
    <Card className="mx-4 mb-4 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
      <div className="p-4 text-center">
        <h3 className="font-semibold text-gray-900 mb-1">Your RFID Code</h3>
        <p className="text-sm text-gray-600 mb-3">{studentName}</p>
        
        <div className="bg-white rounded-lg p-4 mb-3 border-2 border-dashed border-blue-300">
          <div className="font-mono text-2xl font-bold text-blue-600 tracking-wider">
            {rfidCode}
          </div>
        </div>
        
        <Button
          size="sm"
          variant="outline"
          onClick={handleCopy}
          className="text-blue-600 border-blue-300"
          haptic
        >
          Copy Code
        </Button>
        
        <p className="text-xs text-gray-500 mt-2">
          Show this code to the scanner during meal pickup
        </p>
      </div>
    </Card>
  )
}