import {
  TEMPLATES,
  getTemplateCatalog,
  getCatalogCategories,
  filterCatalogByCategory,
  getTemplateOrientation,
  getTemplateDisplayName,
} from '@/app/dashboard/lab/fabric/templates'
import {
  BLANK_TEMPLATE_ID,
  BLANK_TEMPLATE_FIELDS,
  getBlankTemplateFieldIds,
  createBlankLandscapeTemplate,
} from '@/app/dashboard/lab/fabric/blank-template'
import {
  collectTextById,
  mergeTextById,
  resolveTextById,
  applyTextById,
} from '@/lib/fabric/text-by-id'
import {
  fieldKeysFromElements,
  selectFieldsToCarry,
  clampFieldPosition,
  type CarryFieldSnapshot,
} from '@/lib/fabric/carry-fields'

describe('Blank landscape template', () => {
  it('exposes a stable blank id', () => {
    expect(BLANK_TEMPLATE_ID).toBe('blank')
  })

  it('lists the common fields in order', () => {
    expect(getBlankTemplateFieldIds()).toEqual([
      'recipient_name',
      'certificate_title',
      'description',
      'issue_date',
      'issuer_name',
    ])
  })

  it('places each common field on a landscape page', () => {
    const config = createBlankLandscapeTemplate()
    const page = config.pages[0]

    expect(page.width).toBeGreaterThan(page.height)
    expect(page.background).toEqual({ type: 'color', color: '#ffffff' })

    const fieldEls = page.elements.filter(e => e.type === 'field')
    expect(fieldEls).toHaveLength(BLANK_TEMPLATE_FIELDS.length)

    const ids = fieldEls.map(e => e.id)
    expect(ids).toEqual(getBlankTemplateFieldIds())

    for (const def of BLANK_TEMPLATE_FIELDS) {
      const el = fieldEls.find(e => e.id === def.id)
      expect(el).toBeDefined()
      if (el && el.type === 'field') {
        expect(el.field).toBe(def.field)
        expect(el.placeholder).toBe(def.placeholder)
      }
    }
  })

  it('is not part of TEMPLATES (start-blank is separate from catalog)', () => {
    expect(TEMPLATES[BLANK_TEMPLATE_ID]).toBeUndefined()
  })
})

describe('Template catalog filtering', () => {
  const catalog = getTemplateCatalog()

  it('includes every TEMPLATES entry with name, category, and orientation', () => {
    expect(catalog.length).toBe(Object.keys(TEMPLATES).length)

    for (const entry of catalog) {
      expect(TEMPLATES[entry.key]).toBeDefined()
      expect(entry.name).toBe(getTemplateDisplayName(entry.key))
      expect(entry.category.length).toBeGreaterThan(0)
      expect(['Landscape', 'Portrait']).toContain(entry.orientation)
      expect(entry.orientation).toBe(getTemplateOrientation(entry.config))
    }
  })

  it('derives portrait vs landscape from page dimensions', () => {
    expect(getTemplateOrientation(TEMPLATES['modern-saas-gradient'])).toBe('Landscape')
    expect(getTemplateOrientation(TEMPLATES['portrait-academy-diploma'])).toBe('Portrait')
  })

  it('returns unique sorted categories for filter chips', () => {
    const categories = getCatalogCategories(catalog)
    expect(categories).toEqual([...categories].sort((a, b) => a.localeCompare(b)))
    expect(new Set(categories).size).toBe(categories.length)
    expect(categories.length).toBeGreaterThan(0)
  })

  it('filters by category and treats "all" as no filter', () => {
    const categories = getCatalogCategories(catalog)
    const first = categories[0]

    const filtered = filterCatalogByCategory(catalog, first)
    expect(filtered.length).toBeGreaterThan(0)
    expect(filtered.every(e => e.category === first)).toBe(true)

    expect(filterCatalogByCategory(catalog, 'all')).toEqual(catalog)
    expect(filterCatalogByCategory(catalog, '')).toEqual(catalog)
  })

  it('picks up new TEMPLATES entries without a hard-coded UI list', () => {
    const extra = {
      ...TEMPLATES,
      'future-neon': {
        version: 3 as const,
        pages: [{
          width: 1123,
          height: 794,
          unit: 'px' as const,
          background: { type: 'color' as const, color: '#000' },
          elements: [],
        }],
      },
    }
    const entries = getTemplateCatalog(extra)
    expect(entries.some(e => e.key === 'future-neon')).toBe(true)
    expect(entries.find(e => e.key === 'future-neon')?.orientation).toBe('Landscape')
  })
})

