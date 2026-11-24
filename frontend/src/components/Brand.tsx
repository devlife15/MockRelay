import { Link } from 'react-router'

export function Brand() {
  return (
    <Link
      aria-label="MockRelay home"
      className="inline-flex items-center gap-2 text-sm font-semibold tracking-[-0.025em] text-[var(--text-primary)]"
      to="/app"
    >
      <svg aria-hidden="true" className="h-5 w-auto" fill="none" height="32" viewBox="0 0 78 32" width="78">
        <path d="M55.5 0H77.5L58.5 32H36.5L55.5 0Z" fill="var(--brand-tone-strong)" />
        <path d="M35.5 0H51.5L32.5 32H16.5L35.5 0Z" fill="var(--brand-tone-mid)" />
        <path d="M19.5 0H31.5L12.5 32H0.5L19.5 0Z" fill="var(--brand-tone-soft)" />
      </svg>
      <span>MockRelay</span>
    </Link>
  )
}
