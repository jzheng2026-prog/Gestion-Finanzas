'use client'

import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

export function SignOutButton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" variant="ghost" size="sm" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Cerrar sesión
    </Button>
  )
}