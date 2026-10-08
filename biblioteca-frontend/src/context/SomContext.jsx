import { createContext, useContext, useState, useCallback, useRef } from 'react'

const SomContext = createContext(null)

const SONS_VALIDOS = ['click', 'confirm', 'success', 'error', 'toggle', 'navigate', 'delete', 'login']

/**
 * Variação de playbackRate por tipo de som.
 * Sons de feedback têm variação menor (identidade preservada).
 * Sons de clique têm variação maior (sensação de teclado mecânico).
 */
const VARIACAO_RATE = {
  click:    { min: 0.88, max: 1.14 },
  confirm:  { min: 0.93, max: 1.07 },
  success:  { min: 0.96, max: 1.04 },
  error:    { min: 0.95, max: 1.05 },
  toggle:   { min: 0.90, max: 1.10 },
  navigate: { min: 0.92, max: 1.08 },
  delete:   { min: 0.90, max: 1.10 },
  login:    { min: 0.97, max: 1.03 },
}

function sortearRate(nome) {
  const { min, max } = VARIACAO_RATE[nome] ?? { min: 1, max: 1 }
  return min + Math.random() * (max - min)
}

function lerStorage(chave, fallback) {
  try {
    const v = localStorage.getItem(chave)
    return v === null ? fallback : v
  } catch {
    return fallback
  }
}

export function SomProvider({ children }) {
  const [somAtivo, setSomAtivo] = useState(() =>
    lerStorage('som-ativo', 'true') === 'true'
  )

  // Volume global: 0.0 a 1.0, padrão 0.4
  const [volume, setVolume] = useState(() => {
    const v = parseFloat(lerStorage('som-volume', '0.4'))
    return isNaN(v) ? 0.4 : Math.min(1, Math.max(0, v))
  })

  // AudioContext compartilhado — criado uma vez, reutilizado sempre
  const ctxRef = useRef(null)

  function getAudioContext() {
    if (!ctxRef.current) {
      try {
        ctxRef.current = new (window.AudioContext || window.webkitAudioContext)()
      } catch {
        return null
      }
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume().catch(() => {})
    }
    return ctxRef.current
  }

  const alternarSom = useCallback(() => {
    setSomAtivo(prev => {
      const novo = !prev
      try { localStorage.setItem('som-ativo', String(novo)) } catch {}
      return novo
    })
  }, [])

  const definirVolume = useCallback((v) => {
    const val = Math.min(1, Math.max(0, v))
    setVolume(val)
    try { localStorage.setItem('som-volume', String(val)) } catch {}
    // Se estava mutado e o usuário moveu o slider, reativa
    if (val > 0) {
      setSomAtivo(true)
      try { localStorage.setItem('som-ativo', 'true') } catch {}
    }
  }, [])

  const tocar = useCallback((nome) => {
    if (!somAtivo) return
    if (!SONS_VALIDOS.includes(nome)) return
    if (volume === 0) return

    const audioCtx = getAudioContext()

    // Fallback para new Audio() se Web Audio API não estiver disponível
    if (!audioCtx) {
      try {
        const audio = new Audio(`/sounds/${nome}.ogg`)
        audio.volume = volume
        audio.play().catch(() => {})
      } catch {}
      return
    }

    fetch(`/sounds/${nome}.ogg`)
      .then(r => r.arrayBuffer())
      .then(buf => audioCtx.decodeAudioData(buf))
      .then(decoded => {
        const source = audioCtx.createBufferSource()
        source.buffer = decoded

        const gain = audioCtx.createGain()
        gain.gain.value = volume

        source.playbackRate.value = sortearRate(nome)

        source.connect(gain)
        gain.connect(audioCtx.destination)
        source.start(0)
      })
      .catch(() => {})
  }, [somAtivo, volume]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <SomContext.Provider value={{ somAtivo, alternarSom, tocar, volume, definirVolume }}>
      {children}
    </SomContext.Provider>
  )
}

export function useSom() {
  const ctx = useContext(SomContext)
  if (!ctx) throw new Error('useSom deve ser usado dentro de <SomProvider>')
  return ctx
}
