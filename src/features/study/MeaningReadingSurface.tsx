import type { HTMLAttributes, ReactNode } from 'react'
import { ReadingSurface } from '@/design-system/components'

export function MeaningReadingSurface({ children, className = '', ...props }: HTMLAttributes<HTMLElement> & { children: ReactNode; className?: string }) {
  return <ReadingSurface {...props} tone="learning" data-content-layer="reading" className={`learning-reading-surface meaning-reading-surface ${className}`}>{children}</ReadingSurface>
}
