import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { ScreenReaderOnly } from "@/components/accessibility/ScreenReaderOnly"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hasivu-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 touch-manipulation select-none active:scale-[0.98] md:active:scale-100 md:hover:scale-[1.02]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/95 shadow-sm",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/95 shadow-sm",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground active:bg-accent/80 shadow-sm",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-secondary/70 shadow-sm",
        ghost: "hover:bg-accent hover:text-accent-foreground active:bg-accent/80",
        link: "text-primary underline-offset-4 hover:underline active:text-primary/80",
        // HASIVU Brand variants
        hasivu: "bg-hasivu-primary-500 text-white hover:bg-hasivu-primary-600 active:bg-hasivu-primary-700 shadow-md hover:shadow-lg",
        hasivuSecondary: "bg-hasivu-secondary-500 text-white hover:bg-hasivu-secondary-600 active:bg-hasivu-secondary-700 shadow-md hover:shadow-lg",
        hasivuOutline: "border-2 border-hasivu-primary-500 text-hasivu-primary-500 hover:bg-hasivu-primary-50 active:bg-hasivu-primary-100",
        hasivuGhost: "text-hasivu-primary-500 hover:bg-hasivu-primary-50 hover:text-hasivu-primary-600 active:bg-hasivu-primary-100",
        // Role-based HASIVU variants
        admin: "bg-hasivu-role-admin text-white hover:bg-red-700 active:bg-red-800 shadow-md hover:shadow-lg",
        teacher: "bg-hasivu-role-teacher text-white hover:bg-blue-700 active:bg-blue-800 shadow-md hover:shadow-lg",
        parent: "bg-hasivu-role-parent text-white hover:bg-green-700 active:bg-green-800 shadow-md hover:shadow-lg",
        student: "bg-hasivu-role-student text-white hover:bg-amber-600 active:bg-amber-700 shadow-md hover:shadow-lg",
        vendor: "bg-hasivu-role-vendor text-white hover:bg-purple-700 active:bg-purple-800 shadow-md hover:shadow-lg",
        kitchen: "bg-hasivu-role-kitchen text-white hover:bg-orange-600 active:bg-orange-700 shadow-md hover:shadow-lg",
        schoolAdmin: "bg-hasivu-role-schoolAdmin text-white hover:bg-slate-800 active:bg-slate-900 shadow-md hover:shadow-lg",
        // Mobile-optimized variants
        floating: "bg-primary text-primary-foreground shadow-lg hover:shadow-xl active:shadow-md rounded-full",
        fab: "bg-primary text-primary-foreground shadow-lg hover:shadow-xl active:shadow-md rounded-full min-w-[56px] min-h-[56px]",
      },
      size: {
        default: "h-10 px-4 py-2 min-w-touch-target",
        sm: "h-9 rounded-md px-3 min-w-[36px]",
        lg: "h-11 rounded-md px-8 min-w-touch-target",
        icon: "h-10 w-10 min-w-touch-target min-h-touch-target",
        // Mobile-specific sizes
        touch: "h-touch-target w-touch-target min-w-touch-target min-h-touch-target",
        fab: "h-14 w-14 min-w-[56px] min-h-[56px]",
        fabSmall: "h-10 w-10 min-w-[40px] min-h-[40px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  haptic?: boolean
  loading?: boolean
  loadingText?: string
  // Accessibility enhancements
  ariaLabel?: string
  ariaDescribedBy?: string
  srOnlyText?: string
  // Enhanced ARIA support
  pressed?: boolean
  expanded?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    asChild = false, 
    haptic = false, 
    loading = false, 
    loadingText, 
    children, 
    disabled, 
    onClick, 
    ariaLabel,
    ariaDescribedBy,
    srOnlyText,
    pressed,
    expanded,
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : "button"
    const buttonId = React.useId()
    
    // Haptic feedback for mobile devices
    const handleClick = React.useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
      if (haptic && 'vibrate' in navigator) {
        navigator.vibrate(10) // Light haptic feedback
      }
      onClick?.(e)
    }, [haptic, onClick])
    
    // Enhanced accessibility props
    const accessibilityProps = {
      'aria-label': ariaLabel,
      'aria-describedby': ariaDescribedBy,
      'aria-pressed': pressed !== undefined ? pressed : undefined,
      'aria-expanded': expanded !== undefined ? expanded : undefined,
      'aria-busy': loading,
      'aria-disabled': disabled || loading
    }
    
    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size }),
          // Enhanced focus styles for accessibility
          "focus-visible:ring-2 focus-visible:ring-offset-2",
          // High contrast mode support
          "contrast-more:border-2 contrast-more:border-current",
          // Reduced motion support
          "motion-reduce:transition-none motion-reduce:transform-none",
          className
        )}
        ref={ref}
        disabled={disabled || loading}
        onClick={handleClick}
        {...accessibilityProps}
        {...props}
      >
        {/* Screen reader loading announcement */}
        {loading && (
          <ScreenReaderOnly>
            {loadingText || 'Loading...'}
          </ScreenReaderOnly>
        )}
        
        {/* Visual loading indicator */}
        {loading && (
          <div 
            className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"
            aria-hidden="true"
          />
        )}
        
        {/* Button content */}
        <span className={loading ? "ml-2" : ""}>
          {children}
          {srOnlyText && (
            <ScreenReaderOnly>{srOnlyText}</ScreenReaderOnly>
          )}
        </span>
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
