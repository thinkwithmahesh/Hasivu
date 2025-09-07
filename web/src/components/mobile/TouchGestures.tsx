"use client"

import React, { useState, useRef, useCallback, useEffect, ReactNode } from 'react'
import { cn } from '@/lib/utils'

// Touch gesture utilities
interface Touch {
  x: number
  y: number
  time: number
  id: number
}

interface SwipeState {
  startTouch: Touch | null
  currentTouch: Touch | null
  direction: 'left' | 'right' | 'up' | 'down' | null
  distance: number
  velocity: number
  isActive: boolean
}

interface PinchState {
  touches: Touch[]
  scale: number
  initialDistance: number
  center: { x: number; y: number }
  isActive: boolean
}

interface LongPressState {
  touch: Touch | null
  isActive: boolean
  timer: NodeJS.Timeout | null
}

// Swipe Gesture Hook
export const useSwipeGesture = (
  onSwipe?: (direction: 'left' | 'right' | 'up' | 'down', velocity: number) => void,
  options: {
    threshold?: number
    velocityThreshold?: number
    preventScroll?: boolean
  } = {}
) => {
  const {
    threshold = 50,
    velocityThreshold = 0.3,
    preventScroll = false
  } = options

  const [swipeState, setSwipeState] = useState<SwipeState>({
    startTouch: null,
    currentTouch: null,
    direction: null,
    distance: 0,
    velocity: 0,
    isActive: false
  })

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (preventScroll) {
      e.preventDefault()
    }

    const touch = e.touches[0]
    const touchData: Touch = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
      id: touch.identifier
    }

    setSwipeState(prev => ({
      ...prev,
      startTouch: touchData,
      currentTouch: touchData,
      isActive: true,
      direction: null,
      distance: 0,
      velocity: 0
    }))
  }, [preventScroll])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (preventScroll) {
      e.preventDefault()
    }

    const touch = Array.from(e.touches).find(t => t.identifier === swipeState.startTouch?.id)
    if (!touch || !swipeState.startTouch) return

    const currentTouch: Touch = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
      id: touch.identifier
    }

    const deltaX = currentTouch.x - swipeState.startTouch.x
    const deltaY = currentTouch.y - swipeState.startTouch.y
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    
    let direction: 'left' | 'right' | 'up' | 'down' | null = null
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      direction = deltaX > 0 ? 'right' : 'left'
    } else {
      direction = deltaY > 0 ? 'down' : 'up'
    }

    const timeDelta = currentTouch.time - swipeState.startTouch.time
    const velocity = timeDelta > 0 ? distance / timeDelta : 0

    setSwipeState(prev => ({
      ...prev,
      currentTouch,
      direction,
      distance,
      velocity
    }))
  }, [swipeState.startTouch, preventScroll])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!swipeState.startTouch || !swipeState.currentTouch) return

    const { distance, velocity, direction } = swipeState

    if (distance >= threshold && velocity >= velocityThreshold && direction) {
      onSwipe?.(direction, velocity)
      
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(25)
      }
    }

    setSwipeState({
      startTouch: null,
      currentTouch: null,
      direction: null,
      distance: 0,
      velocity: 0,
      isActive: false
    })
  }, [swipeState, threshold, velocityThreshold, onSwipe])

  return {
    swipeState,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd
    }
  }
}

