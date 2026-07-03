import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')
  if (!email) return NextResponse.redirect(new URL('/newsletter/unsubscribe?error=1', req.url))

  const { error } = await supabaseAdmin
    .from('newsletter_subscribers')
    .update({ actif: false, updated_at: new Date().toISOString() })
    .eq('email', email.toLowerCase().trim())

  if (error) return NextResponse.redirect(new URL('/newsletter/unsubscribe?error=1', req.url))
  return NextResponse.redirect(new URL(`/newsletter/unsubscribe?success=1&email=${encodeURIComponent(email)}`, req.url))
}