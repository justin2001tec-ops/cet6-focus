import { Check, X } from 'lucide-react'

export function Button({ children, variant = 'primary', size = 'md', type = 'button', disabled, onClick, className = '', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'soft'; size?: 'sm' | 'md' | 'lg' }) {
  return <button {...props} type={type} disabled={disabled} onClick={onClick} className={`button button--${variant} button--${size} ${className}`}>{children}</button>
}

export function IconButton({ children, label, variant = 'ghost', className = '', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string; variant?: 'ghost' | 'secondary' | 'danger' }) {
  return <button {...props} type={props.type ?? 'button'} aria-label={label} title={label} className={`icon-button icon-button--${variant} ${className}`}>{children}</button>
}

export function Badge({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'green' | 'amber' | 'rose' | 'blue' }) {
  return <span className={`badge badge--${tone}`}>{children}</span>
}

export function ProgressBar({ value, label }: { value: number; label?: string }) {
  const safe = Math.min(100, Math.max(0, value))
  return <div className="progress-wrap" aria-label={label}><div className="progress-track"><div className="progress-fill" style={{ width: `${safe}%` }} /></div>{label && <span className="progress-label">{label}</span>}</div>
}

export function StatCard({ label, value, caption, tone = 'default' }: { label: string; value: string | number; caption?: string; tone?: 'default' | 'accent' | 'warm' }) {
  return <div className={`stat-card stat-card--${tone}`}><span>{label}</span><strong>{value}</strong>{caption && <small>{caption}</small>}</div>
}

export function Notice({ message, onClose }: { message: string; onClose: () => void }) {
  return <div className="notice" role="status"><span>{message}</span><IconButton label="关闭提示" onClick={onClose}><X size={15} /></IconButton></div>
}

export function CheckMark({ checked }: { checked: boolean }) {
  return checked ? <Check size={15} aria-label="已完成" /> : <span className="check-empty" aria-hidden="true" />
}

export function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><div className="modal" role="dialog" aria-modal="true" aria-label={title}><div className="modal__header"><h2>{title}</h2><IconButton label="关闭" onClick={onClose}><X size={18} /></IconButton></div>{children}</div></div>
}