// Pinch Gesture Hook
export const usePinchGesture = (
  onPinch?: (scale: number, center: { x: number; y: number }) => void,
  onPinchEnd?: (finalScale: number) => void,
  options: {
    threshold?: number
  } = {}
) => {
  const { threshold = 0.1 } = options

  const [pinchState, setPinchState] = useState<PinchState>({
    touches: [],
    scale: 1,
    initialDistance: 0,
    center: { x: 0, y: 0 },
    isActive: false
  })

  const getDistance = useCallback((touch1: Touch, touch2: Touch) => {
    const dx = touch1.x - touch2.x
    const dy = touch1.y - touch2.y
    return Math.sqrt(dx * dx + dy * dy)
  }, [])

  const getCenter = useCallback((touch1: Touch, touch2: Touch) => {
    return {
      x: (touch1.x + touch2.x) / 2,
      y: (touch1.y + touch2.y) / 2
    }
  }, [])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const touches = Array.from(e.touches).map(touch => ({
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
        id: touch.identifier
      }))

      const initialDistance = getDistance(touches[0], touches[1])
      const center = getCenter(touches[0], touches[1])

      setPinchState({
        touches,
        scale: 1,
        initialDistance,
        center,
        isActive: true
      })
    }
  }, [getDistance, getCenter])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchState.isActive) {
      const touches = Array.from(e.touches).map(touch => ({
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
        id: touch.identifier
      }))

      const currentDistance = getDistance(touches[0], touches[1])
      const scale = currentDistance / pinchState.initialDistance
      const center = getCenter(touches[0], touches[1])

      if (Math.abs(scale - 1) > threshold) {
        onPinch?.(scale, center)
      }

      setPinchState(prev => ({
        ...prev,
        touches,
        scale,
        center
      }))
    }
  }, [pinchState.isActive, pinchState.initialDistance, getDistance, getCenter, threshold, onPinch])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (e.touches.length < 2 && pinchState.isActive) {
      onPinchEnd?.(pinchState.scale)
      
      setPinchState({
        touches: [],
        scale: 1,
        initialDistance: 0,
        center: { x: 0, y: 0 },
        isActive: false
      })
    }
  }, [pinchState.isActive, pinchState.scale, onPinchEnd])

  return {
    pinchState,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd
    }
  }
}

// Long Press Hook
export const useLongPress = (
  onLongPress?: (touch: Touch) => void,
  options: {
    delay?: number
    moveTolerance?: number
  } = {}
) => {
  const {
    delay = 500,
    moveTolerance = 10
  } = options

  const [longPressState, setLongPressState] = useState<LongPressState>({
    touch: null,
    isActive: false,
    timer: null
  })

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    const touchData: Touch = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
      id: touch.identifier
    }

    const timer = setTimeout(() => {
      onLongPress?.(touchData)
      
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate([50, 50, 50])
      }

      setLongPressState(prev => ({
        ...prev,
        isActive: true
      }))
    }, delay)

    setLongPressState({
      touch: touchData,
      isActive: false,
      timer
    })
  }, [delay, onLongPress])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!longPressState.touch) return

    const touch = Array.from(e.touches).find(t => t.identifier === longPressState.touch?.id)
    if (!touch) return

    const deltaX = touch.clientX - longPressState.touch.x
    const deltaY = touch.clientY - longPressState.touch.y
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

    if (distance > moveTolerance && longPressState.timer) {
      clearTimeout(longPressState.timer)
      setLongPressState({
        touch: null,
        isActive: false,
        timer: null
      })
    }
  }, [longPressState.touch, longPressState.timer, moveTolerance])

  const handleTouchEnd = useCallback(() => {
    if (longPressState.timer) {
      clearTimeout(longPressState.timer)
    }

    setLongPressState({
      touch: null,
      isActive: false,
      timer: null
    })
  }, [longPressState.timer])

  return {
    longPressState,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd
    }
  }
}

// Swipeable Card Component
interface SwipeableCardProps {
  children: ReactNode
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  className?: string
  swipeThreshold?: number
  disabled?: boolean
}

export const SwipeableCard: React.FC<SwipeableCardProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  className,
  swipeThreshold = 80,
  disabled = false
}) => {
  const [transform, setTransform] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)

  const handleSwipe = useCallback((direction: 'left' | 'right' | 'up' | 'down', velocity: number) => {
    if (disabled) return

    switch (direction) {
      case 'left':
        onSwipeLeft?.()
        break
      case 'right':
        onSwipeRight?.()
        break
      case 'up':
        onSwipeUp?.()
        break
      case 'down':
        onSwipeDown?.()
        break
    }
  }, [disabled, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown])

  const { swipeState, handlers } = useSwipeGesture(handleSwipe, {
    threshold: swipeThreshold,
    velocityThreshold: 0.3
  })

  useEffect(() => {
    if (disabled) return

    if (swipeState.isActive && swipeState.startTouch && swipeState.currentTouch) {
      const deltaX = swipeState.currentTouch.x - swipeState.startTouch.x
      const deltaY = swipeState.currentTouch.y - swipeState.startTouch.y
      
      setTransform({ x: deltaX * 0.3, y: deltaY * 0.3 })
      setIsDragging(true)
    } else {
      setTransform({ x: 0, y: 0 })
      setIsDragging(false)
    }
  }, [swipeState, disabled])

  return (
    <div
      className={cn(
        "transition-transform duration-200 ease-out",
        isDragging && "transition-none",
        className
      )}
      style={{
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }}
      {...handlers}
    >
      {children}
    </div>
  )
}

