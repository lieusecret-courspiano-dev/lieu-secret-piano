import { exec } from 'child_process'
import { promisify } from 'util'
import { writeFile, readFile, unlink, mkdir } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { existsSync } from 'fs'

const execAsync = promisify(exec)

// Vérifier si wkhtmltopdf est disponible (cache le résultat)
let wkhtmlAvailable: boolean | null = null
async function isWkhtmlAvailable(): Promise<boolean> {
  if (wkhtmlAvailable !== null) return wkhtmlAvailable
  try {
    await execAsync('wkhtmltopdf --version', { timeout: 5000 })
    wkhtmlAvailable = true
  } catch {
    wkhtmlAvailable = false
  }
  return wkhtmlAvailable
}

export interface PdfOptions {
  orientation?: 'Portrait' | 'Landscape'
  pageWidth?: string
  pageHeight?: string
  marginTop?: string
  marginBottom?: string
  marginLeft?: string
  marginRight?: string
  zoom?: number
}

/**
 * Génère un PDF à partir de HTML
 * Utilise wkhtmltopdf si disponible, sinon retourne le HTML
 */
export async function generatePdfFromHtml(
  html: string,
  options: PdfOptions = {}
): Promise<{ buffer: Buffer | Uint8Array; contentType: string; isHtml: boolean }> {
  const {
    orientation = 'Portrait',
    pageWidth,
    pageHeight,
    marginTop = '0',
    marginBottom = '0',
    marginLeft = '0',
    marginRight = '0',
    zoom = 1,
  } = options

  const available = await isWkhtmlAvailable()

  if (!available) {
    // Fallback: retourner le HTML directement
    console.warn('[PDF] wkhtmltopdf non disponible, retour HTML')
    return {
      buffer: Buffer.from(html, 'utf8'),
      contentType: 'text/html; charset=utf-8',
      isHtml: true,
    }
  }

  const id = `pdf-${Date.now()}-${Math.random().toString(36).slice(2)}`
  const tmpDir = tmpdir()
  const htmlPath = join(tmpDir, `${id}.html`)
  const pdfPath  = join(tmpDir, `${id}.pdf`)

  try {
    await writeFile(htmlPath, html, 'utf8')

    // Construire la commande wkhtmltopdf
    const sizeArgs = pageWidth && pageHeight
      ? `--page-width ${pageWidth} --page-height ${pageHeight}`
      : `--orientation ${orientation}`

    const cmd = [
      'wkhtmltopdf',
      '--quiet',
      '--disable-smart-shrinking',
      '--enable-local-file-access',
      `--zoom ${zoom}`,
      `--margin-top ${marginTop}`,
      `--margin-bottom ${marginBottom}`,
      `--margin-left ${marginLeft}`,
      `--margin-right ${marginRight}`,
      sizeArgs,
      `"${htmlPath}"`,
      `"${pdfPath}"`,
    ].join(' ')

    await execAsync(cmd, { timeout: 30000 })

    const buffer = await readFile(pdfPath)
    return { buffer, contentType: 'application/pdf', isHtml: false }
  } finally {
    // Nettoyage garanti même en cas d'erreur
    await Promise.allSettled([
      unlink(htmlPath),
      unlink(pdfPath),
    ])
  }
}

/**
 * Génère un nom de fichier PDF sécurisé
 */
export function safePdfFilename(parts: string[]): string {
  return parts
    .map(p => p.replace(/[^a-zA-Z0-9À-ÿ\s-]/g, '').trim())
    .filter(Boolean)
    .join('-')
    .replace(/\s+/g, '-')
    .slice(0, 100) + '.pdf'
}
