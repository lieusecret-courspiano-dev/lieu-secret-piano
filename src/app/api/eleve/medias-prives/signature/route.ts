import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getEleveFromSession } from '@/lib/eleve-auth'
import { cloudinary } from '@/lib/cloudinary'

// POST — génère une signature pour upload direct vers Cloudinary
// L'upload se fait directement depuis le navigateur vers Cloudinary
// sans passer par Vercel (contourne la limite de 4.5 MB)
export async function POST(req: NextRequest) {
  const eleve = await getEleveFromSession()
  if (!eleve) return NextResponse.json({ error: 'Non connecté' }, { status: 401 })

  await req.json().catch(() => ({})) // consommer le body

  const timestamp = Math.round(new Date().getTime() / 1000)
  const folder = `lieu-secret/eleves/${eleve.id}`
  const publicId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`

  // IMPORTANT : seuls ces paramètres doivent être signés
  // resource_type ne fait PAS partie des paramètres signés
  const paramsToSign: Record<string, string | number> = {
    folder,
    public_id: publicId,
    timestamp,
  }

  // Générer la signature (SHA-1 de tous les paramètres triés + api_secret)
  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET!
  )

  return NextResponse.json({
    signature,
    timestamp,
    folder,
    public_id: publicId,
    api_key: process.env.CLOUDINARY_API_KEY!,
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  })
}