// Pull to Refresh Component
interface PullToRefreshProps {
  onRefresh: () => Promise<void>
  children: ReactNode
  className?: string
  threshold?: number
  disabled?: boolean
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  className,
  threshold = 80,
  disabled = false
}) => {
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [canRefresh, setCanRefresh] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleSwipe = useCallback(async (direction: 'down', velocity: number) => {
    if (disabled || direction !== 'down' || !canRefresh) return

    setIsRefreshing(true)
    
    try {
      await onRefresh()
    } finally {
      setIsRefreshing(false)
      setPullDistance(0)
      setCanRefresh(false)
    }
  }, [disabled, onRefresh, canRefresh])

  const { swipeState, handlers } = useSwipeGesture(handleSwipe, {
    threshold,
    velocityThreshold: 0.2,
    preventScroll: true
  })

  useEffect(() => {
    if (disabled) return

    const container = containerRef.current
    if (!container) return

    const isAtTop = container.scrollTop === 0

    if (swipeState.isActive && swipeState.direction === 'down' && isAtTop) {
      const distance = Math.min(swipeState.distance, threshold * 1.5)
      setPullDistance(distance)
      setCanRefresh(distance >= threshold)
    } else if (!swipeState.isActive) {
      if (!isRefreshing) {
        setPullDistance(0)
        setCanRefresh(false)
      }
    }
  }, [swipeState, threshold, disabled, isRefreshing])

  const refreshIndicatorOpacity = Math.min(pullDistance / threshold, 1)
  const refreshIndicatorScale = Math.min(pullDistance / threshold, 1)

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Pull to refresh indicator */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-center z-10 pointer-events-none"
        style={{
          height: pullDistance,
          opacity: refreshIndicatorOpacity,
          transform: `scale(${refreshIndicatorScale})`
        }}
      >
        <div className="flex items-center space-x-2 text-blue-600">
          <div className={cn(
            "w-6 h-6 border-2 border-blue-600 rounded-full",
            isRefreshing && "animate-spin border-t-transparent"
          )} />
          <span className="text-sm font-medium">
            {isRefreshing ? 'Refreshing...' : canRefresh ? 'Release to refresh' : 'Pull to refresh'}
          </span>
        </div>
      </div>

      {/* Content container */}
      <div
        ref={containerRef}
        className="overflow-auto"
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: swipeState.isActive ? 'none' : 'transform 0.2s ease-out'
        }}
        {...handlers}
      >
        {children}
      </div>
    </div>
  )
}

// Pinch to Zoom Image Component
interface PinchZoomImageProps {
  src: string
  alt: string
  className?: string
  maxScale?: number
  minScale?: number
}

