import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

// Cron unique qui appelle tous les jobs en parallèle
// Plan Hobby Vercel : 1 seul cron autorisé → on les regroupe ici
// Schedule : 0 8 * * * (tous les jours à 8h UTC)

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.lieusecret-courspiano.fr'
  const headers: Record<string, string> = cronSecret ? { authorization: `Bearer ${cronSecret}` } : {}

  const jobs = [
    { name: 'reminders',          path: '/api/cron/reminders' },
    { name: 'pack-reminders',     path: '/api/cron/pack-reminders' },
    { name: 'validate-parrainages', path: '/api/cron/validate-parrainages' },
    { name: 'setup-reminders',    path: '/api/cron/setup-reminders' },
  ]

  const results = await Promise.allSettled(
    jobs.map(async job => {
      const res = await fetch(`${baseUrl}${job.path}`, { headers })
      return { name: job.name, status: res.status, ok: res.ok }
    })
  )

  const summary = results.map((r, i) =>
    r.status === 'fulfilled'
      ? { job: jobs[i].name, ok: r.value.ok, status: r.value.status }
      : { job: jobs[i].name, ok: false, error: r.reason?.message }
  )

  console.log('[CRON ALL]', new Date().toISOString(), summary)
  return NextResponse.json({ success: true, ran_at: new Date().toISOString(), jobs: summary })
}