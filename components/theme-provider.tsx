'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'

// next-themes inserta un <script> que aplica el tema antes de pintar (sin
// parpadeo). En el servidor se emite normal y se ejecuta; en el navegador se
// marca como no ejecutable para que React 19 no avise de que "los scripts
// dentro de componentes no se ejecutan en el cliente" (ya se ejecutó).
const scriptProps =
  typeof window === 'undefined' ? undefined : ({ type: 'application/json' } as const)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      scriptProps={scriptProps}
    >
      {children}
    </NextThemesProvider>
  )
}
