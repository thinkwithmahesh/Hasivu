"use client"

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import { 
  Smartphone, 
  Download, 
  Wifi, 
  WifiOff,
  Bell,
  BellOff,
  Battery,
  Signal,
  Loader2,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Settings,
  Monitor,
  HardDrive,
  Zap,
  Cloud,
  CloudOff
} from 'lucide-react'

// PWA Installation Hook
export const usePWAInstall = () => {
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [installPrompt, setInstallPrompt] = useState<any>(null)
  
  useEffect(() => {
    // Check if already installed
    const checkInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true)
      }
    }
    
    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e)
      setIsInstallable(true)
    }
    
    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setIsInstallable(false)
    }
    
    checkInstalled()
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])
  
  const installApp = useCallback(async () => {
    if (!installPrompt) return false
    
    try {
      const result = await installPrompt.prompt()
      const outcome = await result.userChoice
      
      if (outcome === 'accepted') {
        setIsInstalled(true)
        setIsInstallable(false)
      }
      
      setInstallPrompt(null)
      return outcome === 'accepted'
      
    } catch (error) {
      console.error('PWA installation failed:', error)
      return false
    }
  }, [installPrompt])
  
  return {
    isInstallable,
    isInstalled,
    installApp
  }
}

// Network Status Hook
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [connectionType, setConnectionType] = useState<string>('unknown')
  const [effectiveType, setEffectiveType] = useState<string>('unknown')
  
  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine)
    }
    
    const updateConnectionInfo = () => {
      // @ts-ignore - connection is not in TypeScript definitions
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
      
      if (connection) {
        setConnectionType(connection.type || 'unknown')
        setEffectiveType(connection.effectiveType || 'unknown')
      }
    }
    
    updateConnectionInfo()
    
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)
    
    // @ts-ignore
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
    if (connection) {
      connection.addEventListener('change', updateConnectionInfo)
    }
    
    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
      
      if (connection) {
        connection.removeEventListener('change', updateConnectionInfo)
      }
    }
  }, [])
  
  return {
    isOnline,
    connectionType,
    effectiveType,
    isSlowConnection: effectiveType === 'slow-2g' || effectiveType === '2g'
  }
}

// Push Notifications Hook
export const usePushNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [isSupported, setIsSupported] = useState(false)
  
  useEffect(() => {
    const checkSupport = () => {
      const supported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window
      setIsSupported(supported)
      
      if (supported) {
        setPermission(Notification.permission)
      }
    }
    
    checkSupport()
  }, [])
  
  const requestPermission = useCallback(async () => {
    if (!isSupported) return false
    
    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      return result === 'granted'
    } catch (error) {
      console.error('Notification permission request failed:', error)
      return false
    }
  }, [isSupported])
  
  const subscribeToPush = useCallback(async () => {
    if (!isSupported || permission !== 'granted') return null
    
    try {
      const registration = await navigator.serviceWorker.ready
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      })
      
      setSubscription(subscription)
      
      // Send subscription to server
      await fetch('/api/v1/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscription.toJSON()
        })
      })
      
      return subscription
      
    } catch (error) {
      console.error('Push subscription failed:', error)
      return null
    }
  }, [isSupported, permission])
  
  const unsubscribeFromPush = useCallback(async () => {
    if (!subscription) return false
    
    try {
      await subscription.unsubscribe()
      setSubscription(null)
      
      // Notify server
      await fetch('/api/v1/notifications/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint
        })
      })
      
      return true
      
    } catch (error) {
      console.error('Push unsubscription failed:', error)
      return false
    }
  }, [subscription])
  
  return {
    isSupported,
    permission,
    subscription,
    requestPermission,
    subscribeToPush,
    unsubscribeFromPush
  }
}

