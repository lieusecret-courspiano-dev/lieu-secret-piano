import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { validateAdminSession } from '@/lib/auth'
import { factureDepuisRessource, factureExistePour } from '@/lib/facturation'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { achat_id } = await req.json()
  if (!achat_id) return NextResponse.json({ error: 'achat_id requis' }, { status: 400 })

  // Récupérer l'achat
  const { data: achat } = await supabaseAdmin
    .from('ressources_premium_achats')
    .select('*, ressources_premium(titre, youtube_url, zoom_url, fichier_url, type)')
    .eq('id', achat_id).single()

  if (!achat) return NextResponse.json({ error: 'Achat introuvable' }, { status: 404 })
  if (achat.statut === 'confirme') return NextResponse.json({ error: 'Déjà confirmé' }, { status: 400 })

  // Confirmer l'achat
  await supabaseAdmin
    .from('ressources_premium_achats')
    .update({ statut: 'confirme', confirmed_at: new Date().toISOString() })
    .eq('id', achat_id)

  

  // Générer la facture automatiquement
  try {
    if (!(await factureExistePour('ressource', achat_id))) {
      await factureDepuisRessource({
        id:              achat_id,
        montant:         achat.montant || 0,
        payment_method:  achat.payment_method || 'virement',
        acheteur_nom:    achat.acheteur_nom || 'Client',
        acheteur_email:  achat.acheteur_email || null,
        ressource_titre: (achat.ressources_premium as {titre?: string})?.titre || 'Ressource premium',
        created_at:      new Date().toISOString(),
      })
    }
  } catch (fe) { console.error('Erreur facture ressource premium:', fe) }

  return NextResponse.json({ success: true, token: achat.token_acces })
}