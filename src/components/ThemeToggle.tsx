import type { Theme } from "../hooks/useTheme"

interface Props {
  theme: Theme
  onToggle: () => void
  className?: string
}

export default function ThemeToggle({
  theme,
  onToggle,
  className = "",
}: Props) {
  const dark = theme === "dark"
  return (
    <button
      onClick={onToggle}
      title={dark ? "Cambiar a modo día" : "Cambiar a modo noche"}
      aria-label={dark ? "Cambiar a modo día" : "Cambiar a modo noche"}
      className={`w-9 h-9 rounded-lg flex items-center justify-center border border-line bg-surface text-muted hover:text-accent hover:border-line-strong transition-colors ${className}`}
    >
      {dark ? (
        <svg
          className="w-4.5 h-4.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.36 6.36l-.7-.7M6.34 6.34l-.7-.7m12.72 0l-.7.7M6.34 17.66l-.7.7M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        <svg
          className="w-4.5 h-4.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  )
}
