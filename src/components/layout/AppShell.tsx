'use client'

import React, { createContext, useContext, useState } from 'react'
import { ThemeProvider } from '../theme/ThemeProvider'
import SettingsModal from './SettingsModal'

const SettingsContext = createContext<{
  openSettings: () => void
}>({
  openSettings: () => {},
})

export const useSettings = () => useContext(SettingsContext)

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  return (
    <ThemeProvider>
      <SettingsContext.Provider value={{ openSettings: () => setIsSettingsOpen(true) }}>
        <div className="flex h-dvh w-screen bg-background text-foreground overflow-hidden font-sans transition-colors duration-150">
          {children}
        </div>
        {isSettingsOpen && (
          <SettingsModal onClose={() => setIsSettingsOpen(false)} />
        )}
      </SettingsContext.Provider>
    </ThemeProvider>
  )
}
