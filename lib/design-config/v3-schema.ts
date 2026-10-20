import { z } from 'zod'

// Base types
export const GradientStopSchema = z.object({
  offset: z.number().min(0).max(1),
  color: z.string()
})

export const LinearGradientSchema = z.object({
  type: z.literal('linear'),
  coords: z.object({
    x1: z.number(),
    y1: z.number(),
    x2: z.number(),
    y2: z.number()
  }),
  stops: z.array(GradientStopSchema).min(2)
})

export const RadialGradientSchema = z.object({
  type: z.literal('radial'),
  coords: z.object({
    x1: z.number(),
    y1: z.number(),
    x2: z.number(),
    y2: z.number(),
    r1: z.number().optional(),
    r2: z.number().optional()
  }),
  stops: z.array(GradientStopSchema).min(2)
})

export const GradientSchema = z.union([LinearGradientSchema, RadialGradientSchema])

export const BackgroundSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('color'),
    color: z.string()
  }),
  z.object({
    type: z.literal('gradient'),
    gradient: GradientSchema
  }),
  z.object({
    type: z.literal('image'),
    imageUrl: z.string().url()
  })
])

// Element position/transform
export const TransformSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number().positive(),
  height: z.number().positive(),
  angle: z.number().default(0),
  scaleX: z.number().positive().default(1),
  scaleY: z.number().positive().default(1),
  originX: z.enum(['left', 'center', 'right']).default('left'),
  originY: z.enum(['top', 'center', 'bottom']).default('top'),
  opacity: z.number().min(0).max(1).default(1)
})

// Text element
export const TextElementSchema = z.object({
  type: z.literal('text'),
  id: z.string(),
  text: z.string(),
  fontFamily: z.string().default('Inter'),
  fontSize: z.number().positive(),
  fontWeight: z.enum(['normal', 'bold']).default('normal'),
  fontStyle: z.enum(['normal', 'italic']).default('normal'),
  fill: z.string(),
  textAlign: z.enum(['left', 'center', 'right', 'justify']).default('left'),
  lineHeight: z.number().positive().optional(),
  charSpacing: z.number().optional(),
  underline: z.boolean().default(false),
  strikethrough: z.boolean().default(false)
}).merge(TransformSchema)

// Field element (dynamic per-recipient data)
export const FieldElementSchema = z.object({
  type: z.literal('field'),
  id: z.string(),
  field: z.enum([
    'recipient_name',
    'recipient_email',
    'issue_date',
    'expiry_date',
    'credential_id',
    'course_name',
    'description',
    'grade',
    'score',
    'custom_1',
    'custom_2',
    'custom_3'
  ]),
  fontFamily: z.string().default('Inter'),
  fontSize: z.number().positive(),
  fontWeight: z.enum(['normal', 'bold']).default('normal'),
  fontStyle: z.enum(['normal', 'italic']).default('normal'),
  fill: z.string(),
  textAlign: z.enum(['left', 'center', 'right', 'justify']).default('left'),
  autoShrink: z.boolean().default(false),
  minFontSize: z.number().positive().default(12),
  maxLines: z.number().int().positive().default(1),
  dateFormat: z.string().optional(), // e.g. 'MMMM d, yyyy' for dates
  placeholder: z.string().optional()
}).merge(TransformSchema)

// Image element
export const ImageElementSchema = z.object({
  type: z.literal('image'),
  id: z.string(),
  imageUrl: z.string(),
  fit: z.enum(['fill', 'contain', 'cover']).default('contain'),
  filters: z.array(z.object({
    type: z.string(),
    options: z.record(z.any())
  })).optional()
}).merge(TransformSchema)

// Signature element
export const SignatureElementSchema = z.object({
  type: z.literal('signature'),
  id: z.string(),
  signatureType: z.enum(['image', 'text']),
  imageUrl: z.string().optional(), // For image signatures
  text: z.string().optional(), // For text signatures
  fontFamily: z.string().optional(),
  fontSize: z.number().positive().optional(),
  fill: z.string().optional()
}).merge(TransformSchema)

