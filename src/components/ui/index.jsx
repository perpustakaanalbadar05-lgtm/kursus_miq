import React from 'react'
import { cn } from '@/utils'

// Button Component
export function Button({ className, variant = 'primary', size = 'md', children, ...props }) {
  const variants = {
    primary: 'bg-miq-700 hover:bg-miq-600 text-white shadow-lg shadow-miq-700/25 hover:shadow-miq-600/30',
    secondary: 'bg-miq-50 hover:bg-miq-100 text-miq-700 border border-miq-200',
    ghost: 'hover:bg-miq-50 text-miq-700',
    outline: 'border-2 border-miq-700 text-miq-700 hover:bg-miq-700 hover:text-white',
    gold: 'bg-gold-500 hover:bg-gold-600 text-white shadow-lg shadow-gold-500/30',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    dark: 'bg-miq-800 hover:bg-miq-700 text-white',
  }
  const sizes = {
    sm: 'px-3 py-1.5 text-sm rounded-md',
    md: 'px-5 py-2.5 text-sm rounded-lg',
    lg: 'px-7 py-3.5 text-base rounded-xl',
    xl: 'px-9 py-4 text-lg rounded-xl',
    icon: 'p-2 rounded-lg',
  }
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 font-body font-semibold transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

// Card Component
export function Card({ className, children, hover = false, ...props }) {
  return (
    <div
      className={cn(
        'bg-card text-card-foreground rounded-2xl border border-border shadow-sm',
        hover && 'card-hover cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className, children }) {
  return <div className={cn('p-6 pb-0', className)}>{children}</div>
}

export function CardTitle({ className, children }) {
  return <h3 className={cn('font-display text-xl font-semibold text-foreground', className)}>{children}</h3>
}

export function CardContent({ className, children }) {
  return <div className={cn('p-6', className)}>{children}</div>
}

// Input Component
export function Input({ className, label, error, icon, ...props }) {
  return (
    <div className="space-y-1.5">
      {label && <label className="text-sm font-semibold text-foreground">{label}</label>}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {icon}
          </div>
        )}
        <input
          className={cn(
            'w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground',
            'placeholder:text-muted-foreground',
            'focus:outline-none focus:ring-2 focus:ring-miq-500/50 focus:border-miq-500',
            'transition-all duration-200',
            icon && 'pl-10',
            error && 'border-red-400 focus:ring-red-400/50',
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

// Select Component
export function Select({ className, label, error, children, ...props }) {
  return (
    <div className="space-y-1.5">
      {label && <label className="text-sm font-semibold text-foreground">{label}</label>}
      <select
        className={cn(
          'w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground',
          'focus:outline-none focus:ring-2 focus:ring-miq-500/50 focus:border-miq-500',
          'transition-all duration-200',
          error && 'border-red-400',
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

// Textarea Component
export function Textarea({ className, label, error, ...props }) {
  return (
    <div className="space-y-1.5">
      {label && <label className="text-sm font-semibold text-foreground">{label}</label>}
      <textarea
        className={cn(
          'w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground',
          'placeholder:text-muted-foreground resize-none',
          'focus:outline-none focus:ring-2 focus:ring-miq-500/50 focus:border-miq-500',
          'transition-all duration-200',
          error && 'border-red-400',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

// Badge Component
export function Badge({ className, variant = 'default', children }) {
  const variants = {
    default: 'bg-muted text-muted-foreground',
    primary: 'bg-miq-100 text-miq-800 border border-miq-200',
    success: 'badge-valid',
    warning: 'badge-pending',
    danger: 'badge-rejected',
    unpaid: 'badge-unpaid',
    gold: 'bg-gold-100 text-gold-800 border border-gold-200',
  }
  return (
    <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold', variants[variant], className)}>
      {children}
    </span>
  )
}

// Spinner
export function Spinner({ className, size = 'md' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' }
  return (
    <div className={cn('animate-spin rounded-full border-2 border-muted border-t-miq-600', sizes[size], className)} />
  )
}

// Separator
export function Separator({ className, orientation = 'horizontal' }) {
  return (
    <div
      className={cn(
        'bg-border',
        orientation === 'horizontal' ? 'h-px w-full' : 'w-px h-full',
        className
      )}
    />
  )
}

// Stat Card
export function StatCard({ title, value, icon, trend, color = 'green', description }) {
  const colors = {
    green: 'from-miq-700 to-miq-500',
    gold: 'from-gold-600 to-gold-400',
    blue: 'from-blue-700 to-blue-500',
    purple: 'from-purple-700 to-purple-500',
    red: 'from-red-700 to-red-500',
  }
  return (
    <Card className="overflow-hidden">
      <div className={`bg-gradient-to-br ${colors[color]} p-5`}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-white/80 text-sm font-medium">{title}</p>
            <p className="text-white text-3xl font-bold mt-1">{value}</p>
            {description && <p className="text-white/70 text-xs mt-1">{description}</p>}
          </div>
          <div className="bg-white/20 rounded-xl p-3 text-white">
            {icon}
          </div>
        </div>
        {trend !== undefined && (
          <p className={`text-xs mt-3 font-semibold ${trend >= 0 ? 'text-emerald-200' : 'text-red-200'}`}>
            {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}% dari bulan lalu
          </p>
        )}
      </div>
    </Card>
  )
}

// Empty State
export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-muted-foreground mb-4 opacity-50">{icon}</div>
      <h3 className="font-display text-lg font-semibold text-foreground mb-2">{title}</h3>
      {description && <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>}
      {action}
    </div>
  )
}

// Modal
export function Modal({ open, onClose, title, children, className }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={cn('relative bg-card rounded-2xl shadow-2xl border border-border w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto', className)}>
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h2 className="font-display text-xl font-semibold">{title}</h2>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors text-2xl leading-none">&times;</button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

// Alert/Toast placeholder
export function Alert({ type = 'info', children }) {
  const types = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    error: 'bg-red-50 border-red-200 text-red-800',
  }
  return (
    <div className={cn('rounded-xl border px-4 py-3 text-sm font-medium', types[type])}>
      {children}
    </div>
  )
}
