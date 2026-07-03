import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key:    process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
  secure:     true,
})

export { cloudinary }

/**
 * Upload un buffer vers Cloudinary
 * @param buffer - Contenu du fichier
 * @param options - Options Cloudinary (folder, resource_type, etc.)
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  options: {
    folder?: string
    resource_type?: 'auto' | 'video' | 'raw' | 'image'
    public_id?: string
    format?: string
  } = {}
): Promise<{ url: string; public_id: string; duration?: number; bytes: number; resource_type: string }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder:        options.folder || 'lieu-secret/enregistrements',
        resource_type: options.resource_type || 'auto',
        public_id:     options.public_id,
        // Compression automatique audio
        audio_codec:   'mp3',
        bit_rate:      '128k',
      },
      (error, result) => {
        if (error) reject(error)
        else if (result) resolve({
          url:           result.secure_url,
          public_id:     result.public_id,
          duration:      result.duration,
          bytes:         result.bytes,
          resource_type: result.resource_type,
        })
        else reject(new Error('Upload failed'))
      }
    )
    uploadStream.end(buffer)
  })
}

/**
 * Supprimer un fichier de Cloudinary
 */
export async function deleteFromCloudinary(publicId: string, resourceType: 'video' | 'raw' | 'image' = 'video') {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType })
  } catch (err) {
    console.error('Cloudinary delete error:', err)
  }
}