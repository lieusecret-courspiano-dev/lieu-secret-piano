'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import EleveLayout from '@/components/EleveNav'

interface Certificat { id: string; numero: string; nom_certificat: string; niveau: string | null; date_obtention: string; commentaire: string | null; verset: string | null; created_at: string }

export default function CertificatsPage() {
  const router = useRouter()
  const [certificats, setCertificats] = useState<Certificat[]>([])
  const [prenom, setPrenom] = useState('')
  const [nom, setNom] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([fetch('/api/eleve/me').then(r => r.status === 401 ? null : r.json()), fetch('/api/eleve/certificats').then(r => r.json())]).then(([me, certs]) => {
      if (!me) { router.push('/espace-eleve/login'); return }
      setPrenom(me.prenom); setNom(me.nom); setCertificats(Array.isArray(certs) ? certs : [])
    }).finally(() => setLoading(false))
  }, [router])

  function downloadPDF(cert: Certificat) {
    import('jspdf').then(({ jsPDF }) => {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
      const W = 297, H = 210
      doc.setFillColor(26, 26, 46); doc.rect(0, 0, W, H, 'F')
      doc.setDrawColor(245, 158, 11); doc.setLineWidth(2); doc.rect(10, 10, W - 20, H - 20)
      doc.setFontSize(10); doc.setTextColor(245, 158, 11); doc.setFont('helvetica', 'bold'); doc.text('LIEU SECRET', W / 2, 30, { align: 'center' })
      doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(160, 160, 192); doc.text('ECOLE DE PIANO EN LIGNE', W / 2, 37, { align: 'center' })
      doc.setFontSize(28); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.text('CERTIFICAT DE REUSSITE', W / 2, 60, { align: 'center' })
      doc.setFontSize(12); doc.setTextColor(160, 160, 192); doc.setFont('helvetica', 'normal'); doc.text('Ce certificat est décerné à', W / 2, 80, { align: 'center' })
      doc.setFontSize(24); doc.setTextColor(245, 158, 11); doc.setFont('helvetica', 'bold'); doc.text(`${prenom} ${nom}`, W / 2, 95, { align: 'center' })
      doc.setFontSize(13); doc.setTextColor(240, 240, 240); doc.setFont('helvetica', 'normal'); doc.text("pour l'obtention du certificat", W / 2, 110, { align: 'center' })
      doc.setFontSize(16); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255); doc.text(`"${cert.nom_certificat}"`, W / 2, 122, { align: 'center' })
      if (cert.niveau) { doc.setFontSize(11); doc.setFont('helvetica', 'normal'); doc.setTextColor(160, 160, 192); doc.text(`Niveau : ${cert.niveau}`, W / 2, 133, { align: 'center' }) }
      doc.setFontSize(10); doc.setTextColor(160, 160, 192); doc.text(`Délivré le ${new Date(cert.date_obtention).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}`, W / 2, 148, { align: 'center' })
      if (cert.verset) { doc.setFontSize(9); doc.setFont('helvetica', 'italic'); doc.setTextColor(120, 120, 160); doc.text(`"${cert.verset}"`, W / 2, 162, { align: 'center', maxWidth: 200 }) }
      doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 80, 120); doc.text(`N° ${cert.numero}`, W / 2, H - 18, { align: 'center' })
      doc.save(`certificat-${cert.numero}.pdf`)
    })
  }

  if (loading) return <div className="min-h-screen bg-noir-950 flex items-center justify-center"><div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <EleveLayout prenom={prenom} nbNotifs={0}>
      <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
        <h1 className="font-serif text-2xl text-white mb-6 animate-fade-in-up">Mes Certificats</h1>
        {certificats.length === 0 ? <div className="card text-center py-12"><svg className="mx-auto mb-4 text-gold-400" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg><p className="text-noir-400">Vos certificats apparaîtront ici au fur et à mesure de votre progression.</p></div> : (
          <div className="grid md:grid-cols-2 gap-4">{certificats.map(cert => (<div key={cert.id} className="card border-gold-500/30 relative overflow-hidden"><div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-gold-500 to-transparent" /><div className="flex items-start justify-between mb-3"><svg width="24" height="24" fill="none" stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg><span className="font-mono text-xs text-noir-500">{cert.numero}</span></div><h3 className="font-serif text-xl text-white mb-1">{cert.nom_certificat}</h3>{cert.niveau && <p className="text-gold-400 text-sm mb-2">Niveau : {cert.niveau}</p>}<p className="text-noir-400 text-xs mb-3">Obtenu le {new Date(cert.date_obtention).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>{cert.commentaire && <p className="text-noir-300 text-sm italic mb-3">&quot;{cert.commentaire}&quot;</p>}<button onClick={() => downloadPDF(cert)} className="btn-outline text-sm flex items-center gap-2"><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>Télécharger PDF</button></div>))}</div>
        )}
      </div>
    </EleveLayout>
  )
}
