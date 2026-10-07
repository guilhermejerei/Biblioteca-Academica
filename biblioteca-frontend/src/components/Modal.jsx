import './Modal.css'

/**
 * Modal genérico reutilizável.
 *
 * Props:
 * - titulo: string com o título do modal
 * - onFechar: função chamada ao fechar
 * - children: conteúdo interno (formulário, etc.)
 */
export default function Modal({ titulo, onFechar, children }) {
  return (
    <div className="modal-overlay" onClick={onFechar}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{titulo}</h2>
          <button className="modal-fechar" onClick={onFechar}>✕</button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  )
}
