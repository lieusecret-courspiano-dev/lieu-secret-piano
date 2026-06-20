import { Resend } from 'resend'
import { generateCoursICS, generateEventICS } from './ics'
import { DateTime } from 'luxon'

const resend      = new Resend(process.env.RESEND_API_KEY!)
const FROM        = process.env.RESEND_FROM_EMAIL || 'Lieu Secret <onboarding@resend.dev>'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'lieusecret-courspiano@outlook.fr'

function formatDate(isoString: string, timezone: string): string {
  return DateTime.fromISO(isoString, { zone: 'utc' })
    .setZone(timezone)
    .setLocale('fr')
    .toFormat("EEEE d MMMM yyyy 'à' HH'h'mm")
}

function baseTemplate(content: string): string {
  return [
    '<!DOCTYPE html>',
    '<html lang="fr"><head>',
    '<meta charset="UTF-8"/>',
    '<meta name="viewport" content="width=device-width, initial-scale=1.0"/>',
    '<title>Lieu Secret</title></head>',
    '<body style="margin:0;padding:0;background:#080808;font-family:Georgia,serif;">',
    '<table width="100%" cellpadding="0" cellspacing="0" style="background:#080808;padding:40px 20px;">',
    '<tr><td align="center">',
    '<table width="600" cellpadding="0" cellspacing="0" style="background:#111111;border:1px solid #f59e0b;border-radius:8px;overflow:hidden;max-width:600px;">',
    '<tr><td style="background:linear-gradient(135deg,#1a1a1a,#111111);padding:32px;text-align:center;border-bottom:1px solid #f59e0b;">',
    '<div style="font-size:26px;color:#f59e0b;letter-spacing:4px;font-weight:300;">LIEU SECRET</div>',
    '<div style="font-size:12px;color:#a8a8a8;margin-top:6px;letter-spacing:2px;">ÉCOLE DE PIANO EN LIGNE</div>',
    '</td></tr>',
    '<tr><td style="padding:32px;">',
    content,
    '</td></tr>',
    '<tr><td style="background:#0a0a0a;padding:20px;text-align:center;border-top:1px solid #282828;">',
    '<p style="margin:0;font-size:12px;color:#404040;">Lieu Secret &mdash; École de Piano en Ligne<br/>',
    '<a href="mailto:' + ADMIN_EMAIL + '" style="color:#f59e0b;text-decoration:none;">' + ADMIN_EMAIL + '</a></p>',
    '</td></tr>',
    '</table></td></tr></table>',
    '</body></html>',
  ].join('')
}

function cancelBlock(url: string | null | undefined, label: string): string {
  if (!url) return ''
  return [
    '<div style="margin-top:24px;padding-top:16px;border-top:1px solid #282828;text-align:center;">',
    '<a href="' + url + '" style="color:#707070;font-size:12px;text-decoration:underline;">' + label + '</a>',
    '</div>',
  ].join('')
}

function zoomBlock(link: string | null | undefined): string {
  if (!link) return ''
  return [
    '<div style="margin-top:16px;background:#1a1a1a;border:1px solid rgba(245,158,11,0.3);border-radius:6px;padding:14px 18px;">',
    '<p style="margin:0 0 6px;color:#a8a8a8;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Lien Zoom</p>',
    '<a href="' + link + '" style="color:#f59e0b;font-size:14px;word-break:break-all;">' + link + '</a>',
    '<p style="margin:8px 0 0;color:#707070;font-size:12px;">Cliquez sur ce lien à l\'heure du cours.</p>',
    '</div>',
  ].join('')
}

