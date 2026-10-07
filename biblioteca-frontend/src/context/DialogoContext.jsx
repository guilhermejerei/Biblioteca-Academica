import { createContext, useContext, useState, useCallback, useRef } from 'react'
import './DialogoContext.css'

/**
 * DialogoContext — substitui alert(), confirm() e prompt() do navegador.
 *
 * Expõe via useDialogo():
 *   - alertar(mensagem, variante?)  → abre modal de feedback (sucesso/erro/aviso)
 *   - confirmar(mensagem, titulo?)  → abre modal de confirmação; retorna Promise<boolean>
 *
 * Variantes para alertar: 'sucesso' | 'erro' | 'aviso' (padrão: 'aviso')
 *
 * Uso:
 *   const { alertar, confirmar } = useDialogo()
 *   await alertar('Salvo com sucesso!', 'sucesso')
 *   const ok = await confirmar('Deseja excluir este autor?')
 *   if (ok) { ... }
 */

const DialogoContext = createContext(null)

export function DialogoProvider({ children }) {
  const [dialogo, setDialogo] = useState(null)
  const resolveRef = useRef(null)

  // Modal de feedback simples (OK)
  const alertar = useCallback((mensagem, variante = 'aviso') => {
    return new Promise((resolve) => {
      resolveRef.current = resolve
      setDialogo({ tipo: 'alerta', mensagem, variante })
    })
  }, [])

  // Modal de confirmação (Confirmar / Cancelar)
  const confirmar = useCallback((mensagem, titulo = 'Confirmar ação') => {
    return new Promise((resolve) => {
      resolveRef.current = resolve
      setDialogo({ tipo: 'confirmacao', mensagem, titulo })
    })
  }, [])

  function fechar(resultado) {
    setDialogo(null)
    if (resolveRef.current) {
      resolveRef.current(resultado)
      resolveRef.current = null
    }
  }

  function handleOverlayClick() { fechar(false) }

  function handleKeyDown(e) {
    if (e.key === 'Escape') fechar(false)
  }

  const icones = {
    sucesso: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    erro: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
      </svg>
    ),
    aviso: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    ),
    confirmacao: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
      </svg>
    )
  }

  const titulos = { sucesso: 'Sucesso', erro: 'Erro', aviso: 'Atenção' }

  return (
    <DialogoContext.Provider value={{ alertar, confirmar }}>
      {children}

      {dialogo && (
        <div
          className="dialogo-overlay"
          onClick={handleOverlayClick}
          onKeyDown={handleKeyDown}
          role="dialog"
          aria-modal="true"
          aria-label={dialogo.tipo === 'confirmacao' ? dialogo.titulo : titulos[dialogo.variante]}
        >
          <div
            className={`dialogo-box dialogo-${dialogo.tipo === 'confirmacao' ? 'confirmacao' : dialogo.variante}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ícone */}
            <div className={`dialogo-icone icone-${dialogo.tipo === 'confirmacao' ? 'aviso' : dialogo.variante}`}>
              {icones[dialogo.tipo === 'confirmacao' ? 'confirmacao' : dialogo.variante]}
            </div>

            {/* Título */}
            <h3 className="dialogo-titulo">
              {dialogo.tipo === 'confirmacao' ? dialogo.titulo : titulos[dialogo.variante]}
            </h3>

            {/* Mensagem */}
            <p className="dialogo-mensagem">{dialogo.mensagem}</p>

            {/* Botões */}
            <div className="dialogo-acoes">
              {dialogo.tipo === 'alerta' ? (
                <button
                  className="btn-dialogo btn-dialogo-primario"
                  onClick={() => fechar(true)}
                  autoFocus
                >
                  OK
                </button>
              ) : (
                <>
                  <button
                    className="btn-dialogo btn-dialogo-secundario"
                    onClick={() => fechar(false)}
                  >
                    Cancelar
                  </button>
                  <button
                    className="btn-dialogo btn-dialogo-destrutivo"
                    onClick={() => fechar(true)}
                    autoFocus
                  >
                    Confirmar
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </DialogoContext.Provider>
  )
}

export function useDialogo() {
  const ctx = useContext(DialogoContext)
  if (!ctx) throw new Error('useDialogo deve ser usado dentro de <DialogoProvider>')
  return ctx
}
