/**
 * Client-side image processing utilities
 * Resize, compress, and convert images to data URLs or upload to Supabase Storage
 */

export interface ImageProcessingOptions {
  maxWidth: number
  maxHeight?: number
  quality?: number
  format?: 'jpeg' | 'png' | 'webp'
}

export async function processImage(
  file: File,
  options: ImageProcessingOptions
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'))
          return
        }

        // Calculate new dimensions
        let { width, height } = img
        const maxWidth = options.maxWidth
        const maxHeight = options.maxHeight || maxWidth * 2

        if (width > maxWidth) {
          height = (height / width) * maxWidth
          width = maxWidth
        }
        
        if (height > maxHeight) {
          width = (width / height) * maxHeight
          height = maxHeight
        }

        canvas.width = width
        canvas.height = height

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height)
        
        const format = options.format || 'jpeg'
        const quality = options.quality || 0.85
        const mimeType = `image/${format}`
        
        const dataUrl = canvas.toDataURL(mimeType, quality)
        
        // Check size (data URLs are roughly 1.33x base64 size)
        const sizeKB = (dataUrl.length * 0.75) / 1024
        
        if (sizeKB > 500) {
          // Try with lower quality
          const lowerQuality = quality * 0.7
          const smallerDataUrl = canvas.toDataURL(mimeType, lowerQuality)
          const smallerSizeKB = (smallerDataUrl.length * 0.75) / 1024
          
          if (smallerSizeKB > 500) {
            reject(new Error(`Image too large (${Math.round(smallerSizeKB)}KB). Please use a smaller image or enable Supabase Storage.`))
            return
          }
          
          resolve(smallerDataUrl)
        } else {
          resolve(dataUrl)
        }
      }
      
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = e.target?.result as string
    }
    
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

export async function uploadToSupabase(
  file: File,
  bucket: string,
  path: string
): Promise<string> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase not configured')
  }

  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(
    `${supabaseUrl}/storage/v1/object/${bucket}/${path}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${supabaseKey}`,
      },
      body: formData,
    }
  )

  if (!response.ok) {
    throw new Error('Failed to upload to Supabase Storage')
  }

  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`
}

export function isSupabaseConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

export function validateImageFile(file: File): string | null {
  const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml']
  
  if (!validTypes.includes(file.type)) {
    return 'Only PNG, JPG, WebP, and SVG files are supported'
  }
  
  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    return 'File must be under 10MB'
  }
  
  return null
}
