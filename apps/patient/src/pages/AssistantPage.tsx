import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CHATBOT_DISCLAIMER } from '@wellpharma/shared'
import { ScreenHeader } from '../components/ScreenHeader'
import { askChatbot } from '../data/chatbotService'

interface Msg {
  id: number
  role: 'user' | 'bot'
  text: string
  redirect?: boolean
}

const GREETING: Msg = {
  id: 0,
  role: 'bot',
  text:
    'Bonjour ! Je suis l’assistant pratique de votre pharmacie : horaires, services, adresse, coordonnées. ' +
    'Pour toute question de santé, votre pharmacien reste à votre écoute.',
}

export function AssistantPage() {
  const navigate = useNavigate()
  const [messages, setMessages] = useState<Msg[]>([GREETING])
  const [input, setInput] = useState('')
  const [pending, setPending] = useState(false)
  const idRef = useRef(1)

  async function send() {
    const text = input.trim()
    if (!text || pending) return
    setMessages((m) => [...m, { id: idRef.current++, role: 'user', text }])
    setInput('')
    setPending(true)
    try {
      const reply = await askChatbot(text)
      setMessages((m) => [
        ...m,
        { id: idRef.current++, role: 'bot', text: reply.text, redirect: reply.kind === 'redirect' },
      ])
    } catch {
      setMessages((m) => [
        ...m,
        { id: idRef.current++, role: 'bot', text: 'Désolé, une erreur est survenue. Réessayez dans un instant.' },
      ])
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="page chat-screen">
      <ScreenHeader eyebrow="Infos pratiques" title="Assistant" back />
      <p className="muted">Horaires, services, accès… pour votre pharmacie de référence.</p>

      <div className="chat-thread">
        {messages.map((m) => (
          <div key={m.id} className={`bubble bubble-${m.role}`}>
            <p>{m.text}</p>
            {m.redirect ? (
              <div className="bubble-actions">
                <button className="btn btn-sm" onClick={() => navigate('/conseil')}>
                  Demander un conseil
                </button>
                <button className="btn btn-outline btn-sm" onClick={() => navigate('/rendez-vous')}>
                  Prendre rendez-vous
                </button>
              </div>
            ) : null}
          </div>
        ))}
        {pending ? (
          <div className="bubble bubble-bot">
            <p className="muted">…</p>
          </div>
        ) : null}
      </div>

      <form
        className="chat-input"
        onSubmit={(e) => {
          e.preventDefault()
          void send()
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Posez une question pratique…"
          aria-label="Votre message"
          maxLength={500}
        />
        <button className="btn" type="submit" disabled={pending || !input.trim()}>
          Envoyer
        </button>
      </form>

      <p className="chat-disclaimer">{CHATBOT_DISCLAIMER}</p>
    </div>
  )
}
