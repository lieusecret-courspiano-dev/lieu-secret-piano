import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getEleveFromSession } from '@/lib/eleve-auth'
import { uploadToCloudinary } from '@/lib/cloudinary'

// POST — upload d'un fichier audio/vidéo vers Cloudinary
export async function POST(req: NextRequest) {
  const eleve = await getEleveFromSession()
  if (!eleve) return NextResponse.json({ error: 'Non connecté' }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 })

    // Vérifier la taille (max 100 MB)
    if (file.size > 100 * 1024 * 1024) {
      return NextResponse.json({ error: 'Fichier trop volumineux (max 100 Mo)' }, { status: 400 })
    }

    // Vérifier le type MIME
    const isAudio = file.type.startsWith('audio/')
    const isVideo = file.type.startsWith('video/')
    if (!isAudio && !isVideo) {
      return NextResponse.json({ error: 'Type de fichier non autorisé. Utilisez audio ou vidéo.' }, { status: 400 })
    }

    // Convertir en Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload vers Cloudinary
    const result = await uploadToCloudinary(buffer, {
      folder:        `lieu-secret/eleves/${eleve.id}`,
      resource_type: 'auto', // Cloudinary détecte automatiquement audio/vidéo
      public_id:     `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    })

    return NextResponse.json({
      url:           result.url,
      public_id:     result.public_id,
      taille_bytes:  result.bytes,
      duree_sec:     result.duration ? Math.round(result.duration) : null,
      type:          isVideo ? 'video' : 'audio',
      storage_path:  result.public_id, // On stocke le public_id pour pouvoir supprimer
    })
  } catch (err: unknown) {
    console.error('Cloudinary upload error:', err)
    const message = err instanceof Error ? err.message : 'Erreur lors de l\'upload'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}