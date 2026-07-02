'use client'
import { useState, useEffect, useRef } from 'react'
import { Send, MessageSquare } from 'lucide-react'

interface Conversation {
  eleve_id: string; prenom: string; nom: string; email: string
  dernier_message: string; dernier_at: string; nb_non_lus: number
}
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

export default function AdminEleveMessages() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selected, setSelected] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [contenu, setContenu] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { loadConversations() }, [])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function loadConversations() {
    setLoading(true)
    const data = await fetch('/api/admin/eleve-messages').then(r => r.json())
    setConversations(Array.isArray(data) ? data.sort((a: Conversation, b: Conversation) => new Date(b.dernier_at).getTime() - new Date(a.dernier_at).getTime()) : [])
    setLoading(false)
  }

  async function openConversation(conv: Conversation) {
    setSelected(conv)
    const data = await fetch(`/api/admin/eleve-messages?eleve_id=${conv.eleve_id}`).then(r => r.json())
    setMessages(Array.isArray(data) ? data : [])
    // Mettre à jour le nb_non_lus localement
    setConversations(prev => prev.map(c => c.eleve_id === conv.eleve_id ? { ...c, nb_non_lus: 0 } : c))
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!contenu.trim() || !selected || sending) return
    setSending(true)
    try {
      const res = await fetch('/api/admin/eleve-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eleve_id: selected.eleve_id, contenu }),
      })
      if (res.ok) {
        const msg = await res.json()
        setMessages(prev => [...prev, msg])
        setContenu('')
        setConversations(prev => prev.map(c => c.eleve_id === selected.eleve_id ? { ...c, dernier_message: contenu, dernier_at: new Date().toISOString() } : c))
      }
    } finally { setSending(false) }
  }

  const totalNonLus = conversations.reduce((s, c) => s + c.nb_non_lus, 0)

  return (
    <div className="flex overflow-hidden" style={{height: "calc(100vh)"}}>
      {/* Liste des conversations */}
      <div className={`${selected ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 border-r border-noir-800 bg-noir-950`}>
        <div className="px-4 py-4 border-b border-noir-800 shrink-0">
          <div className="flex items-center justify-between">
            <h1 className="text-white font-serif text-lg">Messages élèves</h1>
            {totalNonLus > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{totalNonLus}</span>}
          </div>
          <p className="text-noir-500 text-xs mt-0.5">{conversations.length} conversation{conversations.length > 1 ? 's' : ''}</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12"><div className="w-6 h-6 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-12 px-4">
              <MessageSquare size={32} className="text-noir-700 mx-auto mb-3" />
              <p className="text-noir-500 text-sm">Aucun message reçu</p>
            </div>
          ) : conversations.map(conv => (
            <button key={conv.eleve_id} onClick={() => openConversation(conv)}
              className={`w-full text-left px-4 py-3 border-b border-noir-800/50 hover:bg-noir-800/40 transition-colors ${selected?.eleve_id === conv.eleve_id ? 'bg-noir-800/60' : ''}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gold-500/20 border border-gold-500/30 flex items-center justify-center shrink-0 text-sm font-bold text-gold-400">
                  {conv.prenom[0]}{conv.nom[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm font-medium truncate ${conv.nb_non_lus > 0 ? 'text-white' : 'text-noir-300'}`}>
                      {conv.prenom} {conv.nom}
                    </p>
                    <span className="text-[10px] text-noir-600 shrink-0">{formatTime(conv.dernier_at)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <p className="text-xs text-noir-500 truncate">{conv.dernier_message}</p>
                    {conv.nb_non_lus > 0 && (
                      <span className="w-5 h-5 bg-gold-500 text-noir-950 text-[10px] font-bold rounded-full flex items-center justify-center shrink-0">{conv.nb_non_lus}</span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Conversation */}
      {selected ? (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="px-4 py-3 border-b border-noir-800 bg-noir-900/50 shrink-0 flex items-center gap-3">
            <button onClick={() => setSelected(null)} className="md:hidden text-noir-400 hover:text-white p-1">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <div className="w-9 h-9 rounded-full bg-gold-500/20 border border-gold-500/30 flex items-center justify-center shrink-0 text-sm font-bold text-gold-400">
              {selected.prenom[0]}{selected.nom[0]}
            </div>
            <div>
              <p className="text-white font-semibold text-sm">{selected.prenom} {selected.nom}</p>
              <p className="text-noir-500 text-xs">{selected.email}</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.map((msg, i) => {
              const isAdmin = msg.expediteur === 'admin'
              const showDate = i === 0 || new Date(msg.created_at).toDateString() !== new Date(messages[i-1].created_at).toDateString()
              return (
                <div key={msg.id}>
                  {showDate && (
                    <div className="flex items-center gap-3 my-4">
                      <div className="flex-1 h-px bg-noir-800" />
                      <span className="text-xs text-noir-600 shrink-0">{new Date(msg.created_at).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long' })}</span>
                      <div className="flex-1 h-px bg-noir-800" />
                    </div>
                  )}
                  <div className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                    <div className="max-w-[75%]">
                      {!isAdmin && <p className="text-xs text-noir-600 mb-1 ml-1">{selected.prenom}</p>}
                      <div className={`rounded-2xl px-4 py-3 ${isAdmin ? 'bg-gold-500 text-noir-950 rounded-br-sm' : 'bg-noir-800 text-white rounded-bl-sm'}`}>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.contenu}</p>
                      </div>
                      <p className={`text-[10px] mt-1 text-noir-600 ${isAdmin ? 'text-right' : ''}`}>{formatTime(msg.created_at)}</p>
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>

          {/* Zone de saisie */}
          <div className="px-4 py-3 border-t border-noir-800 bg-noir-900/50 shrink-0">
            <form onSubmit={handleSend} className="flex items-end gap-3">
              <textarea
                value={contenu}
                onChange={e => setContenu(e.target.value)}
                onKeyDown={e => { const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent); if (e.key === 'Enter' && !e.shiftKey && !isMobile) { e.preventDefault(); handleSend(e as unknown as React.FormEvent) } }}
                placeholder={`Répondre à ${selected.prenom}...`}
                rows={1}
                className="flex-1 input resize-none min-h-[44px] max-h-32 py-3"
                onInput={e => { const t = e.target as HTMLTextAreaElement; t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 128) + 'px' }}
              />
              <button type="submit" disabled={!contenu.trim() || sending}
                className="w-11 h-11 rounded-xl bg-gold-500 hover:bg-gold-400 disabled:opacity-40 flex items-center justify-center transition-all shrink-0">
                {sending ? <span className="w-4 h-4 border-2 border-noir-900 border-t-transparent rounded-full animate-spin" /> : <Send size={16} className="text-noir-950" />}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center">
          <div className="text-center">
            <MessageSquare size={48} className="text-noir-700 mx-auto mb-4" />
            <p className="text-noir-500">Sélectionnez une conversation</p>
          </div>
        </div>
      )}
    </div>
  )
}