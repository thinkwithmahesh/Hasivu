import { useState, useEffect, useCallback, useRef } from 'react'
// Touch optimization hook with haptic feedback and gesture support
const defaultConfig: TouchOptimizationConfig = {}
export const useTouchOptimization = (
  elementRef: React.RefObject<HTMLElement>,
  handlers: TouchGestureHandlers = {},
  config: Partial<TouchOptimizationConfig> = {}
  const fullConfig = { ...defaultConfig, ...config }
  const [isPressed, setIsPressed] = useState(false)
  const [touchCount, setTouchCount] = useState(0)
  const touchState = useRef({}
  // Haptic feedback utility
  const triggerHaptic = useCallback((pattern: number | number[] = 10
  }, [fullConfig.hapticFeedback])
  // Calculate distance between two touches
  const getDistance = useCallback((touch1: Touch, touch2: Touch
  }, [])
  // Calculate angle between two touches
  const getAngle = useCallback((touch1: Touch, touch2: Touch
  }, [])
  // Handle touch start
  const handleTouchStart = useCallback((e: TouchEvent
  // Start long press timer
    if (handlers.onLongPress && e.touches.length === 1) {}
      }, fullConfig.longPressDelay)
  // Prevent zoom if configured
    if (fullConfig.preventZoom && e.touches.length > 1) {}
  }, [handlers.onLongPress, fullConfig.longPressDelay, fullConfig.preventZoom, triggerHaptic, getDistance, getAngle])
  // Handle touch move
  const handleTouchMove = useCallback((e: TouchEvent
    touchState.current.lastMoveTime = now
  // Handle pinch gesture
    if (e.touches.length === 2 && handlers.onPinch) {}
    // Handle rotation gesture
    if (e.touches.length === 2 && handlers.onRotate) {}
  // Cancel long press on move
    if (touchState.current.longPressTimer) {}
  }, [fullConfig.touchDebounce, handlers.onPinch, handlers.onRotate, getDistance, getAngle])
  // Handle touch end
  const handleTouchEnd = useCallback((e: TouchEvent
    if (!touchState.current.startTouch) return
    const deltaX = touch.clientX - touchState.current.startTouch.clientX
    const deltaY = touch.clientY - touchState.current.startTouch.clientY
    const deltaTime = now - touchState.current.startTime
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
  // Handle tap gestures
    if (distance < 10 && deltaTime < 300) {}
  // Single tap
      touchState.current.lastTap = now
      setTimeout((
      }, fullConfig.doubleTapDelay)
      return
  // Handle swipe gestures
    if (distance > fullConfig.swipeThreshold) {}
  }, [handlers, fullConfig.doubleTapDelay, fullConfig.swipeThreshold, triggerHaptic])
  // Attach event listeners
  useEffect((
    const options = { passive: false }
    element.addEventListener('touchstart', handleTouchStart, options)
    element.addEventListener('touchmove', handleTouchMove, options)
    element.addEventListener('touchend', handleTouchEnd, options)
    element.addEventListener('touchcancel', handleTouchEnd, options)
    return (
  }, [elementRef, handleTouchStart, handleTouchMove, handleTouchEnd])
  return {}
  // Hook for managing touch interactions with visual feedback
// TODO: Refactor this function - it may be too long
export const useTouchFeedback = (
  const [pressPosition, setPressPosition] = useState({ x: 0, y: 0 })
  const pressTimer = useRef<NodeJS.Timeout | null>(null)
  const handleTouchStart = useCallback((e: React.TouchEvent | React.MouseEvent
    setIsPressed(true)
  // Auto release after timeout
    pressTimer.current = setTimeout((
    }, 200)
  }, [])
  const handleTouchEnd = useCallback((
  // Delayed release for visual feedback
    setTimeout(() => setIsPressed(false), 100)
  }, [])
  useEffect((
  }, [])
  return {}
  // Hook for scroll optimization on mobile
export const useScrollOptimization = (
  elementRef: React.RefObject<HTMLElement>,
  options: {}
  const { momentum = true, overscroll = 'auto', direction = 'vertical' } = options
  useEffect((
  // Smooth scrolling
    element.style.scrollBehavior = 'smooth'
    return (
  }, [elementRef, momentum, overscroll, direction])
  // Hook for managing focus states on touch devices
export const useTouchFocus = (
    detectTouch()
    const handleTouchStart = () => setLastInteraction('touch')
    const handleMouseDown = () => setLastInteraction('mouse')
    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('mousedown', handleMouseDown)
    return (
  }, [])
  // CSS class to apply focus styles only for keyboard navigation
  const focusVisibleClass = lastInteraction === 'mouse' ? 'focus-visible:ring-0 focus-visible:ring-offset-0' : ''
  return {}
export default useTouchOptimization