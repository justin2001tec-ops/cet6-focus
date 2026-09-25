import { forwardRef, type ButtonHTMLAttributes, type Ref } from 'react'
import { Volume2 } from 'lucide-react'
import { GlassSurface } from './GlassSurface'
import type { GlassVariant } from './glassTokens'

type GlassButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children' | 'onPointerMove' | 'onPointerEnter' | 'onPointerLeave' | 'onPointerDown' | 'onPointerUp' | 'onPointerCancel'> & {
  children?: React.ReactNode
  className?: string
  variant?: GlassVariant
}

export const GlassIconButton = forwardRef<HTMLButtonElement, GlassButtonProps & { label: string }>(function GlassIconButton({ label, variant = 'clear', className = '', children, type = 'button', ...props }, ref) {
  return (
    <GlassSurface
      {...props}
      ref={ref as unknown as Ref<HTMLElement>}
      as="button"
      type={type}
      variant={variant}
      interactive
      aria-label={label}
      title={label}
      className={`glass-icon-button ${className}`}
    >
      {children}
    </GlassSurface>
  )
})

export function GlassAudioControl({ onClick, label = '播放发音', className = '', variant = 'clear' }: { onClick: () => void; label?: string; className?: string; variant?: GlassVariant }) {
  return (
    <GlassSurface as="button" type="button" variant={variant} interactive className={`glass-audio-control audio-button ${className}`} onClick={onClick} aria-label={label} title={label}>
      <Volume2 size={17} aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </GlassSurface>
  )
}

export const TintedGlassPrimaryAction = forwardRef<HTMLButtonElement, Omit<GlassButtonProps, 'variant'>>(function TintedGlassPrimaryAction({ className = '', children, type = 'button', ...props }, ref) {
  return (
    <GlassSurface
      {...props}
      ref={ref as unknown as Ref<HTMLElement>}
      as="button"
      type={type}
      variant="regular"
      interactive
      data-primary-action="true"
      className={`tinted-glass-primary button button--primary learning-stage-actions__primary ${className}`}
    >
      {children}
    </GlassSurface>
  )
})
