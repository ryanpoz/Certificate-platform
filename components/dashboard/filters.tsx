'use client'

import { useRouter, useSearchParams } from 'next/navigation'

interface FilterSelectProps {
  id: string
  label: string
  value: string
  options: { value: string; label: string }[]
  paramName: string
}

export function FilterSelect({ id, label, value, options, paramName }: FilterSelectProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function handleChange(newValue: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (newValue) {
      params.set(paramName, newValue)
    } else {
      params.delete(paramName)
    }
    params.delete('page')
    router.push(`?${params.toString()}`)
  }

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

interface FilterInputProps {
  id: string
  label: string
  type: 'text' | 'date'
  defaultValue: string
  paramName: string
  placeholder?: string
}

export function FilterInput({ id, label, type, defaultValue, paramName, placeholder }: FilterInputProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function handleChange(newValue: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (newValue) {
      params.set(paramName, newValue)
    } else {
      params.delete(paramName)
    }
    params.delete('page')
    router.push(`?${params.toString()}`)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      handleChange((e.target as HTMLInputElement).value)
    }
  }

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      {type === 'text' ? (
        <input
          type="text"
          id={id}
          defaultValue={defaultValue}
          placeholder={placeholder}
          onKeyDown={handleKeyDown}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
        />
      ) : (
        <input
          type="date"
          id={id}
          defaultValue={defaultValue}
          onChange={(e) => handleChange(e.target.value)}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
        />
      )}
    </div>
  )
}
