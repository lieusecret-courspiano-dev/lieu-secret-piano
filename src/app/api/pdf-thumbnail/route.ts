import { NextRequest, NextResponse } from 'next/server'

// API pour générer une miniature de la 1ère page d'un PDF
// Utilise un service externe (pdf.co ou screenshot API) ou retourne null
// pour que le frontend utilise le placeholder élégant
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const pdfUrl = searchParams.get('url')
  
  if (!pdfUrl) {
    return NextResponse.json({ error: 'URL manquante' }, { status: 400 })
  }

  // Option 1 : Utiliser l'API Microlink pour générer un screenshot
  // (gratuit jusqu'à 100 req/jour)
  try {
    const microlinkUrl = `https://api.microlink.io/?url=${encodeURIComponent(pdfUrl)}&screenshot=true&meta=false&embed=screenshot.url`
    const res = await fetch(microlinkUrl, { 
      headers: { 'x-api-key': process.env.MICROLINK_API_KEY || '' },
      next: { revalidate: 86400 } // Cache 24h
    })
    
    if (res.ok) {
      const data = await res.json()
      if (data?.data?.screenshot?.url) {
        return NextResponse.json({ thumbnail: data.data.screenshot.url })
      }
    }
  } catch {}

  // Fallback : pas de miniature disponible
  return NextResponse.json({ thumbnail: null })
}
