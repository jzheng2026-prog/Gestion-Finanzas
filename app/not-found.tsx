import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-6">
      <div className="animate-fade-in-up max-w-sm text-center">
        <h1 className="font-display text-3xl font-medium">
          Aquí no hay nada
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Puede que el proyecto se haya eliminado o que el enlace esté mal.
        </p>
        <Link
          href="/dashboard"
          className="mt-8 inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Volver al dashboard
        </Link>
      </div>
    </main>
  )
}
