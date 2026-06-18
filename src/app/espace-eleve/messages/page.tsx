'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import EleveLayout from '@/components/EleveNav'
import { Send } from 'lucide-react'

interface Message {
  id: string; expediteur: 'eleve' | 'admin'; contenu: string; lu: boolean; created_at: string
}

function formatTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  if (diffDays === 1) return `Hier ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

export default function MessagesPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [prenom, setPrenom] = useState('')
  const [loading, setLoading] = useState(true)
  const [contenu, setContenu] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/eleve/me').then(r => r.status === 401 ? null : r.json()),
      fetch('/api/eleve/messages').then(r => r.json()),
    ]).then(([me, msgs]) => {
      if (!me) { router.push('/espace-eleve/login'); return }
      setPrenom(me.prenom)
      setMessages(Array.isArray(msgs) ? msgs : [])
    }).finally(() => setLoading(false))
  }, [router])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!contenu.trim() || sending) return
    setSending(true)
    try {
      const res = await fetch('/api/eleve/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contenu }),
      })
      if (res.ok) {
        const msg = await res.json()
        setMessages(prev => [...prev, msg])
        setContenu('')
        textareaRef.current?.focus()
      }
    } finally { setSending(false) }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    // Sur mobile (clavier virtuel), ne pas envoyer avec Entrée
    // Sur desktop uniquement : Entrée = envoyer, Maj+Entrée = saut de ligne
    const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
    if (e.key === 'Enter' && !e.shiftKey && !isMobile) {
      e.preventDefault()
      handleSend(e as unknown as React.FormEvent)
    }
  }

  return (
    <EleveLayout prenom={prenom} nbNotifs={0}>
      <div className="flex flex-col" style={{height: "calc(100vh - 56px)"}}>

        {/* Header */}
        <div className="px-4 md:px-6 py-4 border-b border-noir-800 bg-noir-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gold-500/20 border border-gold-500/30 flex items-center justify-center shrink-0">
              <svg width="18" height="18" fill="none" stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Votre professeur</p>
              <p className="text-noir-500 text-xs">Lieu Secret Piano</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-2xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center mb-4">
                <svg width="28" height="28" fill="none" stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <p className="text-white font-semibold mb-2">Démarrez la conversation</p>
              <p className="text-noir-400 text-sm max-w-xs">Posez une question à votre professeur, partagez vos progrès ou demandez des conseils.</p>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => {
                const isEleve = msg.expediteur === 'eleve'
                const showDate = i === 0 || new Date(msg.created_at).toDateString() !== new Date(messages[i-1].created_at).toDateString()
                return (
                  <div key={msg.id}>
                    {showDate && (
                      <div className="flex items-center gap-3 my-4">
                        <div className="flex-1 h-px bg-noir-800" />
                        <span className="text-xs text-noir-600 shrink-0">
                          {new Date(msg.created_at).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long' })}
                        </span>
                        <div className="flex-1 h-px bg-noir-800" />
                      </div>
                    )}
                    <div className={`flex ${isEleve ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] md:max-w-[65%] ${isEleve ? 'order-2' : 'order-1'}`}>
                        {!isEleve && (
                          <p className="text-xs text-noir-600 mb-1 ml-1">Professeur</p>
                        )}
                        <div className={`rounded-2xl px-4 py-3 ${
                          isEleve
                            ? 'bg-gold-500 text-noir-950 rounded-br-sm'
                            : 'bg-noir-800 text-white rounded-bl-sm'
                        }`}>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.contenu}</p>
                        </div>
                        <p className={`text-[10px] mt-1 ${isEleve ? 'text-right text-noir-600' : 'text-noir-600'}`}>
                          {formatTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </>
          )}
        </div>

        {/* Zone de saisie */}
        <div className="px-4 md:px-6 py-3 border-t border-noir-800 bg-noir-900/50 shrink-0 pb-20 md:pb-3">
          <form onSubmit={handleSend} className="flex items-end gap-3">
            <textarea
              ref={textareaRef}
              value={contenu}
              onChange={e => setContenu(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Écrivez votre message..."
              rows={1}
              className="flex-1 input resize-none min-h-[44px] max-h-32 py-3 leading-relaxed"
              style={{ height: 'auto' }}
              onInput={e => {
                const t = e.target as HTMLTextAreaElement
                t.style.height = 'auto'
                t.style.height = Math.min(t.scrollHeight, 128) + 'px'
              }}
            />
            <button
              type="submit"
              disabled={!contenu.trim() || sending}
              className="w-11 h-11 rounded-xl bg-gold-500 hover:bg-gold-400 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all shrink-0"
            >
              {sending
                ? <span className="w-4 h-4 border-2 border-noir-900 border-t-transparent rounded-full animate-spin" />
                : <Send size={16} className="text-noir-950" />
              }
            </button>
          </form>
          <p className="text-[10px] text-noir-700 mt-1.5 text-center hidden md:block">Entrée pour envoyer · Maj+Entrée pour aller à la ligne</p>
        </div>
      </div>
    </EleveLayout>
  )
}