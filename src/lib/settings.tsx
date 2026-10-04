import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { loadSettings, saveSettings, type Preferences } from '../vedic/settings'

interface SettingsState {
  settings: Preferences
  update: (patch: Partial<Preferences>) => void
}

const SettingsContext = createContext<SettingsState | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Preferences>(loadSettings)
  const update = useCallback((patch: Partial<Preferences>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch }
      saveSettings(next)
      return next
    })
  }, [])
  const value = useMemo(() => ({ settings, update }), [settings, update])
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings(): SettingsState {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider')
  return ctx
}
