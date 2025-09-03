import { cn } from '@/utilities/ui'
import { Slot } from '@radix-ui/react-slot'
import { type VariantProps, cva } from 'class-variance-authority'
import * as React from 'react'
import { Button as CustomButton, type ButtonVariation } from '@/components/Button'

// Map UI button variants to custom button variations
const variantToButtonVariation: Record<string, ButtonVariation> = {
  default: 'liquid-fill',
  destructive: 'liquid-fill',
  ghost: 'liquid-fill',
  link: 'liquid-fill',
  outline: 'liquid-fill',
  secondary: 'liquid-fill',
  cuberto: 'cuberto',
}

// Map UI button sizes to custom button sizes
const sizeToButtonSize: Record<string, 'small' | 'medium' | 'large'> = {
  sm: 'small',
  default: 'medium',
  lg: 'large',
  icon: 'medium',
  clear: 'medium',
}

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
    variants: {
      size: {
        clear: '',
        default: 'h-10 px-4 py-2',
        icon: 'h-10 w-10',
        lg: 'h-11 rounded px-8',
        sm: 'h-9 rounded px-3',
      },
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        ghost: 'hover:bg-card hover:text-accent-foreground',
        link: 'text-primary items-start justify-start underline-offset-4 hover:underline',
        outline: 'border border-border bg-background hover:bg-card hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        cuberto: '', // Custom variant for Cuberto button
      },
    },
  },
)

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  ref?: React.Ref<HTMLButtonElement>
  onClick?: () => void
}

const Button: React.FC<ButtonProps> = ({
  asChild = false,
  className,
  size = 'default',
  variant = 'default',
  ref,
  children,
  onClick,
  type = 'button',
  disabled = false,
  ...props
}) => {
  // If asChild is true, use the original Slot behavior for compatibility
  if (asChild) {
    const Comp = Slot
    return <Comp className={cn(buttonVariants({ className, size, variant }))} ref={ref} {...props} />
  }

  // Use custom Button component
  const buttonVariation = variantToButtonVariation[variant || 'default'] || 'liquid-fill'
  const buttonSize = sizeToButtonSize[size || 'default'] || 'medium'
  
  // Extract text from children (assuming it's a string)
  const text = typeof children === 'string' ? children : 'Button'

  return (
    <CustomButton
      variation={buttonVariation}
      text={text}
      onClick={onClick}
      type={type}
      disabled={disabled}
      size={buttonSize}
      className={cn(buttonVariants({ size, variant }), className)}
      {...props}
    />
  )
}

export { Button, buttonVariants }
