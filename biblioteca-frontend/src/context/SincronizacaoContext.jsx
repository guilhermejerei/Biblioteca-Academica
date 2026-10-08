import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { sincronizarCapas } from '../api/livros'
import { useSom } from './SomContext'
import './SincronizacaoContext.css'

const SincronizacaoContext = createContext(null)

export function SincronizacaoProvider({ children }) {
  const [status, setStatus] = useState('idle') // 'idle' | 'rodando' | 'concluido' | 'erro'
  const [resultado, setResultado] = useState(null)
  const [mensagemErro, setMensagemErro] = useState('')
  const timerRef = useRef(null)
  const { tocar } = useSom()

  // ── Posição do toast (drag) ────────────────────────────
  // null = posição padrão CSS (bottom: 1.5rem, right: 1.5rem)
  // { x, y } = posição fixada pelo usuário após arrastar
  const [pos, setPos] = useState(null)
  const dragRef = useRef({ arrastando: false, origemX: 0, origemY: 0, posX: 0, posY: 0 })
  const toastRef = useRef(null)

  function onMouseDown(e) {
    // Ignora cliques em botões dentro do toast
    if (e.target.closest('button')) return
    e.preventDefault()
    const rect = toastRef.current?.getBoundingClientRect()
    if (!rect) return
    dragRef.current = {
      arrastando: true,
      origemX: e.clientX,
      origemY: e.clientY,
      posX: rect.left,
      posY: rect.top,
    }
  }

  useEffect(() => {
    function onMouseMove(e) {
      if (!dragRef.current.arrastando) return
      const dx = e.clientX - dragRef.current.origemX
      const dy = e.clientY - dragRef.current.origemY
      setPos({
        x: dragRef.current.posX + dx,
        y: dragRef.current.posY + dy,
      })
    }
    function onMouseUp() {
      dragRef.current.arrastando = false
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  // ── Sincronização ──────────────────────────────────────
  const sincronizar = useCallback(async () => {
    if (status === 'rodando') return
    setStatus('rodando')
    setResultado(null)
    setMensagemErro('')
    try {
      const rel = await sincronizarCapas()
      setResultado(rel)
      setStatus('concluido')
      timerRef.current = setTimeout(() => setStatus('idle'), 6000)
    } catch (err) {
      setMensagemErro(err.response?.data?.erro || 'Erro ao sincronizar capas.')
      setStatus('erro')
      timerRef.current = setTimeout(() => setStatus('idle'), 5000)
    }
  }, [status])

  function fecharToast() {
    clearTimeout(timerRef.current)
    setStatus('idle')
    setPos(null) // reseta posição ao fechar
  }

  useEffect(() => () => clearTimeout(timerRef.current), [])

  // Toca sons ao mudar status
  useEffect(() => {
    if (status === 'concluido') tocar('success')
    else if (status === 'erro') tocar('error')
  }, [status]) // eslint-disable-line react-hooks/exhaustive-deps

  const visivel = status !== 'idle'

  // Estilo inline de posição quando arrastado
  const estiloPos = pos
    ? { left: pos.x, top: pos.y, bottom: 'auto', right: 'auto' }
    : {}

  return (
    <SincronizacaoContext.Provider value={{ sincronizar, status }}>
      {children}

      {visivel && (
        <div
          ref={toastRef}
          className={`sinc-toast sinc-toast--${status}`}
          role="status"
          aria-live="polite"
          style={estiloPos}
          onMouseDown={onMouseDown}
          title="Arraste para mover"
        >
          <div className="sinc-toast-icone">
            {status === 'rodando' && <span className="sinc-spinner" />}
            {status === 'concluido' && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {status === 'erro' && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            )}
          </div>

          <div className="sinc-toast-texto">
            {status === 'rodando' && (
              <>
                <span className="sinc-toast-titulo">Sincronizando capas…</span>
                <span className="sinc-toast-sub">Buscando imagens nas APIs externas</span>
              </>
            )}
            {status === 'concluido' && resultado && (
              <>
                <span className="sinc-toast-titulo">Sincronização concluída</span>
                <span className="sinc-toast-sub">
                  {resultado.capasEncontradas} encontrada{resultado.capasEncontradas !== 1 ? 's' : ''}
                  {resultado.emRevisao > 0 ? ` · ${resultado.emRevisao} para revisar` : ''}
                  {resultado.semCapa > 0 ? ` · ${resultado.semCapa} sem capa` : ''}
                </span>
              </>
            )}
            {status === 'erro' && (
              <>
                <span className="sinc-toast-titulo">Falha na sincronização</span>
                <span className="sinc-toast-sub">{mensagemErro}</span>
              </>
            )}
          </div>

          {status !== 'rodando' && (
            <button className="sinc-toast-fechar" onClick={fecharToast} aria-label="Fechar notificação">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      )}
    </SincronizacaoContext.Provider>
  )
}

export function useSincronizacao() {
  const ctx = useContext(SincronizacaoContext)
  if (!ctx) throw new Error('useSincronizacao deve ser usado dentro de <SincronizacaoProvider>')
  return ctx
}
