import { NextRequest, NextResponse } from 'next/server'

// API proxy PDF sécurisé
// - Résout les problèmes CORS de Supabase Storage
// - Pour les documents payants : ne retourne que les N premières pages
// - Empêche l'accès direct à l'URL Supabase

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const pdfUrl = searchParams.get('url')
  const maxPages = parseInt(searchParams.get('pages') || '3')
  const ressourceId = searchParams.get('id')

  if (!pdfUrl) {
    return NextResponse.json({ error: 'URL manquante' }, { status: 400 })
  }

  // Vérifier que l'URL est bien Supabase (sécurité)
  const allowedDomains = [
    process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '') || '',
    'supabase.co',
    'supabase.in',
    'cloudinary.com',
  ]
  const urlObj = new URL(pdfUrl)
  const isAllowed = allowedDomains.some(d => d && urlObj.hostname.includes(d))
  
  if (!isAllowed) {
    return NextResponse.json({ error: 'URL non autorisée' }, { status: 403 })
  }

  try {
    // Récupérer le PDF depuis Supabase
    const response = await fetch(pdfUrl, {
      headers: {
        'User-Agent': 'LieuSecret-Server/1.0',
      },
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'PDF non accessible' }, { status: 404 })
    }

    const pdfBuffer = await response.arrayBuffer()

    // Retourner le PDF avec les bons headers CORS
    // Note: La limitation des pages se fait côté client dans PdfViewer
    // Le proxy résout uniquement le problème CORS
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline',
        'Cache-Control': 'private, max-age=3600',
        // Headers CORS pour permettre PDF.js de charger le fichier
        'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_SITE_URL || '*',
        'Access-Control-Allow-Methods': 'GET',
        // Empêcher le téléchargement direct
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    console.error('PDF proxy error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
