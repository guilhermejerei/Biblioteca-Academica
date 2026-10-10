import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { OPCOES_FONTE, DEFAULTS, validar } from './CatalogoAparencia'

const PreferenciasContext = createContext(null)

function ler(chave, fallback) {
  try {
    const v = localStorage.getItem(chave)
    return v === null ? fallback : v
  } catch {
    return fallback
  }
}

function salvar(chave, valor) {
  try { localStorage.setItem(chave, valor) } catch {}
}

export function PreferenciasProvider({ children }) {
  const [fonte, setFonte] = useState(() =>
    validar(ler('pref-fonte', DEFAULTS.fonte), OPCOES_FONTE, DEFAULTS.fonte)
  )

  /**
   * O cursor de ponto fica em null até o primeiro efeito, porque a escolha
   * depende de duas coisas que só o navegador sabe: se quem está usando pediu
   * menos movimento no sistema e se existe mouse de verdade. Quem já tinha
   * mexido na preferência vence da heurística.
   *
   * A chave antiga (ponto_no_cursor) vem do CursorDot, que guardava a
   * preferência em si mesmo. Ela é lida uma vez e apagada: sem a migração,
   * quem já tinha ligado o cursor voltaria ao padrão do sistema sem nunca
   * ter pedido isso.
   */
  const [cursorPonto, setCursorPonto] = useState(() => {
    const guardado = ler('pref-cursor-ponto', null)
    if (guardado !== null) return guardado === '1'

    const antigo = ler('ponto_no_cursor', null)
    if (antigo !== null) {
      salvar('pref-cursor-ponto', antigo)
      try { localStorage.removeItem('ponto_no_cursor') } catch {}
      return antigo === '1'
    }
    return null
  })

  useEffect(() => {
    if (cursorPonto !== null) return
    const semMouse = window.matchMedia('(hover: none) and (pointer: coarse)').matches
    const menosMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setCursorPonto(!semMouse && !menosMovimento)
  }, [cursorPonto])

  /* ── Efeito colateral: o atributo no <html> ────────────────────
     O que muda o site de verdade mora como atributo no <html>, e não em
     estado solto dentro de um componente. É o que permite ao CSS responder
     à preferência sem saber de React — e o que sobrevive à troca de página
     sem piscar. */
  useEffect(() => {
    document.documentElement.dataset.fonte = fonte
  }, [fonte])

  const definirFonte = useCallback(v => {
    const val = validar(v, OPCOES_FONTE, DEFAULTS.fonte)
    setFonte(val)
    salvar('pref-fonte', val)
  }, [])

  const definirCursorPonto = useCallback(v => {
    const val = !!v
    setCursorPonto(val)
    salvar('pref-cursor-ponto', val ? '1' : '0')
  }, [])

  const restaurar = useCallback(() => {
    setFonte(DEFAULTS.fonte)
    salvar('pref-fonte', DEFAULTS.fonte)
    // O cursor fica de fora: ligá-lo de surpresa seria esconder a seta do
    // sistema sem ninguém ter pedido. A posição dele é restaurada só
    // visualmente — a preferência guardada continua valendo.
  }, [])

  const padroes = fonte === DEFAULTS.fonte

  const valor = useMemo(
    () => ({ fonte, cursorPonto, definirFonte, definirCursorPonto, restaurar, padroes }),
    [fonte, cursorPonto, definirFonte, definirCursorPonto, restaurar, padroes]
  )

  return (
    <PreferenciasContext.Provider value={valor}>
      {children}
    </PreferenciasContext.Provider>
  )
}

export function usePreferencias() {
  const ctx = useContext(PreferenciasContext)
  if (!ctx) throw new Error('usePreferencias deve ser usado dentro de <PreferenciasProvider>')
  return ctx
}