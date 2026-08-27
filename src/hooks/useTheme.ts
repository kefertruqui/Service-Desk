import { useEffect, useState } from "react"

export type Theme = "light" | "dark"

/**
 * Estado global de tema visual. La aplicación siempre inicia en modo día;
 * el usuario puede alternar a modo noche con el botón sol/luna.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>("light")

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"))

  return { theme, toggleTheme }
}
