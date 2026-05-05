import { useState, useCallback } from 'react'

export interface EditorEntry {
  id: string
  key: string
  rawValue: string
  keyError: string | null
  valueError: string | null
}

function makeId() {
  return crypto.randomUUID()
}

function isPlainObject(val: unknown): val is Record<string, unknown> {
  return val !== null && typeof val === 'object' && !Array.isArray(val)
}

function validateJson(raw: string): string | null {
  try {
    JSON.parse(raw)
    return null
  } catch {
    return 'JSON không hợp lệ'
  }
}

export function useJsonObjectEditor() {
  const [entries, setEntries] = useState<EditorEntry[]>([])

  const initFromJson = useCallback((jsonString: string, keyOrder?: string[]) => {
    try {
      const parsed = JSON.parse(jsonString)
      if (!isPlainObject(parsed)) {
        setEntries([])
        return
      }
      const allKeys = Object.keys(parsed)
      const orderedKeys =
        keyOrder && keyOrder.length > 0
          ? [
              ...keyOrder.filter((k) => allKeys.includes(k)),
              ...allKeys.filter((k) => !keyOrder.includes(k)),
            ]
          : allKeys
      setEntries(
        orderedKeys.map((key) => ({
          id: makeId(),
          key,
          rawValue: JSON.stringify(parsed[key], null, 2),
          keyError: null,
          valueError: null,
        })),
      )
    } catch {
      setEntries([])
    }
  }, [])

  const reorder = useCallback((newEntries: EditorEntry[]) => {
    setEntries(newEntries)
  }, [])

  const updateKey = useCallback((id: string, newKey: string) => {
    setEntries((prev) => {
      const isDuplicate = prev.some((e) => e.id !== id && e.key === newKey)
      return prev.map((e) =>
        e.id === id
          ? {
              ...e,
              key: newKey,
              keyError: !newKey.trim()
                ? 'Key không được để trống'
                : isDuplicate
                  ? 'Key đã tồn tại'
                  : null,
            }
          : e,
      )
    })
  }, [])

  const updateValue = useCallback((id: string, rawValue: string) => {
    setEntries((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, rawValue, valueError: validateJson(rawValue) } : e,
      ),
    )
  }, [])

  const addEntry = useCallback(() => {
    setEntries((prev) => [
      ...prev,
      { id: makeId(), key: '', rawValue: '""', keyError: 'Key không được để trống', valueError: null },
    ])
  }, [])

  const deleteEntry = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }, [])

  const hasErrors = entries.some(
    (e) => e.keyError !== null || e.valueError !== null,
  )

  const serialize = useCallback((): string => {
    if (entries.some((e) => e.keyError || e.valueError)) return ''
    try {
      const obj: Record<string, unknown> = {}
      for (const entry of entries) {
        obj[entry.key] = JSON.parse(entry.rawValue)
      }
      return JSON.stringify(obj, null, 2)
    } catch {
      return ''
    }
  }, [entries])

  return {
    entries,
    hasErrors,
    initFromJson,
    reorder,
    updateKey,
    updateValue,
    addEntry,
    deleteEntry,
    serialize,
  }
}