export async function sendCoursConfirmation(params: {
  studentName:    string
  studentEmail:   string
  startISO:       string
  endISO:         string
  timezone:       string
  zoomLink?:      string | null
  message?:       string | null
  cancelUrl?:     string | null
  paymentMethod?: string | null
  virementIban?:  string | null
  virementNom?:   string | null
  virementInfo?:  string | null
  achetePack?:    string | null
}) {
  const dateLocal  = formatDate(params.startISO, params.timezone)
  const { ics: icsContent, uid: icsContentUid } = generateCoursICS({
    studentName: params.studentName,
    startISO:    params.startISO,
    endISO:      params.endISO,
    zoomLink:    params.zoomLink ?? undefined,
  })

  const msgBlock = params.message
    ? '<div style="background:#1a1a1a;padding:12px 16px;border-radius:4px;margin-top:16px;"><p style="margin:0;color:#a8a8a8;font-size:13px;font-style:italic;">&ldquo;' + params.message + '&rdquo;</p></div>'
    : ''

  const content = [
    '<h2 style="color:#f59e0b;font-size:22px;margin:0 0 8px;">Votre cours est confirmé !</h2>',
    '<p style="color:#a8a8a8;font-size:14px;margin:0 0 24px;">Bonjour ' + params.studentName + ',</p>',
    '<div style="background:#1a1a1a;border-left:3px solid #f59e0b;padding:16px 20px;border-radius:4px;margin-bottom:16px;">',
    '<p style="margin:0 0 6px;color:#e8e8e8;font-size:15px;font-weight:bold;">' + dateLocal + '</p>',
    '<p style="margin:0;color:#a8a8a8;font-size:13px;">Fuseau horaire : ' + params.timezone + '</p>',
    '</div>',
    zoomBlock(params.zoomLink),
    '<p style="color:#d0d0d0;font-size:14px;line-height:1.7;margin-top:20px;">',
    'Votre cours de piano individuel a bien été enregistré. Le fichier .ics joint vous permet d\'ajouter ce rendez-vous dans Outlook, Google Calendar ou Apple Calendar.',
    '</p>',
    msgBlock,

    params.paymentMethod === 'virement' ? '<div style="margin-top:20px;background:#1a1a2e;border:2px solid #f59e0b;border-radius:8px;padding:20px;">' +'<p style="margin:0 0 12px;color:#f59e0b;font-size:14px;font-weight:bold;">Coordonnées pour le virement</p>' +(params.virementIban ? '<p style="margin:0 0 4px;color:#a0a0c0;font-size:12px;">IBAN</p><p style="margin:0 0 12px;color:#f0f0f0;font-size:14px;font-family:monospace;">' + params.virementIban + '</p>' : '') +'<p style="margin:0 0 4px;color:#a0a0c0;font-size:12px;">Bénéficiaire</p><p style="margin:0 0 12px;color:#f0f0f0;font-size:14px;">' + (params.virementNom || 'Lieu Secret') + '</p>' +(params.virementInfo ? '<p style="margin:8px 0 0;color:#7070a0;font-size:12px;">' + params.virementInfo + '</p>' : '') +      (params.achetePack === 'oui' ? '<p style="margin:8px 0 0;color:#f59e0b;font-size:12px;font-weight:bold;">Achat souhaite : Pack de cours</p>' : params.achetePack === 'non' ? '<p style="margin:8px 0 0;color:#f59e0b;font-size:12px;font-weight:bold;">Achat souhaite : 1 cours a l unite</p>' : '') +
      '</div>' : '',
    '<p style="color:#707070;font-size:13px;margin-top:24px;">À très bientôt,<br/><span style="color:#f59e0b;">Lieu Secret</span></p>',
    '<div style="margin-top:16px;background:#1a1a2e;border:1px solid rgba(245,158,11,0.2);border-radius:6px;padding:12px 16px;text-align:center;">',
    '<p style="margin:0 0 4px;color:#a0a0c0;font-size:12px;">Vous avez un pack de cours ?</p>',
    '<a href="' + (process.env.NEXT_PUBLIC_APP_URL || 'https://lieusecret-courspiano.fr') + '/mon-pack" style="color:#f59e0b;font-size:13px;font-weight:bold;">Consulter mes heures restantes</a>',
    '</div>',
    cancelBlock(params.cancelUrl, 'Annuler cette réservation'),
  ].join('')

  try {
    const result = await resend.emails.send({
      from:        FROM,
      to:          params.studentEmail,
      subject:     'Cours de piano confirmé — ' + dateLocal,
      html:        baseTemplate(content),
      attachments: [{
        filename:     'cours-piano-lieu-secret.ics',
        content:      Buffer.from(icsContent).toString('base64'),
        content_type: 'text/calendar; charset=utf-8; method=REQUEST',
      }],
    })
    console.log('Email cours envoyé :', result)
    return result
  } catch (err) {
    console.error('Erreur email cours :', err)
    throw err
  }
}

