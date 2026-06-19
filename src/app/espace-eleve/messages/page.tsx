'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import EleveLayout from '@/components/EleveNav'
import { SkeletonCard } from '@/components/eleve/SkeletonCard'

interface Message {
  id: string
  expediteur: 'eleve' | 'admin'
  contenu: string
  lu: boolean
  created_at: string
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'À l\'instant'
  if (mins < 60) return `${mins}min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

export default function MessagesPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [contenu, setContenu] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/eleve/messages')
      .then(r => { if (r.status === 401) { router.push('/espace-eleve/login'); return null } return r.json() })
      .then(d => { if (Array.isArray(d)) setMessages(d.reverse()) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [router])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!contenu.trim() || sending) return
    setSending(true)
    const res = await fetch('/api/eleve/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contenu: contenu.trim() }),
    })
    const data = await res.json()
    if (res.ok) {
      setMessages(prev => [...prev, data])
      setContenu('')
    }
    setSending(false)
  }

  if (loading) return (
    <EleveLayout>
      <div className="p-4 md:p-6 space-y-3">
        {[...Array(5)].map((_, i) => <SkeletonCard key={i} className="h-16" />)}
      </div>
    </EleveLayout>
  )

  return (
    <EleveLayout>
      <div className="flex flex-col h-[calc(100vh-120px)] md:h-[calc(100vh-80px)]">

        {/* Header */}
        <div className="px-4 md:px-6 py-4 border-b border-noir-800 bg-noir-950 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gold-500/10 border border-gold-500/30 flex items-center justify-center">
              <svg width="18" height="18" fill="none" stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Lieu Secret</p>
              <p className="text-noir-500 text-xs">Votre professeur</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-3">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-2xl bg-noir-800 border border-noir-700 flex items-center justify-center mb-4">
                <svg width="28" height="28" fill="none" stroke="#707070" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              </div>
              <p className="text-white font-medium text-sm">Démarrez la conversation</p>
              <p className="text-noir-500 text-xs mt-1">Envoyez un message à votre professeur</p>
            </div>
          ) : (
            messages.map(msg => {
              const isEleve = msg.expediteur === 'eleve'
              return (
                <div key={msg.id} className={`flex ${isEleve ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] md:max-w-[60%] ${isEleve ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                    <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      isEleve
                        ? 'bg-gold-500 text-noir-950 rounded-br-sm'
                        : 'bg-noir-800 text-white rounded-bl-sm border border-noir-700'
                    }`}>
                      {msg.contenu}
                    </div>
                    <span className="text-noir-600 text-xs px-1">{timeAgo(msg.created_at)}</span>
                  </div>
                </div>
              )
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 md:px-6 py-3 border-t border-noir-800 bg-noir-950 shrink-0">
          <form onSubmit={handleSend} className="flex items-end gap-3">
            <textarea
              value={contenu}
              onChange={e => setContenu(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e) } }}
              placeholder="Écrivez votre message..."
              rows={1}
              className="input flex-1 resize-none min-h-[44px] max-h-32 py-3"
              style={{ height: 'auto' }}
            />
            <button type="submit" disabled={!contenu.trim() || sending}
              className="w-11 h-11 rounded-xl bg-gold-500 hover:bg-gold-400 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all shrink-0">
              {sending ? (
                <div className="w-4 h-4 border-2 border-noir-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg width="18" height="18" fill="none" stroke="#030303" strokeWidth="2" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              )}
            </button>
          </form>
        </div>
      </div>
    </EleveLayout>
  )
}