describe('Text-by-id preservation', () => {
  it('collects non-empty text keyed by id', () => {
    expect(
      collectTextById([
        { id: 'recipient_name', text: 'Alex' },
        { id: 'description', text: '' },
        { id: '', text: 'skip' },
        { id: 'issue_date', text: 'Oct 28' },
      ])
    ).toEqual({
      recipient_name: 'Alex',
      issue_date: 'Oct 28',
    })
  })

  it('merges collected text over previous values', () => {
    const previous = { recipient_name: 'Old', description: 'Keep me' }
    const collected = { recipient_name: 'New', issue_date: 'Today' }
    expect(mergeTextById(previous, collected)).toEqual({
      recipient_name: 'New',
      description: 'Keep me',
      issue_date: 'Today',
    })
  })

  it('resolves and applies text by id without inventing duplicates', () => {
    expect(resolveTextById('recipient_name', { recipient_name: 'Sam' })).toBe('Sam')
    expect(resolveTextById('missing', { recipient_name: 'Sam' })).toBeUndefined()

    const targets = [
      { id: 'recipient_name', text: 'Placeholder' },
      { id: 'description', text: 'Placeholder' },
      { id: 'unknown', text: 'Leave' },
    ]
    const updated = applyTextById(targets, {
      recipient_name: 'Sam',
      description: 'Did great',
    })

    expect(updated).toBe(2)
    expect(targets).toEqual([
      { id: 'recipient_name', text: 'Sam' },
      { id: 'description', text: 'Did great' },
      { id: 'unknown', text: 'Leave' },
    ])
  })
})

describe('Carry user-added fields across template switches', () => {
  const snap = (field: string, text = 'x'): CarryFieldSnapshot => ({
    field,
    text,
    left: 100,
    top: 100,
    width: 200,
    height: 50,
    fontSize: 24,
    fontFamily: 'Inter',
    fill: '#000',
    textAlign: 'center',
    autoShrink: true,
    minFontSize: 12,
    maxLines: 1,
    angle: 0,
    scaleX: 1,
    scaleY: 1,
    originX: 'left',
    originY: 'top',
  })

  it('collects field keys from design elements', () => {
    expect(
      fieldKeysFromElements([
        { type: 'field', field: 'recipient_name' },
        { type: 'text' },
        { type: 'field', field: 'custom_1' },
      ])
    ).toEqual(new Set(['recipient_name', 'custom_1']))
  })

  it('carries only user-added fields missing from the destination', () => {
    const snapshots = [
      snap('recipient_name', 'Alex'),
      snap('custom_1', 'Extra A'),
      snap('custom_2', 'Extra B'),
    ]
    const alreadyOnCanvas = new Set(['recipient_name', 'custom_1'])
    const userAdded = new Set(['custom_1', 'custom_2'])

    const carried = selectFieldsToCarry(snapshots, alreadyOnCanvas, userAdded)
    expect(carried.map(c => c.field)).toEqual(['custom_2'])
    expect(carried[0].text).toBe('Extra B')
  })

  it('does not duplicate field keys when carrying', () => {
    const snapshots = [snap('custom_2'), snap('custom_2')]
    const carried = selectFieldsToCarry(
      snapshots,
      new Set(['recipient_name']),
      new Set(['custom_2'])
    )
    expect(carried).toHaveLength(1)
  })

  it('skips non-user-added fields even if missing on destination', () => {
    const carried = selectFieldsToCarry(
      [snap('description')],
      new Set(['recipient_name']),
      new Set(['custom_1'])
    )
    expect(carried).toEqual([])
  })

  it('clamps carried field positions into the page', () => {
    expect(clampFieldPosition(-50, 900, 200, 1123, 794)).toEqual({
      left: 24,
      top: 770,
    })
  })
})