export async function sendEventConfirmation(params: {
  studentName:  string
  studentEmail: string
  eventTitle:   string
  startISO:     string
  endISO:       string
  timezone:     string
  isPaid:       boolean
  amount?:      number
  zoomLink?:    string | null
  cancelUrl?:   string | null
}) {
  const dateLocal  = formatDate(params.startISO, params.timezone)
  const { ics: icsContent, uid: icsContentUid } = generateEventICS({
    studentName: params.studentName,
    eventTitle:  params.eventTitle,
    startISO:    params.startISO,
    endISO:      params.endISO,
    zoomLink:    params.zoomLink ?? undefined,
  })

  const paiementLine = params.isPaid && params.amount
    ? '<p style="margin:8px 0 0;color:#f59e0b;font-size:14px;">Paiement : ' + params.amount.toFixed(2) + ' EUR</p>'
    : '<p style="margin:8px 0 0;color:#4ade80;font-size:14px;">Événement gratuit</p>'

  const content = [
    '<h2 style="color:#f59e0b;font-size:22px;margin:0 0 8px;">Inscription confirmée !</h2>',
    '<p style="color:#a8a8a8;font-size:14px;margin:0 0 24px;">Bonjour ' + params.studentName + ',</p>',
    '<div style="background:#1a1a1a;border-left:3px solid #f59e0b;padding:16px 20px;border-radius:4px;margin-bottom:16px;">',
    '<p style="margin:0 0 4px;color:#f59e0b;font-size:16px;font-weight:bold;">' + params.eventTitle + '</p>',
    '<p style="margin:0 0 6px;color:#e8e8e8;font-size:15px;">' + dateLocal + '</p>',
    '<p style="margin:0;color:#a8a8a8;font-size:13px;">Fuseau horaire : ' + params.timezone + '</p>',
    paiementLine,
    '</div>',
    zoomBlock(params.zoomLink),
    '<p style="color:#d0d0d0;font-size:14px;line-height:1.7;margin-top:20px;">',
    'Votre inscription a bien été enregistrée. Le fichier .ics joint vous permet d\'ajouter cet événement à votre agenda.',
    '</p>',
    '<p style="color:#707070;font-size:13px;margin-top:24px;">À très bientôt,<br/><span style="color:#f59e0b;">Lieu Secret</span></p>',
    cancelBlock(params.cancelUrl, 'Annuler cette inscription'),
  ].join('')

  try {
    const result = await resend.emails.send({
      from:        FROM,
      to:          params.studentEmail,
      subject:     'Inscription confirmée — ' + params.eventTitle,
      html:        baseTemplate(content),
      attachments: [{
        filename:     'evenement-lieu-secret.ics',
        content:      Buffer.from(icsContent).toString('base64'),
        content_type: 'text/calendar; charset=utf-8; method=REQUEST',
      }],
    })
    console.log('Email événement envoyé :', result)
    return result
  } catch (err) {
    console.error('Erreur email événement :', err)
    throw err
  }
}

export async function sendAdminNotification(params: {
  studentName:  string
  studentEmail: string
  type:         string
  dateLocal:    string
  timezone:     string
  zoomLink?:    string | null
  message?:     string | null
  icsContent?:  string | null
}) {
  const adminEmail = ADMIN_EMAIL

  const rows = [
    '<tr><td style="padding:8px 0;color:#a8a8a8;font-size:13px;width:140px;">Élève</td><td style="padding:8px 0;color:#e8e8e8;font-size:14px;">' + params.studentName + '</td></tr>',
    '<tr><td style="padding:8px 0;color:#a8a8a8;font-size:13px;">Email</td><td style="padding:8px 0;color:#e8e8e8;font-size:14px;"><a href="mailto:' + params.studentEmail + '" style="color:#f59e0b;">' + params.studentEmail + '</a></td></tr>',
    '<tr><td style="padding:8px 0;color:#a8a8a8;font-size:13px;">Type</td><td style="padding:8px 0;color:#e8e8e8;font-size:14px;">' + params.type + '</td></tr>',
    '<tr><td style="padding:8px 0;color:#a8a8a8;font-size:13px;">Date</td><td style="padding:8px 0;color:#e8e8e8;font-size:14px;">' + params.dateLocal + '</td></tr>',
    '<tr><td style="padding:8px 0;color:#a8a8a8;font-size:13px;">Fuseau</td><td style="padding:8px 0;color:#e8e8e8;font-size:14px;">' + params.timezone + '</td></tr>',
    params.zoomLink ? '<tr><td style="padding:8px 0;color:#a8a8a8;font-size:13px;">Zoom</td><td style="padding:8px 0;font-size:14px;"><a href="' + params.zoomLink + '" style="color:#f59e0b;">' + params.zoomLink + '</a></td></tr>' : '',
    params.message  ? '<tr><td style="padding:8px 0;color:#a8a8a8;font-size:13px;vertical-align:top;">Message</td><td style="padding:8px 0;color:#e8e8e8;font-size:14px;font-style:italic;">&ldquo;' + params.message + '&rdquo;</td></tr>' : '',
  ].join('')

  const content = [
    '<h2 style="color:#f59e0b;font-size:20px;margin:0 0 16px;">Nouvelle réservation</h2>',
    '<table style="width:100%;border-collapse:collapse;">',
    rows,
    '</table>',
  ].join('')

  try {
    const emailData: Parameters<typeof resend.emails.send>[0] = {
      from:    FROM,
      to:      adminEmail,
      subject: 'Nouvelle réservation — ' + params.studentName + ' — ' + params.type,
      html:    baseTemplate(content),
    }
    if (params.icsContent) {
      emailData.attachments = [{
        filename:     'reservation-lieu-secret.ics',
        content:      Buffer.from(params.icsContent).toString('base64'),
        content_type: 'text/calendar; charset=utf-8; method=REQUEST',
      }]
    }
    const result = await resend.emails.send(emailData)
    console.log('Email admin envoyé :', result)
    return result
  } catch (err) {
    console.error('Erreur email admin :', err)
  }
}

