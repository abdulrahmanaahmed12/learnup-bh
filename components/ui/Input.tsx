import { cn } from '@/lib/utils'
import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-white/80">{label}</label>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full px-4 py-3 rounded-xl text-white placeholder-white/40 border outline-none transition-all',
            'focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20',
            error ? 'border-red-400' : 'border-white/20',
            className
          )}
          style={{ background: 'rgba(255,255,255,0.07)' }}
          {...props}
        />
        {error && <p className="text-red-400 text-sm">{error}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'
export default Input
