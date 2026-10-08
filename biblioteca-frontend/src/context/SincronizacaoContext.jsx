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

  // Dispara a sincronização — pode ser chamado de qualquer página
  const sincronizar = useCallback(async () => {
    if (status === 'rodando') return
    setStatus('rodando')
    setResultado(null)
    setMensagemErro('')
    try {
      const rel = await sincronizarCapas()
      setResultado(rel)
      setStatus('concluido')
      // Some automaticamente após 6 segundos
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
  }

  // Limpa timer ao desmontar
  useEffect(() => () => clearTimeout(timerRef.current), [])

  // Toca sons ao mudar status
  useEffect(() => {
    if (status === 'concluido') tocar('success')
    else if (status === 'erro') tocar('error')
  }, [status]) // eslint-disable-line react-hooks/exhaustive-deps

  const visivel = status !== 'idle'

  return (
    <SincronizacaoContext.Provider value={{ sincronizar, status }}>
      {children}

      {/* Toast flutuante — renderizado aqui, aparece em qualquer rota */}
      {visivel && (
        <div className={`sinc-toast sinc-toast--${status}`} role="status" aria-live="polite">
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
