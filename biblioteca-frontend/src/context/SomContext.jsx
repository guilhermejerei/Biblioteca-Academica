import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { NOMES_VALIDOS, VARIACAO_RATE, VOLUME_PADRAO } from './CatalogoSom'

const SomContext = createContext(null)

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
    const v = parseFloat(lerStorage('som-volume', String(VOLUME_PADRAO)))
    return isNaN(v) ? VOLUME_PADRAO : Math.min(1, Math.max(0, v))
  })

  // AudioContext compartilhado — criado uma vez, reutilizado sempre
  const ctxRef = useRef(null)

  /**
   * Áudio já decodificado, por nome.
   *
   * Antes cada disparo de som buscava o arquivo na rede e o decodificava de
   * novo. O clique ficava dependentemente na latência da rede, o que é
   * justamente o que faz um efeito sonoro parecer "travado". Guardando o
   * buffer decodificado, o disparo seguinte sai no mesmo quadro do clique.
   */
  const cacheRef = useRef(new Map())
  // Promessas em voo — evita que dois cliques rápidos busquem o mesmo arquivo
  const carregandoRef = useRef(new Map())

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

  /** Busca e decodifica uma vez só; quem chamar depois recebe do cache. */
  function carregarAudio(nome) {
    const audioCtx = getAudioContext()
    if (!audioCtx) return Promise.resolve(null)

    if (cacheRef.current.has(nome)) return Promise.resolve(cacheRef.current.get(nome))
    if (carregandoRef.current.has(nome)) return carregandoRef.current.get(nome)

    const promessa = fetch(`/sounds/${nome}.ogg`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.arrayBuffer()
      })
      .then(buf => audioCtx.decodeAudioData(buf))
      .then(decoded => {
        cacheRef.current.set(nome, decoded)
        return decoded
      })
      .catch(() => null)
      .finally(() => {
        carregandoRef.current.delete(nome)
      })

    carregandoRef.current.set(nome, promessa)
    return promessa
  }

  /** Toca um buffer. `volumeAlvo` é o ganho a aplicar nesta reprodução. */
  function reproduzir(audioCtx, decoded, nome, volumeAlvo) {
    const source = audioCtx.createBufferSource()
    source.buffer = decoded

    const gain = audioCtx.createGain()
    gain.gain.value = volumeAlvo

    source.playbackRate.value = sortearRate(nome)

    source.connect(gain)
    gain.connect(audioCtx.destination)
    source.start(0)
  }

  /**
   * Dispara um som respeitando o mute e o volume.
   * É o que os botões do site chamam.
   */
  const tocar = useCallback((nome) => {
    if (!somAtivo) return
    if (volume === 0) return
    if (!NOMES_VALIDOS.includes(nome)) return

    const audioCtx = getAudioContext()

    // Fallback para new Audio() se a Web Audio API não estiver disponível
    if (!audioCtx) {
      try {
        const audio = new Audio(`/sounds/${nome}.ogg`)
        audio.volume = volume
        audio.play().catch(() => {})
      } catch {}
      return
    }

    carregarAudio(nome).then(decoded => {
      if (!decoded) return
      // A preferência pode ter mudado entre o clique e a chegada do arquivo
      if (!somAtivo || volume === 0) return
      reproduzir(audioCtx, decoded, nome, volume)
    })
  }, [somAtivo, volume]) // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Toca um som para pré-visualização, ignorando o mute.
   *
   * Tocar um som desligado não seria uma pré-visualização: a tela de
   * Configurações precisa mostrar o que o som faz. Com o site mutado o ganho
   * sobe para um valor fixo e auditivo, nunca acima do volume escolhido — o
   * botão de teste é um fone de ouvido, não um controle de volume novo.
   */
  const testar = useCallback((nome) => {
    if (!NOMES_VALIDOS.includes(nome)) return

    const audioCtx = getAudioContext()
    if (!audioCtx) {
      try {
        const audio = new Audio(`/sounds/${nome}.ogg`)
        audio.volume = somAtivo ? volume : 0.6
        audio.play().catch(() => {})
      } catch {}
      return
    }

    carregarAudio(nome).then(decoded => {
      if (!decoded) return
      reproduzir(audioCtx, decoded, nome, somAtivo ? volume : 0.6)
    })
  }, [somAtivo, volume]) // eslint-disable-line react-hooks/exhaustive-deps

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

  /** Volta o som ao estado inicial: ligado e no volume padrão. */
  const restaurarSom = useCallback(() => {
    setSomAtivo(true)
    setVolume(VOLUME_PADRAO)
    try {
      localStorage.setItem('som-ativo', 'true')
      localStorage.setItem('som-volume', String(VOLUME_PADRAO))
    } catch {}
  }, [])

  return (
    <SomContext.Provider value={{ somAtivo, alternarSom, tocar, testar, volume, definirVolume, restaurarSom }}>
      {children}
    </SomContext.Provider>
  )
}

export function useSom() {
  const ctx = useContext(SomContext)
  if (!ctx) throw new Error('useSom deve ser usado dentro de <SomProvider>')
  return ctx
}