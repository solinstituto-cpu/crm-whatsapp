'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// Tipos
type Theme = 'light' | 'dark' | 'auto'
type PrimaryColor = 'green' | 'blue' | 'purple' | 'red' | 'orange' | 'indigo' | 'pink' | 'teal' | 'cyan' | 'amber' | 'emerald' | 'rose' | 'custom'
type FontSize = 'small' | 'medium' | 'large'
type Density = 'compact' | 'comfortable' | 'spacious'

interface ThemeConfig {
  theme: Theme
  primaryColor: PrimaryColor
  customColor?: string // Cor hex personalizada
  fontSize: FontSize
  density: Density
  sidebarCollapsed: boolean
}

interface ThemeContextType {
  config: ThemeConfig
  setTheme: (theme: Theme) => void
  setPrimaryColor: (color: PrimaryColor) => void
  setCustomColor: (color: string) => void
  setFontSize: (size: FontSize) => void
  setDensity: (density: Density) => void
  setSidebarCollapsed: (collapsed: boolean) => void
  isDarkMode: boolean
}

const defaultConfig: ThemeConfig = {
  theme: 'light',
  primaryColor: 'green',
  customColor: '#16a34a',
  fontSize: 'medium',
  density: 'comfortable',
  sidebarCollapsed: false,
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

// Mapeamento de cores
export const colorMap: Record<Exclude<PrimaryColor, 'custom'>, { 
  primary: string
  primaryHover: string
  primaryLight: string
  primaryDark: string
  rgb: string
}> = {
  green: {
    primary: '#16a34a',
    primaryHover: '#15803d',
    primaryLight: '#dcfce7',
    primaryDark: '#14532d',
    rgb: '22, 163, 74',
  },
  blue: {
    primary: '#2563eb',
    primaryHover: '#1d4ed8',
    primaryLight: '#dbeafe',
    primaryDark: '#1e3a8a',
    rgb: '37, 99, 235',
  },
  purple: {
    primary: '#9333ea',
    primaryHover: '#7e22ce',
    primaryLight: '#f3e8ff',
    primaryDark: '#581c87',
    rgb: '147, 51, 234',
  },
  red: {
    primary: '#dc2626',
    primaryHover: '#b91c1c',
    primaryLight: '#fee2e2',
    primaryDark: '#7f1d1d',
    rgb: '220, 38, 38',
  },
  orange: {
    primary: '#ea580c',
    primaryHover: '#c2410c',
    primaryLight: '#ffedd5',
    primaryDark: '#7c2d12',
    rgb: '234, 88, 12',
  },
  indigo: {
    primary: '#4f46e5',
    primaryHover: '#4338ca',
    primaryLight: '#e0e7ff',
    primaryDark: '#312e81',
    rgb: '79, 70, 229',
  },
  pink: {
    primary: '#ec4899',
    primaryHover: '#db2777',
    primaryLight: '#fce7f3',
    primaryDark: '#831843',
    rgb: '236, 72, 153',
  },
  teal: {
    primary: '#14b8a6',
    primaryHover: '#0d9488',
    primaryLight: '#ccfbf1',
    primaryDark: '#134e4a',
    rgb: '20, 184, 166',
  },
  cyan: {
    primary: '#06b6d4',
    primaryHover: '#0891b2',
    primaryLight: '#cffafe',
    primaryDark: '#164e63',
    rgb: '6, 182, 212',
  },
  amber: {
    primary: '#f59e0b',
    primaryHover: '#d97706',
    primaryLight: '#fef3c7',
    primaryDark: '#78350f',
    rgb: '245, 158, 11',
  },
  emerald: {
    primary: '#10b981',
    primaryHover: '#059669',
    primaryLight: '#d1fae5',
    primaryDark: '#064e3b',
    rgb: '16, 185, 129',
  },
  rose: {
    primary: '#f43f5e',
    primaryHover: '#e11d48',
    primaryLight: '#ffe4e6',
    primaryDark: '#881337',
    rgb: '244, 63, 94',
  },
}

// Função para gerar cores a partir de um hex
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (result) {
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
  }
  return '22, 163, 74' // fallback verde
}

function adjustBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const amt = Math.round(2.55 * percent)
  const R = Math.max(0, Math.min(255, (num >> 16) + amt))
  const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amt))
  const B = Math.max(0, Math.min(255, (num & 0x0000FF) + amt))
  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)
}

