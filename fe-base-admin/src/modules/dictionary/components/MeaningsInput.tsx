import type { KeyboardEvent } from 'react'
import { useRef, useState } from 'react'
import { X } from 'lucide-react'

interface MeaningsInputProps {
  value: string[]
  onChange: (meanings: string[]) => void
  placeholder?: string
}

export function MeaningsInput({
  value,
  onChange,
  placeholder = 'Nhập nghĩa rồi Enter...',
}: MeaningsInputProps) {
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const addMeaning = (raw: string) => {
    const meaning = raw.trim()
    if (meaning && !value.includes(meaning)) onChange([...value, meaning])
    setInput('')
  }

  const removeMeaning = (meaning: string) => onChange(value.filter((m) => m !== meaning))

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addMeaning(input)
    } else if (e.key === 'Backspace' && !input && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div
      className="border-input focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 flex min-h-8 w-full flex-wrap items-center gap-1 rounded-lg border bg-transparent px-2 py-1 transition-colors cursor-text"
      onClick={() => inputRef.current?.focus()}
    >
      {value.map((meaning) => (
        <span
          key={meaning}
          className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-1.5 py-0.5 text-xs font-medium text-blue-700"
        >
          {meaning}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); removeMeaning(meaning) }}
            className="text-blue-400 hover:text-blue-700 transition-colors"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => { if (input.trim()) addMeaning(input) }}
        placeholder={value.length === 0 ? placeholder : ''}
        className="flex-1 min-w-[120px] bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
    </div>
  )
}
