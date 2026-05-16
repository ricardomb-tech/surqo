"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "glass"
  size?: "sm" | "md" | "lg" | "icon"
  asChild?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", asChild = false, children, ...props }, ref) => {
    const variants = {
      primary: "bg-surqo-green text-white shadow-glow-sm hover:shadow-glow-md hover:bg-surqo-green-bright",
      secondary: "bg-surqo-green/10 text-surqo-green-bright border border-surqo-green/10 hover:bg-surqo-green/20 dark:border-surqo-green/20",
      outline: "border border-black/[0.08] dark:border-white/10 hover:bg-black/[0.03] dark:hover:bg-white/5 text-surqo-text",
      ghost: "hover:bg-black/[0.04] dark:hover:bg-white/5 text-surqo-text-secondary hover:text-surqo-text",
      glass: "glass glass-hover text-surqo-text border-black/[0.05] dark:border-white/10",
    }

    const sizes = {
      sm: "px-3 py-1.5 text-xs",
      md: "px-5 py-2.5 text-sm",
      lg: "px-8 py-3.5 text-base",
      icon: "p-2.5",
    }

    const classes = cn(
      "inline-flex items-center justify-center rounded-xl font-bold transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:pointer-events-none",
      variants[variant],
      sizes[size],
      className
    )

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement, {
        ...props,
        className: cn(classes, (children as React.ReactElement).props.className),
        ref,
      })
    }

    return (
      <button
        ref={ref}
        className={classes}
        {...props}
      >
        {children}
      </button>
    )
  }
)
Button.displayName = "Button"

export const Card = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "glass rounded-3xl border border-black/[0.05] dark:border-white/10 p-6 transition-all duration-500 shadow-sm dark:shadow-none bg-white/60 dark:bg-white/5",
      className
    )}
    {...props}
  >
    {children}
  </div>
)