export function getCustomColorPalette(hex: string) {
  return {
    primary: hex,
    primaryHover: adjustBrightness(hex, -15),
    primaryLight: adjustBrightness(hex, 70),
    primaryDark: adjustBrightness(hex, -40),
    rgb: hexToRgb(hex),
  }
}

// Mapeamento de tamanhos de fonte
export const fontSizeMap: Record<FontSize, string> = {
  small: '14px',
  medium: '16px',
  large: '18px',
}

// Mapeamento de densidade (padding/spacing)
export const densityMap: Record<Density, { padding: string; gap: string }> = {
  compact: { padding: '0.5rem', gap: '0.5rem' },
  comfortable: { padding: '1rem', gap: '1rem' },
  spacious: { padding: '1.5rem', gap: '1.5rem' },
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<ThemeConfig>(defaultConfig)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Carregar configurações do localStorage
  useEffect(() => {
    const saved = localStorage.getItem('theme_config')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setConfig({ ...defaultConfig, ...parsed })
      } catch (e) {
        console.log('Erro ao carregar tema')
      }
    }
    setMounted(true)
  }, [])

  // Detectar preferência do sistema e aplicar tema
  useEffect(() => {
    if (!mounted) return

    const applyTheme = () => {
      let dark = false
      
      if (config.theme === 'auto') {
        dark = window.matchMedia('(prefers-color-scheme: dark)').matches
      } else {
        dark = config.theme === 'dark'
      }
      
      setIsDarkMode(dark)
      
      // Aplicar classe no documento
      if (dark) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }

    applyTheme()

    // Listener para mudanças na preferência do sistema
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      if (config.theme === 'auto') {
        applyTheme()
      }
    }
    mediaQuery.addEventListener('change', handleChange)
    
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [config.theme, mounted])

  // Aplicar cores e estilos
  useEffect(() => {
    if (!mounted) return

    let colors
    if (config.primaryColor === 'custom' && config.customColor) {
      colors = getCustomColorPalette(config.customColor)
    } else if (config.primaryColor !== 'custom') {
      colors = colorMap[config.primaryColor]
    } else {
      colors = colorMap.green // fallback
    }
    
    const fontSize = fontSizeMap[config.fontSize]
    const density = densityMap[config.density]

    // Aplicar CSS variables
    document.documentElement.style.setProperty('--color-primary', colors.primary)
    document.documentElement.style.setProperty('--color-primary-hover', colors.primaryHover)
    document.documentElement.style.setProperty('--color-primary-light', colors.primaryLight)
    document.documentElement.style.setProperty('--color-primary-dark', colors.primaryDark)
    document.documentElement.style.setProperty('--color-primary-rgb', colors.rgb)
    document.documentElement.style.setProperty('--font-size-base', fontSize)
    document.documentElement.style.setProperty('--spacing-base', density.padding)
    document.documentElement.style.setProperty('--gap-base', density.gap)
  }, [config.primaryColor, config.customColor, config.fontSize, config.density, mounted])

  // Salvar no localStorage
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('theme_config', JSON.stringify(config))
    }
  }, [config, mounted])

  const setTheme = (theme: Theme) => {
    setConfig((prev) => ({ ...prev, theme }))
  }

  const setPrimaryColor = (primaryColor: PrimaryColor) => {
    setConfig((prev) => ({ ...prev, primaryColor }))
  }

  const setCustomColor = (customColor: string) => {
    setConfig((prev) => ({ ...prev, primaryColor: 'custom' as PrimaryColor, customColor }))
  }

  const setFontSize = (fontSize: FontSize) => {
    setConfig((prev) => ({ ...prev, fontSize }))
  }

  const setDensity = (density: Density) => {
    setConfig((prev) => ({ ...prev, density }))
  }

  const setSidebarCollapsed = (sidebarCollapsed: boolean) => {
    setConfig((prev) => ({ ...prev, sidebarCollapsed }))
  }

  // Evitar flash de tema errado
  if (!mounted) {
    return null
  }

  return (
    <ThemeContext.Provider
      value={{
        config,
        setTheme,
        setPrimaryColor,
        setCustomColor,
        setFontSize,
        setDensity,
        setSidebarCollapsed,
        isDarkMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
