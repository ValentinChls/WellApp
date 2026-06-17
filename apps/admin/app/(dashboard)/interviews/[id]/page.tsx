'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { getInterviewTemplate } from '@wellpharma/shared'
import { api } from '@/lib/trpc/react'

function formatAnswer(value: unknown): string {
  if (value === true) return 'Oui'
  if (value === false) return 'Non'
  if (value === null || value === undefined || value === '') return '—'
  return String(value)
}

export default function InterviewDetailPage() {
  const params = useParams<{ id: string }>()
  const id = String(params.id)
  const query = api.health.interviews.get.useQuery({ id })
  const data = query.data
  const template = data?.templateCode ? getInterviewTemplate(data.templateCode) : undefined

  return (
    <div className="space-y-6">
      <Link href="/interviews" className="text-sm text-primary hover:underline">
        ← Entretiens
      </Link>

      {query.isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : query.isError || !data ? (
        <p className="text-sm text-destructive" role="alert">
          Entretien introuvable ou accès refusé.
        </p>
      ) : (
        <>
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">
              {template?.label ?? data.type}
            </h1>
            <p className="text-xs text-muted-foreground">Accès tracé (journal d’audit).</p>
          </div>

          {template ? (
            template.sections.map((section) => (
              <section key={section.title} className="rounded-lg border bg-background p-4">
                <h2 className="mb-3 font-medium text-foreground">{section.title}</h2>
                <dl className="space-y-2">
                  {section.fields.map((field) => (
                    <div key={field.id} className="grid grid-cols-[1fr_1fr] gap-3 text-sm">
                      <dt className="text-muted-foreground">{field.label}</dt>
                      <dd className="text-foreground">{formatAnswer(data.answers[field.id])}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            ))
          ) : (
            <pre className="overflow-auto rounded-lg border bg-muted p-4 text-xs">
              {JSON.stringify(data.answers, null, 2)}
            </pre>
          )}
        </>
      )}
    </div>
  )
}
