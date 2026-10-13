import { Link } from 'react-router'

export function Brand() {
  return (
    <Link
      aria-label="MockRelay home"
      className="inline-flex items-center gap-2 text-sm font-semibold tracking-[-0.025em] text-[var(--text-primary)]"
      to="/app"
    >
      <img
        alt=""
        className="h-5 w-auto"
        height="32"
        src="/MockRelayIndigo.svg"
        width="78"
      />
      <span>MockRelay</span>
    </Link>
  )
}
