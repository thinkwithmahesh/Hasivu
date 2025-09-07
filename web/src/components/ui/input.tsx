import * as React from "react"

import { cn } from "@/lib/utils"
import { ScreenReaderOnly } from "@/components/accessibility/ScreenReaderOnly"

interface InputProps extends React.ComponentProps<"input"> {
  error?: string
  helpText?: string
  label?: string
  required?: boolean
  showRequiredIndicator?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, helpText, label, required, showRequiredIndicator = true, ...props }, ref) => {
    const inputId = React.useId()
    const errorId = `${inputId}-error`
    const helpId = `${inputId}-help`
    
    // Ensure minimum 16px font size on mobile to prevent zoom
    const mobileTextSize = type === 'email' || type === 'tel' || type === 'url' ? 'text-base' : 'text-base md:text-sm'
    
    const describedBy = [
      error ? errorId : null,
      helpText ? helpId : null
    ].filter(Boolean).join(' ') || undefined
    
    return (
      <div className="space-y-1">
        {label && (
          <label 
            htmlFor={inputId}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {label}
            {required && showRequiredIndicator && (
              <>
                <span className="text-destructive ml-1" aria-hidden="true">*</span>
                <ScreenReaderOnly>(required)</ScreenReaderOnly>
              </>
            )}
          </label>
        )}
        
        <input
          id={inputId}
          type={type}
          className={cn(
            "flex h-10 w-full rounded-md border bg-background px-3 py-2 ring-offset-background",
            "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
            "placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            // Mobile optimization
            mobileTextSize,
            "touch-manipulation",
            // Error state styling
            error 
              ? "border-destructive focus-visible:ring-destructive" 
              : "border-input",
            // High contrast support
            "contrast-more:border-2",
            // Reduced motion support
            "motion-reduce:transition-none",
            className
          )}
          ref={ref}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={describedBy}
          aria-required={required}
          {...props}
        />
        
        {/* Help text */}
        {helpText && (
          <p id={helpId} className="text-sm text-muted-foreground">
            {helpText}
          </p>
        )}
        
        {/* Error message */}
        {error && (
          <p 
            id={errorId} 
            className="text-sm font-medium text-destructive"
            role="alert"
            aria-live="polite"
          >
            {error}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