// ── Email annulation ──────────────────────────────────────────────────
export async function sendCancellationEmail(params: {
  studentName:  string
  studentEmail: string
  type:         string
  dateLocal:    string
  cancelledBy:  'student' | 'admin'
}) {
  const adminEmail = ADMIN_EMAIL
  const byAdmin    = params.cancelledBy === 'admin'

  const studentContent = [
    '<h2 style="color:#f59e0b;font-size:22px;margin:0 0 8px;">Réservation annulée</h2>',
    '<p style="color:#a8a8a8;font-size:14px;margin:0 0 24px;">Bonjour ' + params.studentName + ',</p>',
    '<div style="background:#1a1a1a;border-left:3px solid #f59e0b;padding:16px 20px;border-radius:4px;margin-bottom:16px;">',
    '<p style="margin:0 0 6px;color:#e8e8e8;font-size:15px;font-weight:bold;">' + params.type + '</p>',
    '<p style="margin:0;color:#a8a8a8;font-size:13px;">' + params.dateLocal + '</p>',
    '</div>',
    byAdmin
      ? '<p style="color:#d0d0d0;font-size:14px;line-height:1.7;">Votre réservation a été annulée par votre professeur. N\'hésitez pas à réserver un autre créneau.</p>'
      : '<p style="color:#d0d0d0;font-size:14px;line-height:1.7;">Votre annulation a bien été prise en compte. Le créneau est de nouveau disponible.</p>',
    '<p style="color:#707070;font-size:13px;margin-top:24px;">À bientôt,<br/><span style="color:#f59e0b;">Lieu Secret</span></p>',
  ].join('')

  const adminContent = [
    '<h2 style="color:#f59e0b;font-size:20px;margin:0 0 16px;">Réservation annulée</h2>',
    '<table style="width:100%;border-collapse:collapse;">',
    '<tr><td style="padding:8px 0;color:#a8a8a8;font-size:13px;width:140px;">Élève</td><td style="padding:8px 0;color:#e8e8e8;font-size:14px;">' + params.studentName + '</td></tr>',
    '<tr><td style="padding:8px 0;color:#a8a8a8;font-size:13px;">Email</td><td style="padding:8px 0;color:#e8e8e8;font-size:14px;">' + params.studentEmail + '</td></tr>',
    '<tr><td style="padding:8px 0;color:#a8a8a8;font-size:13px;">Type</td><td style="padding:8px 0;color:#e8e8e8;font-size:14px;">' + params.type + '</td></tr>',
    '<tr><td style="padding:8px 0;color:#a8a8a8;font-size:13px;">Date</td><td style="padding:8px 0;color:#e8e8e8;font-size:14px;">' + params.dateLocal + '</td></tr>',
    '<tr><td style="padding:8px 0;color:#a8a8a8;font-size:13px;">Annulé par</td><td style="padding:8px 0;color:#e8e8e8;font-size:14px;">' + (byAdmin ? 'Administrateur' : 'Élève') + '</td></tr>',
    '</table>',
  ].join('')

  try {
    await Promise.all([
      resend.emails.send({
        from:    FROM,
        to:      params.studentEmail,
        subject: 'Réservation annulée — ' + params.type,
        html:    baseTemplate(studentContent),
      }),
      resend.emails.send({
        from:    FROM,
        to:      adminEmail,
        subject: 'Réservation annulée — ' + params.studentName,
        html:    baseTemplate(adminContent),
      }),
    ])
  } catch (err) {
    console.error('Erreur email annulation :', err)
  }
}