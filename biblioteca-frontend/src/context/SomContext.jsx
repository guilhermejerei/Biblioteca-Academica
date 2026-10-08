import { createContext, useContext, useState, useCallback } from 'react'

const SomContext = createContext(null)

const SONS_VALIDOS = ['click', 'confirm', 'success', 'error', 'toggle', 'navigate', 'delete', 'login']

export function SomProvider({ children }) {
  const [somAtivo, setSomAtivo] = useState(() => {
    try {
      const val = localStorage.getItem('som-ativo')
      return val === null ? true : val === 'true'
    } catch {
      return true
    }
  })

  const alternarSom = useCallback(() => {
    setSomAtivo(prev => {
      const novo = !prev
      try { localStorage.setItem('som-ativo', String(novo)) } catch {}
      return novo
    })
  }, [])

  const tocar = useCallback((nome) => {
    if (!somAtivo) return
    if (!SONS_VALIDOS.includes(nome)) return
    try {
      const audio = new Audio(`/sounds/${nome}.ogg`)
      audio.volume = 0.4
      audio.play().catch(() => {})
    } catch {}
  }, [somAtivo])

  return (
    <SomContext.Provider value={{somAtivo, alternarSom, tocar}}>
      {children}
    </SomContext.Provider>
  )
}

export function useSom() {
  const ctx = useContext(SomContext)
  if (!ctx) throw new Error('useSom deve ser usado dentro de <SomProvider>')
  return ctx
}
