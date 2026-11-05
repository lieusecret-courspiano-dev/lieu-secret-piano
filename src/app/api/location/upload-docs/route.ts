import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { uploadToCloudinary } from '@/lib/cloudinary'

export async function POST(req: NextRequest) {
  try {
    const formData     = await req.formData()
    const file         = formData.get('file') as File | null
    const reservationId = formData.get('reservation_id') as string
    const type         = formData.get('type') as string

    if (!file || !reservationId || !type) {
      return NextResponse.json({ error: 'Données manquantes.' }, { status: 400 })
    }

    // Vérifier que la réservation existe
    const { data: resa } = await supabaseAdmin
      .from('location_reservations')
      .select('id')
      .eq('id', reservationId)
      .single()

    if (!resa) {
      return NextResponse.json({ error: 'Réservation introuvable.' }, { status: 404 })
    }

    // Convertir le fichier en buffer
    const bytes  = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload sur Cloudinary via la lib existante
    const result = await uploadToCloudinary(buffer, {
      folder:        `location-docs/${reservationId}`,
      resource_type: 'auto',
      public_id:     `${type}-${Date.now()}`,
    })

    // Enregistrer en base
    const { data: doc, error: docErr } = await supabaseAdmin
      .from('location_documents')
      .insert({
        reservation_id: reservationId,
        type,
        nom_fichier:    file.name,
        fichier_url:    result.url,
        taille_octets:  result.bytes,
        valide:         null,
      })
      .select()
      .single()

    if (docErr) {
      return NextResponse.json({ error: 'Erreur lors de l\'enregistrement du document.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, doc })
  } catch (e: unknown) {
    console.error('Erreur upload document:', e)
    return NextResponse.json({ error: 'Erreur lors de l\'upload.' }, { status: 500 })
  }
}