import { Textbox, classRegistry } from 'fabric'
import type { TClassProperties } from 'fabric'

export interface FieldTextProps extends TClassProperties<Textbox> {
  field?: string
  autoShrink?: boolean
  minFontSize?: number
  maxLines?: number
}

/**
 * FieldText - Custom Fabric object for dynamic fields
 * Renders as a labelled dashed chip showing the field name
 * Extends Textbox for text editing capabilities
 */
export class FieldText extends Textbox {
  declare field: string
  declare autoShrink: boolean
  declare minFontSize: number
  declare maxLines: number

  static override type = 'FieldText' as const

  constructor(text: string, options: Partial<FieldTextProps> = {}) {
    super(text, {
      ...options,
      // Chip styling
      strokeDashArray: [5, 5] as any,
      stroke: '#3b82f6',
      strokeWidth: 2,
      fill: 'rgba(59, 130, 246, 0.1)',
      backgroundColor: '#ffffff',
      // Text styling
      textAlign: options.textAlign || 'center',
      fontFamily: options.fontFamily || 'Inter',
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
   * Render the field label above the text
   */
  _renderText(ctx: CanvasRenderingContext2D) {
    super._renderText(ctx)
    
    // Draw field label
    const label = this.getFieldLabel()
    ctx.save()
    ctx.font = '10px Inter'
    ctx.fillStyle = '#3b82f6'
    ctx.textAlign = 'left'
    ctx.fillText(label, -this.width! / 2, -this.height! / 2 - 12)
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
