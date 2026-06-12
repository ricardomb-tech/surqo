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
      primary: "bg-surqo-green text-white hover:bg-surqo-green-bright shadow-sm hover:shadow-md",
      secondary: "bg-green-50 text-surqo-green border border-green-200 hover:bg-green-100",
      outline: "border border-slate-200 hover:bg-slate-50 text-surqo-text",
      ghost: "hover:bg-slate-100 text-surqo-text-secondary hover:text-surqo-text",
      glass: "bg-white border border-slate-200 text-surqo-text hover:border-green-200",
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
      "rounded-3xl border border-slate-200 p-6 transition-all duration-300 shadow-sm bg-white",
      className
    )}
    {...props}
  >
    {children}
  </div>
)
