'use client'

import { useState, useEffect } from 'react'
import { Mail, MailOpen, Trash2 } from 'lucide-react'

interface Message {
  id: string
  name: string
  email: string
  subject: string | null
  message: string
  is_read: boolean
  created_at: string
}

export default function AdminMessages() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState<Message | null>(null)

  useEffect(() => { fetchMessages() }, [])

  async function fetchMessages() {
    setLoading(true)
    const res  = await fetch('/api/messages')
    const data = await res.json()
    setMessages(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  async function handleRead(msg: Message) {
    if (!msg.is_read) {
      await fetch('/api/messages', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id: msg.id, is_read: true }),
      })
      fetchMessages()
    }
    setSelected(msg)
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer ce message ?')) return
    await fetch(`/api/messages`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id, is_read: true }),
    })
    // Pour la suppression, on utilise une route dédiée si elle existe
    setMessages(m => m.filter(msg => msg.id !== id))
    setSelected(null)
  }

  const unread = messages.filter(m => !m.is_read).length

  return (
    <div className="p-6 md:p-8 pb-24 md:pb-8">
      <div className="mb-6">
        <h1 className="text-2xl font-serif text-white">Messages</h1>
        <p className="text-noir-400 text-sm mt-1">
          {unread > 0 ? <span className="text-gold-400">{unread} non lu{unread > 1 ? 's' : ''}</span> : 'Tous les messages lus'}
          {' '}· {messages.length} au total
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : messages.length === 0 ? (
        <div className="card text-center py-12 text-noir-400">
          <Mail size={40} className="mx-auto mb-3 opacity-30" />
          <p>Aucun message reçu</p>
        </div>
      ) : (
        <div className="space-y-2">
          {messages.map(msg => (
            <div
              key={msg.id}
              onClick={() => handleRead(msg)}
              className={`card cursor-pointer hover:border-gold-500/50 transition-all ${
                !msg.is_read ? 'border-gold-500/30 bg-gold-500/5' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">
                  {msg.is_read
                    ? <MailOpen size={16} className="text-noir-500" />
                    : <Mail size={16} className="text-gold-400" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`font-medium truncate ${msg.is_read ? 'text-noir-300' : 'text-white'}`}>
                      {msg.name}
                    </p>
                    <span className="text-xs text-noir-500 shrink-0">
                      {new Date(msg.created_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <p className="text-noir-400 text-sm truncate">{msg.email}</p>
                  {msg.subject && (
                    <p className={`text-sm truncate mt-0.5 ${msg.is_read ? 'text-noir-500' : 'text-noir-300'}`}>
                      {msg.subject}
                    </p>
                  )}
                  <p className="text-noir-500 text-xs truncate mt-1">{msg.message}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal message */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-noir-900 border border-noir-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-serif text-xl">Message</h2>
              <button onClick={() => setSelected(null)} className="text-noir-400 hover:text-white transition-colors"><svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm border-b border-noir-800 pb-2">
                <span className="text-noir-400">De</span>
                <span className="text-white">{selected.name}</span>
              </div>
              <div className="flex justify-between text-sm border-b border-noir-800 pb-2">
                <span className="text-noir-400">Email</span>
                <a href={`mailto:${selected.email}`} className="text-gold-400 hover:text-gold-300">{selected.email}</a>
              </div>
              {selected.subject && (
                <div className="flex justify-between text-sm border-b border-noir-800 pb-2">
                  <span className="text-noir-400">Sujet</span>
                  <span className="text-white">{selected.subject}</span>
                </div>
              )}
              <div className="flex justify-between text-sm border-b border-noir-800 pb-2">
                <span className="text-noir-400">Date</span>
                <span className="text-white">{new Date(selected.created_at).toLocaleString('fr-FR')}</span>
              </div>
            </div>

            <div className="bg-noir-800 rounded-xl p-4 mb-6">
              <p className="text-noir-200 text-sm leading-relaxed whitespace-pre-wrap">{selected.message}</p>
            </div>

            <div className="flex gap-3">
              <a
                href={`mailto:${selected.email}?subject=Re: ${selected.subject || 'Votre message'}`}
                className="btn-gold flex-1 text-center"
              >
                Répondre par email
              </a>
              <button
                onClick={() => handleDelete(selected.id)}
                className="btn-outline border-red-500/50 text-red-400 hover:bg-red-900/20 flex items-center gap-1"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}