// Cache Management Hook
export const useCacheManagement = () => {
  const [cacheSize, setCacheSize] = useState<number>(0)
  const [cacheStatus, setCacheStatus] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  const getCacheInfo = useCallback(async () => {
    setIsLoading(true)
    
    try {
      // Get cache storage estimate
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate()
        setCacheSize(estimate.usage || 0)
      }
      
      // Get cache status from service worker
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const messageChannel = new MessageChannel()
        
        navigator.serviceWorker.controller.postMessage(
          { type: 'GET_CACHE_STATUS' },
          [messageChannel.port2]
        )
        
        messageChannel.port1.onmessage = (event) => {
          setCacheStatus(event.data)
        }
      }
      
    } catch (error) {
      console.error('Failed to get cache info:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])
  
  const clearCache = useCallback(async () => {
    try {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHES' })
      }
      
      // Refresh cache info
      setTimeout(() => {
        getCacheInfo()
      }, 1000)
      
      return true
      
    } catch (error) {
      console.error('Failed to clear cache:', error)
      return false
    }
  }, [getCacheInfo])
  
  useEffect(() => {
    getCacheInfo()
  }, [getCacheInfo])
  
  return {
    cacheSize,
    cacheStatus,
    isLoading,
    getCacheInfo,
    clearCache
  }
}

// Battery Status Hook
export const useBatteryStatus = () => {
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null)
  const [isCharging, setIsCharging] = useState<boolean | null>(null)
  const [isSupported, setIsSupported] = useState(false)
  
  useEffect(() => {
    const getBatteryInfo = async () => {
      try {
        // @ts-ignore - battery API not in TypeScript definitions
        if ('getBattery' in navigator) {
          // @ts-ignore
          const battery = await navigator.getBattery()
          setIsSupported(true)
          
          const updateBatteryInfo = () => {
            setBatteryLevel(battery.level)
            setIsCharging(battery.charging)
          }
          
          updateBatteryInfo()
          
          battery.addEventListener('levelchange', updateBatteryInfo)
          battery.addEventListener('chargingchange', updateBatteryInfo)
          
          return () => {
            battery.removeEventListener('levelchange', updateBatteryInfo)
            battery.removeEventListener('chargingchange', updateBatteryInfo)
          }
        }
      } catch (error) {
        console.warn('Battery API not supported:', error)
      }
    }
    
    getBatteryInfo()
  }, [])
  
  return {
    batteryLevel,
    isCharging,
    isSupported,
    isLowBattery: batteryLevel !== null && batteryLevel < 0.2
  }
}

// PWA Install Prompt Component
interface PWAInstallPromptProps {
  className?: string
}

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({ className }) => {
  const { isInstallable, isInstalled, installApp } = usePWAInstall()
  const [isInstalling, setIsInstalling] = useState(false)
  
  const handleInstall = async () => {
    setIsInstalling(true)
    const success = await installApp()
    setIsInstalling(false)
    
    if (success) {
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100])
      }
    }
  }
  
  if (isInstalled) {
    return (
      <Alert className={cn("border-green-200 bg-green-50", className)}>
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          HASIVU app is installed! You can access it from your home screen.
        </AlertDescription>
      </Alert>
    )
  }
  
  if (!isInstallable) {
    return null
  }
  
  return (
    <Card className={cn("p-4 border-blue-200 bg-blue-50", className)}>
      <div className="flex items-start space-x-3">
        <Smartphone className="h-6 w-6 text-blue-600 mt-1" />
        <div className="flex-1">
          <h3 className="font-semibold text-blue-900 mb-1">
            Install HASIVU App
          </h3>
          <p className="text-sm text-blue-800 mb-3">
            Install the app for faster access, offline ordering, and push notifications.
          </p>
          <Button 
            onClick={handleInstall}
            disabled={isInstalling}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isInstalling ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Install App
          </Button>
        </div>
      </div>
    </Card>
  )
}

// Network Status Indicator
interface NetworkStatusProps {
  className?: string
}

export const NetworkStatus: React.FC<NetworkStatusProps> = ({ className }) => {
  const { isOnline, connectionType, effectiveType, isSlowConnection } = useNetworkStatus()
  
  return (
    <div className={cn("flex items-center space-x-2 p-2 rounded-lg", className, {
      "bg-green-50 text-green-800": isOnline && !isSlowConnection,
      "bg-yellow-50 text-yellow-800": isOnline && isSlowConnection,
      "bg-red-50 text-red-800": !isOnline
    })}>
      {isOnline ? (
        <>
          <Wifi className="h-4 w-4" />
          <span className="text-sm font-medium">
            {isSlowConnection ? 'Slow Connection' : 'Online'}
          </span>
          {effectiveType !== 'unknown' && (
            <Badge variant="outline" className="text-xs">
              {effectiveType.toUpperCase()}
            </Badge>
          )}
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4" />
          <span className="text-sm font-medium">Offline</span>
        </>
      )}
    </div>
  )
}

// Push Notifications Settings
interface PushNotificationSettingsProps {
  className?: string
}

