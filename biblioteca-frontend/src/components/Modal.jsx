import './Modal.css'

/**
 * Modal genérico reutilizável.
 *
 * Props:
 * - titulo: string com o título do modal
 * - onFechar: função chamada ao fechar
 * - largo: true abre mais larga, para o que precisa de mais de uma coluna
 * - children: conteúdo interno (formulário, etc.)
 */
export default function Modal({ titulo, onFechar, largo = false, children }) {
  return (
    <div className="modal-overlay" onClick={onFechar}>
      <div
        className={`modal-box ${largo ? 'modal-box--largo' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
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