// Shape element
export const ShapeElementSchema = z.discriminatedUnion('shape', [
  z.object({
    type: z.literal('shape'),
    id: z.string(),
    shape: z.literal('rect'),
    fill: z.string().optional(),
    stroke: z.string().optional(),
    strokeWidth: z.number().min(0).default(1),
    strokeDashArray: z.array(z.number()).optional(),
    rx: z.number().min(0).default(0), // Border radius
    ry: z.number().min(0).default(0)
  }).merge(TransformSchema),
  z.object({
    type: z.literal('shape'),
    id: z.string(),
    shape: z.literal('circle'),
    fill: z.string().optional(),
    stroke: z.string().optional(),
    strokeWidth: z.number().min(0).default(1),
    strokeDashArray: z.array(z.number()).optional(),
    radius: z.number().positive()
  }).merge(TransformSchema.omit({ width: true, height: true })),
  z.object({
    type: z.literal('shape'),
    id: z.string(),
    shape: z.literal('line'),
    stroke: z.string(),
    strokeWidth: z.number().min(0).default(1),
    strokeDashArray: z.array(z.number()).optional(),
    x1: z.number(),
    y1: z.number(),
    x2: z.number(),
    y2: z.number()
  }).merge(TransformSchema.omit({ width: true, height: true, x: true, y: true })),
  z.object({
    type: z.literal('shape'),
    id: z.string(),
    shape: z.literal('path'),
    fill: z.string().optional(),
    stroke: z.string().optional(),
    strokeWidth: z.number().min(0).default(1),
    strokeDashArray: z.array(z.number()).optional(),
    path: z.string() // SVG path data
  }).merge(TransformSchema)
])

// QR code element
export const QRElementSchema = z.object({
  type: z.literal('qr'),
  id: z.string(),
  data: z.string(), // URL or data to encode
  errorCorrectionLevel: z.enum(['L', 'M', 'Q', 'H']).default('M'),
  foreground: z.string().default('#000000'),
  background: z.string().default('#ffffff')
}).merge(TransformSchema)

// Union of all element types
export const ElementSchema = z.union([
  TextElementSchema,
  FieldElementSchema,
  ImageElementSchema,
  SignatureElementSchema,
  ShapeElementSchema,
  QRElementSchema
])

// Page definition
export const PageSchema = z.object({
  width: z.number().positive(),
  height: z.number().positive(),
  unit: z.enum(['px', 'mm', 'in', 'pt']).default('px'),
  background: BackgroundSchema,
  elements: z.array(ElementSchema)
})

// Complete design config v3
export const DesignConfigV3Schema = z.object({
  version: z.literal(3),
  pages: z.array(PageSchema).min(1)
})

// TypeScript types derived from Zod schemas
export type GradientStop = z.infer<typeof GradientStopSchema>
export type LinearGradient = z.infer<typeof LinearGradientSchema>
export type RadialGradient = z.infer<typeof RadialGradientSchema>
export type Gradient = z.infer<typeof GradientSchema>
export type Background = z.infer<typeof BackgroundSchema>
export type Transform = z.infer<typeof TransformSchema>
export type TextElement = z.infer<typeof TextElementSchema>
export type FieldElement = z.infer<typeof FieldElementSchema>
export type ImageElement = z.infer<typeof ImageElementSchema>
export type SignatureElement = z.infer<typeof SignatureElementSchema>
export type ShapeElement = z.infer<typeof ShapeElementSchema>
export type QRElement = z.infer<typeof QRElementSchema>
export type Element = z.infer<typeof ElementSchema>
export type Page = z.infer<typeof PageSchema>
export type DesignConfigV3 = z.infer<typeof DesignConfigV3Schema>

// Helper function to validate and parse design config
export function parseDesignConfig(data: unknown): DesignConfigV3 {
  return DesignConfigV3Schema.parse(data)
}

// Helper function to validate without throwing
export function validateDesignConfig(data: unknown): { 
  success: true; data: DesignConfigV3 
} | { 
  success: false; error: z.ZodError 
} {
  const result = DesignConfigV3Schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  } else {
    return { success: false, error: result.error }
  }
}

// Example template helper
export function createEmptyDesignConfig(
  width = 1123,
  height = 794
): DesignConfigV3 {
  return {
    version: 3,
    pages: [{
      width,
      height,
      unit: 'px',
      background: {
        type: 'color',
        color: '#ffffff'
      },
      elements: []
    }]
  }
}
