import { useState } from 'react'
import { storage } from '@lib/storage'

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    return storage.get<T>(key) ?? initialValue
  })

  const setValue = (value: T | ((prev: T) => T)) => {
    const valueToStore = value instanceof Function ? value(storedValue) : value
    setStoredValue(valueToStore)
    storage.set(key, valueToStore)
  }

  const removeValue = () => {
    setStoredValue(initialValue)
    storage.remove(key)
  }

  return [storedValue, setValue, removeValue] as const
}
