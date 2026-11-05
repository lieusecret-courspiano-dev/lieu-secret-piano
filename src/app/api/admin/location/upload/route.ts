import { NextRequest, NextResponse } from 'next/server'
import { validateAdminSession } from '@/lib/auth'
import { uploadToCloudinary } from '@/lib/cloudinary'

export async function POST(req: NextRequest) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 })

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Fichier trop volumineux (max 10 Mo)' }, { status: 400 })
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Seules les images sont acceptées.' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const result = await uploadToCloudinary(buffer, {
      folder: 'lieu-secret/location',
      resource_type: 'image',
      public_id: `article-${Date.now()}`,
    })

    return NextResponse.json({ url: result.url })
  } catch (err: unknown) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'Erreur lors de l\'upload' }, { status: 500 })
  }
}