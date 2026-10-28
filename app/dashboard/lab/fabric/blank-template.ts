import type { DesignConfigV3, Element, FieldElement } from '@/lib/design-config/v3-schema'

/** Stable id used when loading a blank landscape design (not in TEMPLATES). */
export const BLANK_TEMPLATE_ID = 'blank' as const

export type BlankFieldDef = {
  /** FieldElement.field value (schema enum) */
  field: FieldElement['field']
  /** Element id (also used for text-by-id preservation) */
  id: string
  /** Visible placeholder / default text */
  placeholder: string
}

/**
 * Common fields placed on a blank landscape certificate.
 * Add entries here to extend the blank starter layout.
 */
export const BLANK_TEMPLATE_FIELDS: readonly BlankFieldDef[] = [
  { field: 'recipient_name', id: 'recipient_name', placeholder: 'Recipient Name' },
  { field: 'course_name', id: 'certificate_title', placeholder: 'Certificate Title' },
  { field: 'description', id: 'description', placeholder: 'Description' },
  { field: 'issue_date', id: 'issue_date', placeholder: 'Issue Date' },
  { field: 'custom_1', id: 'issuer_name', placeholder: 'Issuer Name / Signature' },
] as const

export function getBlankTemplateFieldIds(): string[] {
  return BLANK_TEMPLATE_FIELDS.map(f => f.id)
}

function fieldElement(
  def: BlankFieldDef,
  layout: {
    x: number
    y: number
    width: number
    height: number
    fontSize: number
    originX?: FieldElement['originX']
    textAlign?: FieldElement['textAlign']
  }
): FieldElement {
  return {
    type: 'field',
    id: def.id,
    field: def.field,
    placeholder: def.placeholder,
    fontFamily: 'Inter',
    fontSize: layout.fontSize,
    fontWeight: 'normal',
    fontStyle: 'normal',
    fill: '#1a1a1a',
    textAlign: layout.textAlign ?? 'center',
    autoShrink: true,
    minFontSize: Math.max(12, Math.floor(layout.fontSize * 0.6)),
    maxLines: def.field === 'description' ? 3 : 1,
    x: layout.x,
    y: layout.y,
    width: layout.width,
    height: layout.height,
    angle: 0,
    scaleX: 1,
    scaleY: 1,
    originX: layout.originX ?? 'center',
    originY: 'top',
    opacity: 1,
  }
}

const BLANK_FIELD_LAYOUT: Record<
  string,
  {
    x: number
    y: number
    width: number
    height: number
    fontSize: number
  }
> = {
  recipient_name: { x: 561.5, y: 280, width: 640, height: 52, fontSize: 36 },
  certificate_title: { x: 561.5, y: 160, width: 700, height: 56, fontSize: 42 },
  description: { x: 561.5, y: 380, width: 720, height: 72, fontSize: 18 },
  issue_date: { x: 561.5, y: 520, width: 280, height: 28, fontSize: 16 },
  issuer_name: { x: 561.5, y: 640, width: 320, height: 36, fontSize: 18 },
}

/**
 * Blank landscape page (1123×794) with common fields placed sensibly.
 * Element order follows BLANK_TEMPLATE_FIELDS so new fields only need that list + layout.
 */
export function createBlankLandscapeTemplate(): DesignConfigV3 {
  const width = 1123
  const height = 794

  const elements: Element[] = BLANK_TEMPLATE_FIELDS.map(def => {
    const layout = BLANK_FIELD_LAYOUT[def.id]
    if (!layout) {
      throw new Error(`Missing blank layout for field id "${def.id}"`)
    }
    return fieldElement(def, layout)
  })

  return {
    version: 3,
    pages: [{
      width,
      height,
      unit: 'px',
      background: {
        type: 'color',
        color: '#ffffff',
      },
      elements,
    }],
  }
}
