import { type InterviewTemplate } from '@wellpharma/shared'

function formatValue(value: unknown): string {
  if (value === true) return 'Oui'
  if (value === false) return 'Non'
  if (value === null || value === undefined || value === '') return '—'
  return String(value)
}

/** Rendu d'un entretien à partir de son modèle (template JSON). Éditable ou lecture seule. */
export function InterviewForm({
  template,
  answers,
  onChange,
  readOnly,
}: {
  template: InterviewTemplate
  answers: Record<string, unknown>
  onChange: (fieldId: string, value: unknown) => void
  readOnly?: boolean
}) {
  return (
    <div className="stack">
      {template.sections.map((section) => (
        <section key={section.title} className="card stack">
          <h3 className="itw-section-title">{section.title}</h3>
          {section.fields.map((field) => {
            const value = answers[field.id]
            const fieldId = `itw_${field.id}`
            return (
              <div key={field.id} className="field">
                <label htmlFor={fieldId}>
                  {field.label}
                  {field.required ? ' *' : ''}
                </label>
                {field.help ? <span className="muted">{field.help}</span> : null}

                {readOnly ? (
                  <div className="itw-answer">{formatValue(value)}</div>
                ) : field.type === 'textarea' ? (
                  <textarea
                    id={fieldId}
                    className="textarea"
                    value={String(value ?? '')}
                    onChange={(e) => onChange(field.id, e.target.value)}
                  />
                ) : field.type === 'number' ? (
                  <input
                    id={fieldId}
                    className="input"
                    type="number"
                    value={value === null || value === undefined ? '' : String(value)}
                    onChange={(e) => onChange(field.id, e.target.value === '' ? null : Number(e.target.value))}
                  />
                ) : field.type === 'boolean' ? (
                  <label className="itw-check">
                    <input
                      type="checkbox"
                      checked={Boolean(value)}
                      onChange={(e) => onChange(field.id, e.target.checked)}
                    />
                    Oui
                  </label>
                ) : field.type === 'select' ? (
                  <select
                    id={fieldId}
                    className="input"
                    value={String(value ?? '')}
                    onChange={(e) => onChange(field.id, e.target.value)}
                  >
                    <option value="">—</option>
                    {field.options?.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                ) : field.type === 'radio' ? (
                  <div className="itw-radios" role="radiogroup" aria-label={field.label}>
                    {field.options?.map((o) => (
                      <label key={o} className="itw-radio">
                        <input
                          type="radio"
                          name={fieldId}
                          checked={value === o}
                          onChange={() => onChange(field.id, o)}
                        />
                        {o}
                      </label>
                    ))}
                  </div>
                ) : (
                  <input
                    id={fieldId}
                    className="input"
                    type="text"
                    value={String(value ?? '')}
                    onChange={(e) => onChange(field.id, e.target.value)}
                  />
                )}
              </div>
            )
          })}
        </section>
      ))}
    </div>
  )
}
