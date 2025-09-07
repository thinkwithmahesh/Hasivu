import React from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  WifiOff,
  RefreshCw,
  Home,
  UtensilsCrossed,
  Wallet,
  Clock,
  AlertCircle,
  Signal
} from 'lucide-react'

// Offline meal data that would be cached
const offlineMealData = [
  {
    id: 'offline-1',
    name: 'Today\'s Special Thali',
    price: 45,
    category: 'Main Course',
    isVeg: true,
    preparationTime: 15
  },
  {
    id: 'offline-2',
    name: 'Sandwich Combo',
    price: 35,
    category: 'Snacks',
    isVeg: true,
    preparationTime: 10
  },
  {
    id: 'offline-3',
    name: 'Fresh Fruit Bowl',
    price: 25,
    category: 'Healthy',
    isVeg: true,
    preparationTime: 5
  }
]

const OfflinePage: React.FC = () => {
  const [isOnline, setIsOnline] = React.useState(false)
  const [retryCount, setRetryCount] = React.useState(0)

  React.useEffect(() => {
    // Check online status
    setIsOnline(navigator.onLine)

    const handleOnline = () => {
      setIsOnline(true)
      window.location.reload()
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleRetry = () => {
    setRetryCount(prev => prev + 1)
    
    // Simple connectivity check
    fetch('/api/v1/health', { method: 'HEAD' })
      .then(() => {
        window.location.reload()
      })
      .catch(() => {
        // Still offline
        setTimeout(() => {
          setRetryCount(prev => prev + 1)
        }, 1000)
      })
  }

  return (
    <>
      <Head>
        <title>Offline - HASIVU</title>
        <meta name="description" content="You're currently offline. View cached content or wait for connection." />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-40 w-full border-b bg-white/95 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                <UtensilsCrossed className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">HASIVU</h1>
                <p className="text-xs text-muted-foreground">Offline Mode</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge variant={isOnline ? "default" : "destructive"} className="flex items-center space-x-1">
                {isOnline ? (
                  <>
                    <Signal className="h-3 w-3" />
                    <span>Online</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3" />
                    <span>Offline</span>
                  </>
                )}
              </Badge>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Offline Status Card */}
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <WifiOff className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <CardTitle className="text-orange-900">You're Offline</CardTitle>
                    <CardDescription className="text-orange-700">
                      No internet connection detected. You can still browse cached content below.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    onClick={handleRetry}
                    disabled={retryCount > 0}
                    className="flex items-center space-x-2"
                  >
                    <RefreshCw className={cn("h-4 w-4", retryCount > 0 && "animate-spin")} />
                    <span>{retryCount > 0 ? 'Checking...' : 'Try Again'}</span>
                  </Button>
                  
                  <Link href="/" passHref>
                    <Button variant="outline" className="flex items-center space-x-2">
                      <Home className="h-4 w-4" />
                      <span>Go Home</span>
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Available Features */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Cached Meals */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <UtensilsCrossed className="h-5 w-5 text-primary" />
                    <span>Cached Meals</span>
                  </CardTitle>
                  <CardDescription>
                    View previously loaded meals (ordering requires internet)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {offlineMealData.map((meal) => (
                    <div 
                      key={meal.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{meal.name}</h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {meal.isVeg ? '🌱 Veg' : '🍖 Non-Veg'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {meal.preparationTime}m
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-primary">₹{meal.price}</p>
                        <p className="text-xs text-muted-foreground">{meal.category}</p>
                      </div>
                    </div>
                  ))}
                  
                  <div className="pt-2 border-t">
                    <Button variant="outline" disabled className="w-full">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Ordering requires internet connection
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Offline Features */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Wallet className="h-5 w-5 text-green-600" />
                    <span>Available Offline</span>
                  </CardTitle>
                  <CardDescription>
                    Features you can use without internet
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-2 bg-green-50 rounded-lg">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">View cached meal menu</span>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-2 bg-green-50 rounded-lg">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Browse order history</span>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-2 bg-green-50 rounded-lg">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">View account information</span>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-2 bg-yellow-50 rounded-lg">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm">Prepare orders (sync when online)</span>
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t">
                    <div className="text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 inline mr-1" />
                      Offline since: {new Date().toLocaleTimeString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Troubleshooting */}
            <Card>
              <CardHeader>
                <CardTitle>Troubleshooting</CardTitle>
                <CardDescription>
                  Try these steps to restore your connection
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <h4 className="font-medium">Check Your Connection</h4>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Ensure WiFi is enabled</li>
                      <li>• Check mobile data connection</li>
                      <li>• Move to an area with better signal</li>
                      <li>• Restart your router if using WiFi</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">App Issues</h4>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Close and reopen the app</li>
                      <li>• Clear browser cache</li>
                      <li>• Check for app updates</li>
                      <li>• Contact support if problems persist</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>

        {/* Auto-retry indicator */}
        {retryCount > 0 && (
          <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
            <div className="flex items-center space-x-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span className="text-sm">Checking connection... ({retryCount})</span>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default OfflinePage