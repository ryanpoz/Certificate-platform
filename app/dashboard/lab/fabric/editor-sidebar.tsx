'use client'

import type { ReactNode } from 'react'

export type SidebarPanel = 'text' | 'uploads' | 'background' | 'elements' | null

const NAV: { id: Exclude<SidebarPanel, null>; label: string; icon: string }[] = [
  { id: 'text', label: 'Text', icon: 'T' },
  { id: 'uploads', label: 'Uploads', icon: '↑' },
  { id: 'background', label: 'Background', icon: 'BG' },
  { id: 'elements', label: 'Elements', icon: '◇' },
]

export function EditorSidebar({
  activePanel,
  onSelect,
  children,
}: {
  activePanel: SidebarPanel
  onSelect: (panel: SidebarPanel) => void
  children: ReactNode
}) {
  return (
    <div className="flex h-full shrink-0 border-r border-gray-200 bg-white">
      <div className="flex w-14 flex-col items-center gap-1 border-r border-gray-100 py-2">
        {NAV.map(item => {
          const active = activePanel === item.id
          return (
            <button
              key={item.id}
              type="button"
              title={item.label}
              onClick={() => onSelect(active ? null : item.id)}
              className={`flex h-11 w-11 flex-col items-center justify-center rounded-lg text-[10px] font-semibold ${
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="text-sm leading-none">{item.icon}</span>
              <span className="mt-0.5 truncate max-w-[40px]">{item.label.slice(0, 3)}</span>
            </button>
          )
        })}
      </div>
      {activePanel && (
        <div className="w-64 overflow-y-auto p-3">
          {children}
        </div>
      )}
    </div>
  )
}
