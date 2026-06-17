'use client'

import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from './button'

/** État d'erreur réutilisable avec une vraie action de récupération. */
export function RetryState({
  message = 'Le chargement a échoué.',
  onRetry,
}: {
  message?: string
  onRetry: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-8 text-center">
      <AlertTriangle className="h-6 w-6 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{message}</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RefreshCw className="mr-1.5 h-4 w-4" /> Réessayer
      </Button>
    </div>
  )
}