export const PushNotificationSettings: React.FC<PushNotificationSettingsProps> = ({ className }) => {
  const { 
    isSupported, 
    permission, 
    subscription, 
    requestPermission, 
    subscribeToPush, 
    unsubscribeFromPush 
  } = usePushNotifications()
  
  const [isLoading, setIsLoading] = useState(false)
  
  const handleToggleNotifications = async () => {
    setIsLoading(true)
    
    try {
      if (subscription) {
        await unsubscribeFromPush()
      } else {
        if (permission !== 'granted') {
          const granted = await requestPermission()
          if (!granted) {
            setIsLoading(false)
            return
          }
        }
        await subscribeToPush()
      }
    } catch (error) {
      console.error('Notification toggle failed:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  if (!isSupported) {
    return (
      <Alert className={cn("", className)}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Push notifications are not supported in this browser.
        </AlertDescription>
      </Alert>
    )
  }
  
  return (
    <Card className={cn("p-4", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {subscription ? (
            <Bell className="h-5 w-5 text-green-600" />
          ) : (
            <BellOff className="h-5 w-5 text-gray-400" />
          )}
          <div>
            <h3 className="font-semibold">Push Notifications</h3>
            <p className="text-sm text-gray-600">
              {subscription ? 'Enabled' : 'Disabled'}
            </p>
          </div>
        </div>
        
        <Button
          onClick={handleToggleNotifications}
          disabled={isLoading}
          variant={subscription ? "destructive" : "default"}
          size="sm"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : subscription ? (
            "Disable"
          ) : (
            "Enable"
          )}
        </Button>
      </div>
      
      {permission === 'denied' && (
        <Alert className="mt-3">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Notifications are blocked. Please enable them in your browser settings.
          </AlertDescription>
        </Alert>
      )}
    </Card>
  )
}

// Cache Management Component
interface CacheManagementProps {
  className?: string
}

export const CacheManagement: React.FC<CacheManagementProps> = ({ className }) => {
  const { cacheSize, cacheStatus, isLoading, getCacheInfo, clearCache } = useCacheManagement()
  const [isClearing, setIsClearing] = useState(false)
  
  const handleClearCache = async () => {
    setIsClearing(true)
    await clearCache()
    setIsClearing(false)
  }
  
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
  
  return (
    <Card className={cn("p-4", className)}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <HardDrive className="h-5 w-5 text-blue-600" />
            <div>
              <h3 className="font-semibold">Storage & Cache</h3>
              <p className="text-sm text-gray-600">
                {cacheSize > 0 ? formatBytes(cacheSize) : 'Calculating...'}
              </p>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button
              onClick={getCacheInfo}
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
            
            <Button
              onClick={handleClearCache}
              disabled={isClearing}
              variant="destructive"
              size="sm"
            >
              {isClearing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                "Clear"
              )}
            </Button>
          </div>
        </div>
        
        {cacheStatus && (
          <div className="grid grid-cols-2 gap-2 text-xs">
            {Object.entries(cacheStatus.caches).map(([name, count]) => (
              <div key={name} className="flex justify-between p-2 bg-gray-50 rounded">
                <span className="truncate">{name.replace('hasivu-', '')}</span>
                <span className="font-mono">{count}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}

// Battery Status Component
interface BatteryStatusProps {
  className?: string
}

export const BatteryStatus: React.FC<BatteryStatusProps> = ({ className }) => {
  const { batteryLevel, isCharging, isSupported, isLowBattery } = useBatteryStatus()
  
  if (!isSupported) {
    return null
  }
  
  return (
    <div className={cn("flex items-center space-x-2 p-2 rounded-lg", className, {
      "bg-red-50 text-red-800": isLowBattery && !isCharging,
      "bg-yellow-50 text-yellow-800": isLowBattery && isCharging,
      "bg-green-50 text-green-800": !isLowBattery
    })}>
      <Battery className={cn("h-4 w-4", {
        "text-red-600": isLowBattery && !isCharging,
        "text-yellow-600": isCharging,
        "text-green-600": !isLowBattery
      })} />
      
      <span className="text-sm font-medium">
        {batteryLevel !== null ? `${Math.round(batteryLevel * 100)}%` : 'Unknown'}
        {isCharging && ' (Charging)'}
      </span>
      
      {isLowBattery && !isCharging && (
        <Badge variant="destructive" className="text-xs">
          Low Battery
        </Badge>
      )}
    </div>
  )
}

// PWA Status Dashboard
interface PWAStatusDashboardProps {
  className?: string
}

export const PWAStatusDashboard: React.FC<PWAStatusDashboardProps> = ({ className }) => {
  return (
    <div className={cn("space-y-4", className)}>
      <PWAInstallPrompt />
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <NetworkStatus />
        <BatteryStatus />
      </div>
      
      <PushNotificationSettings />
      <CacheManagement />
    </div>
  )
}