export const PinchZoomImage: React.FC<PinchZoomImageProps> = ({
  src,
  alt,
  className,
  maxScale = 3,
  minScale = 1
}) => {
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handlePinch = useCallback((newScale: number, center: { x: number; y: number }) => {
    const constrainedScale = Math.max(minScale, Math.min(maxScale, newScale))
    setScale(constrainedScale)
  }, [maxScale, minScale])

  const handlePinchEnd = useCallback((finalScale: number) => {
    const constrainedScale = Math.max(minScale, Math.min(maxScale, finalScale))
    setScale(constrainedScale)
    
    if (constrainedScale === minScale) {
      setPosition({ x: 0, y: 0 })
    }
  }, [maxScale, minScale])

  const { pinchState, handlers: pinchHandlers } = usePinchGesture(
    handlePinch,
    handlePinchEnd,
    { threshold: 0.05 }
  )

  // Pan gesture for when zoomed in
  const handleSwipe = useCallback((direction: any, velocity: number) => {
    if (scale <= 1) return

    const container = containerRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    const maxX = (rect.width * (scale - 1)) / 2
    const maxY = (rect.height * (scale - 1)) / 2

    setPosition(prev => ({
      x: Math.max(-maxX, Math.min(maxX, prev.x + (direction === 'right' ? 20 : direction === 'left' ? -20 : 0))),
      y: Math.max(-maxY, Math.min(maxY, prev.y + (direction === 'down' ? 20 : direction === 'up' ? -20 : 0)))
    }))
  }, [scale])

  const { handlers: swipeHandlers } = useSwipeGesture(handleSwipe, {
    threshold: 20,
    velocityThreshold: 0.1
  })

  // Double tap to zoom
  const handleDoubleTap = useCallback(() => {
    if (scale > 1) {
      setScale(1)
      setPosition({ x: 0, y: 0 })
    } else {
      setScale(2)
    }
    
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(50)
    }
  }, [scale])

  const combinedHandlers = {
    onTouchStart: (e: React.TouchEvent) => {
      pinchHandlers.onTouchStart(e)
      if (e.touches.length === 1) {
        swipeHandlers.onTouchStart(e)
      }
    },
    onTouchMove: (e: React.TouchEvent) => {
      pinchHandlers.onTouchMove(e)
      if (e.touches.length === 1 && scale > 1) {
        swipeHandlers.onTouchMove(e)
      }
    },
    onTouchEnd: (e: React.TouchEvent) => {
      pinchHandlers.onTouchEnd(e)
      swipeHandlers.onTouchEnd(e)
    },
    onDoubleClick: handleDoubleTap
  }

  return (
    <div
      ref={containerRef}
      className={cn("overflow-hidden select-none", className)}
      {...combinedHandlers}
    >
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-contain transition-transform duration-200 ease-out"
        style={{
          transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
          transformOrigin: 'center center'
        }}
        draggable={false}
      />
    </div>
  )
}

// Long Press Menu Component
interface LongPressMenuProps {
  children: ReactNode
  menuItems: Array<{
    label: string
    icon?: ReactNode
    onClick: () => void
    variant?: 'default' | 'destructive'
  }>
  className?: string
}

export const LongPressMenu: React.FC<LongPressMenuProps> = ({
  children,
  menuItems,
  className
}) => {
  const [showMenu, setShowMenu] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 })

  const handleLongPress = useCallback((touch: Touch) => {
    setMenuPosition({ x: touch.x, y: touch.y })
    setShowMenu(true)
  }, [])

  const { handlers } = useLongPress(handleLongPress, {
    delay: 500,
    moveTolerance: 10
  })

  const handleMenuItemClick = useCallback((onClick: () => void) => {
    onClick()
    setShowMenu(false)
  }, [])

  useEffect(() => {
    const handleClickOutside = () => setShowMenu(false)
    
    if (showMenu) {
      document.addEventListener('touchstart', handleClickOutside)
      document.addEventListener('click', handleClickOutside)
      
      return () => {
        document.removeEventListener('touchstart', handleClickOutside)
        document.removeEventListener('click', handleClickOutside)
      }
    }
  }, [showMenu])

  return (
    <>
      <div className={className} {...handlers}>
        {children}
      </div>

      {showMenu && (
        <div
          className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-[150px]"
          style={{
            left: Math.min(menuPosition.x, window.innerWidth - 150),
            top: Math.min(menuPosition.y, window.innerHeight - menuItems.length * 40 - 20)
          }}
        >
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => handleMenuItemClick(item.onClick)}
              className={cn(
                "w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-2",
                item.variant === 'destructive' && "text-red-600 hover:bg-red-50"
              )}
            >
              {item.icon && <span className="w-4 h-4">{item.icon}</span>}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </>
  )
}