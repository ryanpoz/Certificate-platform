import { Textbox, classRegistry } from 'fabric'
import type { TClassProperties } from 'fabric'
import { resolveFontFamily } from '../fonts'

export interface FieldTextProps extends TClassProperties<Textbox> {
  field?: string
  autoShrink?: boolean
  minFontSize?: number
  maxLines?: number
}

/**
 * FieldText - Custom Fabric object for dynamic fields
 * Renders text normally with a separate dashed chip outline and field label.
 * Stroke/dash must NOT be applied to the text glyphs (that causes garbled text).
 */
export class FieldText extends Textbox {
  declare field: string
  declare autoShrink: boolean
  declare minFontSize: number
  declare maxLines: number

  static override type = 'FieldText' as const

  constructor(text: string, options: Partial<FieldTextProps> = {}) {
    const fontFamily = resolveFontFamily(options.fontFamily || 'Inter')
    const textFill = typeof options.fill === 'string' ? options.fill : '#000000'

    super(text, {
      ...options,
      // Text styling — never stroke the glyphs (chip outline is drawn separately)
      fill: textFill,
      stroke: undefined,
      strokeWidth: 0,
      strokeDashArray: undefined,
      backgroundColor: undefined,
      textAlign: options.textAlign || 'center',
      fontFamily,
      fontSize: options.fontSize || 16,
    } as any)

    this.field = options.field || 'recipient_name'
    this.autoShrink = options.autoShrink ?? true
    this.minFontSize = options.minFontSize || 12
    this.maxLines = options.maxLines || 1
  }

  /**
   * Include custom properties in serialization
   */
  override toObject(): any {
    const obj = super.toObject()
    return {
      ...obj,
      field: this.field,
      autoShrink: this.autoShrink,
      minFontSize: this.minFontSize,
      maxLines: this.maxLines
    }
  }

  /**
   * Draw dashed chip outline + label around the text without distorting glyphs.
   */
  override _render(ctx: CanvasRenderingContext2D) {
    const w = this.width || 0
    const h = this.height || 0

    // Dashed chip outline (object-local coords, origin at center)
    ctx.save()
    ctx.strokeStyle = '#3b82f6'
    ctx.lineWidth = 1
    ctx.setLineDash([5, 5])
    ctx.strokeRect(-w / 2, -h / 2, w, h)
    ctx.restore()

    // Render text normally (no stroke on glyphs)
    super._render(ctx)

    // Field label above the chip
    const label = this.getFieldLabel()
    ctx.save()
    ctx.font = '10px sans-serif'
    ctx.fillStyle = '#3b82f6'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'bottom'
    ctx.fillText(label, -w / 2, -h / 2 - 4)
    ctx.restore()
  }

  getFieldLabel(): string {
    return this.field
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }
}

// Register the custom class with Fabric
classRegistry.setClass(FieldText)
classRegistry.setSVGClass(FieldText)
