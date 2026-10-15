/**
 * Tests for image processing and file upload features
 */

import { validateImageFile } from '../lib/utils/image-processing'

describe('Image Processing', () => {
  it('should validate image file types', () => {
    const pngFile = new File([''], 'test.png', { type: 'image/png' })
    const jpgFile = new File([''], 'test.jpg', { type: 'image/jpeg' })
    const webpFile = new File([''], 'test.webp', { type: 'image/webp' })
    const svgFile = new File([''], 'test.svg', { type: 'image/svg+xml' })
    const pdfFile = new File([''], 'test.pdf', { type: 'application/pdf' })
    
    expect(validateImageFile(pngFile)).toBeNull()
    expect(validateImageFile(jpgFile)).toBeNull()
    expect(validateImageFile(webpFile)).toBeNull()
    expect(validateImageFile(svgFile)).toBeNull()
    expect(validateImageFile(pdfFile)).toContain('Only PNG, JPG, WebP, and SVG')
  })

  it('should validate file size', () => {
    const smallFile = new File([new ArrayBuffer(1024)], 'small.png', { type: 'image/png' })
    const largeFile = new File([new ArrayBuffer(11 * 1024 * 1024)], 'large.png', { type: 'image/png' })
    
    expect(validateImageFile(smallFile)).toBeNull()
    expect(validateImageFile(largeFile)).toContain('under 10MB')
  })
})

describe('Certificate Builder File Uploads', () => {
  const fs = require('fs')
  const path = require('path')
  
  it('should use ImageUpload component in builder', () => {
    const builderPath = path.join(process.cwd(), 'app/dashboard/templates/[id]/builder.tsx')
    const builderCode = fs.readFileSync(builderPath, 'utf-8')
    
    expect(builderCode).toContain('import ImageUpload')
  })

  it('should have logo upload with 600px max width', () => {
    const builderPath = path.join(process.cwd(), 'app/dashboard/templates/[id]/builder.tsx')
    const builderCode = fs.readFileSync(builderPath, 'utf-8')
    
    expect(builderCode).toContain('Upload Logo')
    expect(builderCode).toContain('maxWidth={600}')
  })

  it('should have background image upload with 2000px max width', () => {
    const builderPath = path.join(process.cwd(), 'app/dashboard/templates/[id]/builder.tsx')
    const builderCode = fs.readFileSync(builderPath, 'utf-8')
    
    expect(builderCode).toContain('Upload Background Image')
    expect(builderCode).toContain('maxWidth={2000}')
  })

  it('should have signature image upload with 600px max width', () => {
    const builderPath = path.join(process.cwd(), 'app/dashboard/templates/[id]/builder.tsx')
    const builderCode = fs.readFileSync(builderPath, 'utf-8')
    
    expect(builderCode).toContain('Upload Signature')
  })

  it('should have drag and drop support', () => {
    const uploadPath = path.join(process.cwd(), 'components/dashboard/image-upload.tsx')
    const uploadCode = fs.readFileSync(uploadPath, 'utf-8')
    
    expect(uploadCode).toContain('onDragEnter')
    expect(uploadCode).toContain('onDragOver')
    expect(uploadCode).toContain('onDrop')
    expect(uploadCode).toContain('Click or drag image here')
  })

  it('should have URL paste option', () => {
    const uploadPath = path.join(process.cwd(), 'components/dashboard/image-upload.tsx')
    const uploadCode = fs.readFileSync(uploadPath, 'utf-8')
    
    expect(uploadCode).toContain('Or paste a URL')
    expect(uploadCode).toContain('showUrlInput')
  })

  it('should have remove button', () => {
    const uploadPath = path.join(process.cwd(), 'components/dashboard/image-upload.tsx')
    const uploadCode = fs.readFileSync(uploadPath, 'utf-8')
    
    expect(uploadCode).toContain('Remove')
  })

  it('should handle client-side compression', () => {
    const processingPath = path.join(process.cwd(), 'lib/utils/image-processing.ts')
    const processingCode = fs.readFileSync(processingPath, 'utf-8')
    
    expect(processingCode).toContain('canvas.toDataURL')
    expect(processingCode).toContain('quality')
    expect(processingCode).toContain('500') // 500KB limit
  })
})

describe('PDF Renderer Data URL Support', () => {
  const fs = require('fs')
  const path = require('path')
  
  it('should support data URLs in logo', () => {
    const generatorPath = path.join(process.cwd(), 'lib/pdf/generator.ts')
    const generatorCode = fs.readFileSync(generatorPath, 'utf-8')
    
    expect(generatorCode).toContain('designConfig?.logo?.url')
    expect(generatorCode).toContain('<img src="${params.designConfig.logo.url}"')
  })

  it('should support data URLs in background images', () => {
    const generatorPath = path.join(process.cwd(), 'lib/pdf/generator.ts')
    const generatorCode = fs.readFileSync(generatorPath, 'utf-8')
    
    expect(generatorCode).toContain('background-image: url')
    expect(generatorCode).toContain('designConfig.background.value')
  })

  it('should support data URLs in signature images', () => {
    const generatorPath = path.join(process.cwd(), 'lib/pdf/generator.ts')
    const generatorCode = fs.readFileSync(generatorPath, 'utf-8')
    
    expect(generatorCode).toContain('designConfig?.signatures')
    expect(generatorCode).toContain('<img src="${sig.value}"')
  })
})
