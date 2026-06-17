import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { SLOGAN } from '@wellpharma/ui'
import { WellpharmaLogo } from '../components/WellpharmaLogo'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useAuth } from '../providers/AuthProvider'

export function LoginPage() {
  const navigate = useNavigate()
  const { enterDemo } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) {
        setError('Identifiants invalides. Veuillez réessayer.')
        return
      }
      navigate('/', { replace: true })
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="screen">
      <header className="brand">
        <WellpharmaLogo height={156} />
        <p className="slogan">{SLOGAN}</p>
      </header>

      <form className="card" onSubmit={handleSubmit} noValidate>
        <h2>Connexion</h2>
        <p className="muted">Accédez à votre espace patient.</p>

        <div className="field">
          <label htmlFor="email">Adresse e-mail</label>
          <input
            id="email"
            className="input"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="vous@email.fr"
          />
        </div>

        <div className="field">
          <label htmlFor="password">Mot de passe</label>
          <input
            id="password"
            className="input"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
          />
        </div>

        {error ? (
          <p className="error" role="alert">
            {error}
          </p>
        ) : null}
        {!isSupabaseConfigured ? (
          <p className="muted">Supabase non configuré (renseignez le fichier .env).</p>
        ) : null}

        <button className="btn" type="submit" disabled={loading}>
          {loading ? 'Connexion…' : 'Se connecter'}
        </button>
        <p className="muted">Compte démo : patient.demo@wellpharma.test</p>
        <button type="button" className="btn btn-outline" onClick={() => enterDemo()}>
          Entrer en démo (sans compte)
        </button>
      </form>
    </main>
  )
}
