'use client'

export type DynamicFieldOption = {
  field: string
  label: string
  placeholder: string
}

export const DYNAMIC_FIELD_OPTIONS: DynamicFieldOption[] = [
  { field: 'recipient_name', label: 'Recipient Name', placeholder: 'Recipient Name' },
  { field: 'issue_date', label: 'Issue Date', placeholder: 'Issue Date' },
  { field: 'course_name', label: 'Certificate Title', placeholder: 'Certificate Title' },
  { field: 'custom_1', label: 'Issuer Name', placeholder: 'Issuer Name' },
  { field: 'description', label: 'Description', placeholder: 'Description' },
]

export function TextPanel({
  onAddHeading,
  onAddSubheading,
  onAddBody,
  onAddField,
}: {
  onAddHeading: () => void
  onAddSubheading: () => void
  onAddBody: () => void
  onAddField: (option: DynamicFieldOption) => void
}) {
  return (
    <div className="space-y-4 text-sm">
      <h3 className="font-semibold text-gray-900">Text</h3>

      <div className="space-y-2">
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Add text</div>
        <button type="button" onClick={onAddHeading} className="w-full rounded border px-3 py-2 text-left hover:bg-gray-50">
          <div className="text-lg font-semibold">Heading</div>
        </button>
        <button type="button" onClick={onAddSubheading} className="w-full rounded border px-3 py-2 text-left hover:bg-gray-50">
          <div className="text-base font-medium">Subheading</div>
        </button>
        <button type="button" onClick={onAddBody} className="w-full rounded border px-3 py-2 text-left hover:bg-gray-50">
          <div className="text-sm">Body text</div>
        </button>
      </div>

      <div className="space-y-2">
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Add Field</div>
        {DYNAMIC_FIELD_OPTIONS.map(opt => (
          <button
            key={opt.field}
            type="button"
            onClick={() => onAddField(opt)}
            className="w-full rounded border border-blue-100 bg-blue-50/50 px-3 py-2 text-left text-xs hover:bg-blue-50"
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
