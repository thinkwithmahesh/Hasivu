"use client"

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { cn } from '@/lib/utils'

interface VirtualScrollListProps<T> {
  items: T[]
  itemHeight: number
  containerHeight: number
  renderItem: (item: T, index: number) => React.ReactNode
  keyExtractor: (item: T, index: number) => string | number
  className?: string
  onEndReached?: () => void
  onEndReachedThreshold?: number
  loading?: boolean
  loadingComponent?: React.ReactNode
  overscan?: number
  emptyComponent?: React.ReactNode
}

interface VisibleRange {
  start: number
  end: number
}

export function VirtualScrollList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  keyExtractor,
  className,
  onEndReached,
  onEndReachedThreshold = 0.8,
  loading = false,
  loadingComponent,
  overscan = 5,
  emptyComponent
}: VirtualScrollListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0)
  const [isScrolling, setIsScrolling] = useState(false)
  const scrollElementRef = useRef<HTMLDivElement>(null)
  const scrollTimeoutRef = useRef<NodeJS.Timeout>()

  // Calculate visible range
  const visibleRange = useMemo((): VisibleRange => {
    const itemCount = items.length
    if (itemCount === 0) {
      return { start: 0, end: 0 }
    }

    const visibleStart = Math.floor(scrollTop / itemHeight)
    const visibleEnd = Math.min(
      visibleStart + Math.ceil(containerHeight / itemHeight),
      itemCount
    )

    // Add overscan
    const start = Math.max(0, visibleStart - overscan)
    const end = Math.min(itemCount, visibleEnd + overscan)

    return { start, end }
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan])

  // Get visible items
  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end)
  }, [items, visibleRange])

  // Handle scroll events
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = event.currentTarget.scrollTop
    setScrollTop(scrollTop)
    setIsScrolling(true)

    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
    }

    // Set new timeout to detect scroll end
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false)
    }, 150)

    // Check if we've reached the end
    if (onEndReached && !loading) {
      const scrollElement = event.currentTarget
      const scrollPercentage = 
        (scrollTop + scrollElement.clientHeight) / scrollElement.scrollHeight

      if (scrollPercentage >= onEndReachedThreshold) {
        onEndReached()
      }
    }
  }, [onEndReached, onEndReachedThreshold, loading])

  // Scroll to specific item
  const scrollToItem = useCallback((index: number, align: 'start' | 'center' | 'end' = 'start') => {
    if (!scrollElementRef.current) return

    let targetScrollTop: number

    switch (align) {
      case 'center':
        targetScrollTop = (index * itemHeight) - (containerHeight / 2) + (itemHeight / 2)
        break
      case 'end':
        targetScrollTop = (index * itemHeight) - containerHeight + itemHeight
        break
      case 'start':
      default:
        targetScrollTop = index * itemHeight
        break
    }

    // Clamp to valid range
    const maxScrollTop = (items.length * itemHeight) - containerHeight
    targetScrollTop = Math.max(0, Math.min(targetScrollTop, maxScrollTop))

    scrollElementRef.current.scrollTo({
      top: targetScrollTop,
      behavior: 'smooth'
    })
  }, [itemHeight, containerHeight, items.length])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [])

  // Calculate total height and offset
  const totalHeight = items.length * itemHeight
  const offsetY = visibleRange.start * itemHeight

  // Handle empty state
  if (items.length === 0 && !loading) {
    return (
      <div 
        className={cn("flex items-center justify-center", className)}
        style={{ height: containerHeight }}
      >
        {emptyComponent || (
          <div className="text-center text-muted-foreground">
            <p>No items to display</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      ref={scrollElementRef}
      className={cn(
        "overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100",
        "touch-manipulation overscroll-behavior-contain",
        className
      )}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      {/* Total height spacer */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {/* Visible items container */}
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item, relativeIndex) => {
            const absoluteIndex = visibleRange.start + relativeIndex
            const key = keyExtractor(item, absoluteIndex)
            
            return (
              <div
                key={key}
                style={{ height: itemHeight }}
                className={cn(
                  "flex-shrink-0",
                  isScrolling && "pointer-events-none" // Disable interactions while scrolling
                )}
              >
                {renderItem(item, absoluteIndex)}
              </div>
            )
          })}
        </div>

        {/* Loading indicator */}
        {loading && (
          <div 
            className="absolute inset-x-0 bottom-0 flex items-center justify-center p-4"
            style={{ transform: `translateY(${totalHeight}px)` }}
          >
            {loadingComponent || (
              <div className="flex items-center space-x-2 text-muted-foreground">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Loading more...</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Hook for managing virtual list state
export const useVirtualList = <T,>(
  items: T[],
  dependencies: React.DependencyList = []
) => {
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  const loadMore = useCallback(() => {
    if (loading || !hasMore) return

    setLoading(true)
    // Implement your load more logic here
    // This is typically an async operation
    
    // Example:
    setTimeout(() => {
      setLoading(false)
      // Update hasMore based on your logic
    }, 1000)
  }, [loading, hasMore])

  const scrollToTop = useCallback(() => {
    // This would be implemented by the parent component
    // by passing a ref and calling scrollToItem(0)
  }, [])

  const refresh = useCallback(() => {
    setLoading(true)
    setHasMore(true)
    // Implement refresh logic
    setTimeout(() => {
      setLoading(false)
    }, 1000)
  }, dependencies)

  return {
    loading,
    hasMore,
    loadMore,
    scrollToTop,
    refresh
  }
}

// Performance optimized list item wrapper
export const VirtualListItem = React.memo(({
  children,
  className,
  onClick
}: {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}) => {
  return (
    <div 
      className={cn(
        "w-full touch-manipulation select-none",
        onClick && "cursor-pointer active:scale-[0.98] transition-transform duration-150",
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  )
})

VirtualListItem.displayName = "VirtualListItem"

export default VirtualScrollList