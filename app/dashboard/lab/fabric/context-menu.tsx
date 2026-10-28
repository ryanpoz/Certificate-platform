'use client'

export type ContextMenuAction =
  | 'bring-forward'
  | 'send-backward'
  | 'bring-front'
  | 'send-back'
  | 'group'
  | 'ungroup'
  | 'duplicate'
  | 'delete'
  | 'lock'
  | 'unlock'
  | 'align-left'
  | 'align-center'
  | 'align-right'
  | 'align-top'
  | 'align-middle'
  | 'align-bottom'
  | 'distribute-h'
  | 'distribute-v'

export function ObjectContextMenu({
  x,
  y,
  canGroup,
  canUngroup,
  canDistribute,
  locked,
  onAction,
  onClose,
}: {
  x: number
  y: number
  canGroup: boolean
  canUngroup: boolean
  canDistribute: boolean
  locked: boolean
  onAction: (action: ContextMenuAction) => void
  onClose: () => void
}) {
  const item = (label: string, action: ContextMenuAction, enabled = true) => (
    <button
      key={action}
      type="button"
      disabled={!enabled}
      className="block w-full px-3 py-1.5 text-left text-xs hover:bg-gray-100 disabled:opacity-40"
      onClick={() => {
        onAction(action)
        onClose()
      }}
    >
      {label}
    </button>
  )

  return (
    <>
      <div className="fixed inset-0 z-[60]" onClick={onClose} onContextMenu={e => { e.preventDefault(); onClose() }} />
      <div
        className="fixed z-[70] min-w-[180px] rounded-md border border-gray-200 bg-white py-1 shadow-xl"
        style={{ left: x, top: y }}
        onMouseDown={e => e.stopPropagation()}
      >
        {item('Bring forward', 'bring-forward')}
        {item('Send backward', 'send-backward')}
        {item('Bring to front', 'bring-front')}
        {item('Send to back', 'send-back')}
        <div className="my-1 border-t border-gray-100" />
        {item('Align left', 'align-left')}
        {item('Align centre', 'align-center')}
        {item('Align right', 'align-right')}
        {item('Align top', 'align-top')}
        {item('Align middle', 'align-middle')}
        {item('Align bottom', 'align-bottom')}
        {item('Distribute horizontally', 'distribute-h', canDistribute)}
        {item('Distribute vertically', 'distribute-v', canDistribute)}
        <div className="my-1 border-t border-gray-100" />
        {item('Group', 'group', canGroup)}
        {item('Ungroup', 'ungroup', canUngroup)}
        {item('Duplicate', 'duplicate')}
        {item(locked ? 'Unlock' : 'Lock', locked ? 'unlock' : 'lock')}
        {item('Delete', 'delete')}
      </div>
    </>
  )
}
