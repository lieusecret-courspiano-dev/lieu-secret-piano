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
  reaction?: string | null
  created_at: string
}

const REACTIONS = [
  { key: 'like', icon: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>, label: 'Super' },
  { key: 'heart', icon: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>, label: 'Merci' },
  { key: 'check', icon: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>, label: 'OK' },
]

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
  const [showReactions, setShowReactions] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/eleve/messages')
      .then(r => { if (r.status === 401) { router.push('/espace-eleve/login'); return null } return r.json() })
      .then(d => { if (Array.isArray(d)) setMessages(d.sort((a: Message, b: Message) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [router])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleReaction(messageId: string, reaction: string) {
    setShowReactions(null)
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, reaction } : m))
    try {
      await fetch('/api/eleve/messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: messageId, reaction }),
      })
    } catch {}
  }

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
      <div className="flex flex-col h-[calc(100dvh-120px)] md:h-[calc(100dvh-80px)]">

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
                    <div className="relative group">
                      <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        isEleve
                          ? 'bg-gold-500 text-noir-950 rounded-br-sm'
                          : 'bg-noir-800 text-white rounded-bl-sm border border-noir-700'
                      }`}>
                        {msg.contenu}
                      </div>
                      {/* Réactions sur les messages du prof */}
                      {!isEleve && (
                        <>
                          <button
                            onClick={() => setShowReactions(showReactions === msg.id ? null : msg.id)}
                            className="absolute -right-7 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-noir-500 hover:text-gold-400 p-1"
                          >
                            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
                          </button>
                          {showReactions === msg.id && (
                            <div className="absolute left-0 -bottom-10 flex gap-1 bg-noir-800 border border-noir-700 rounded-xl p-1.5 shadow-xl z-10">
                              {REACTIONS.map(r => (
                                <button key={r.key} onClick={() => handleReaction(msg.id, r.key)}
                                  className={`p-1.5 rounded-lg transition-colors ${msg.reaction === r.key ? 'bg-gold-500/20 text-gold-400' : 'hover:bg-noir-700 text-noir-300 hover:text-white'}`}
                                  title={r.label}>
                                  {r.icon}
                                </button>
                              ))}
                            </div>
                          )}
                          {msg.reaction && (
                            <div className="mt-0.5">
                              <span className="text-xs bg-noir-800 border border-noir-700 rounded-full px-2 py-0.5 inline-flex items-center gap-1 text-noir-400">
                                {REACTIONS.find(r => r.key === msg.reaction)?.icon}
                                <span className="text-[10px]">{REACTIONS.find(r => r.key === msg.reaction)?.label}</span>
                              </span>
                            </div>
                          )}
                        </>
                      )}
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