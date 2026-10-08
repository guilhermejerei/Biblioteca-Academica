import './Paginacao.css'

/**
 * Paginação reutilizável.
 *
 * Nasceu dentro de Livros.jsx e foi extraída para ser usada também por
 * Autores e Categorias, que tinham listas longas sem nenhuma quebra.
 *
 * Props:
 * - pagina: número da página atual (1-based)
 * - totalPaginas: total de páginas
 * - onChange: recebe a nova página
 * - porPagina / onPorPagina: opcionais. Quando os dois vêm, mostra o
 *   seletor de itens por página no canto.
 * - rotulo: nome acessível da navegação (ex: "Paginação de categorias")
 */
export default function Paginacao({
  pagina,
  totalPaginas,
  onChange,
  porPagina,
  onPorPagina,
  opcoesPorPagina = [10, 20, 50, 100],
  rotulo = 'Paginação'
}) {
  const mostrarSeletor = porPagina != null && onPorPagina != null

  if (totalPaginas <= 1 && !mostrarSeletor) return null

  /**
   * Máximo de 7 botões: sempre a primeira, a última e até 5 em torno da atual.
   * O que fica fora vira reticências, para não haver scroll lateral.
   */
  function paginas() {
    const lista = []
    const delta = 2
    for (let i = 1; i <= totalPaginas; i++) {
      if (i === 1 || i === totalPaginas || (i >= pagina - delta && i <= pagina + delta)) {
        lista.push(i)
      }
    }
    const comReticencias = []
    for (let i = 0; i < lista.length; i++) {
      if (i > 0 && lista[i] - lista[i - 1] > 1) comReticencias.push('…')
      comReticencias.push(lista[i])
    }
    return comReticencias
  }

  return (
    <div className="paginacao-area">
      {mostrarSeletor && (
        <label className="paginacao-por-pagina">
          <span>Por página</span>
          <select
            value={porPagina}
            onChange={e => onPorPagina(Number(e.target.value))}
            aria-label="Itens por página"
          >
            {opcoesPorPagina.map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>
      )}

      {totalPaginas > 1 && (
        <nav className="paginacao" aria-label={rotulo}>
          <button
            className="pag-btn pag-nav"
            disabled={pagina === 1}
            onClick={() => onChange(pagina - 1)}
            aria-label="Página anterior"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/>
            </svg>
          </button>

          {paginas().map((p, i) =>
            p === '…' ? (
              <span key={`e${i}`} className="pag-reticencias">…</span>
            ) : (
              <button
                key={p}
                className={`pag-btn ${p === pagina ? 'ativo' : ''}`}
                onClick={() => onChange(p)}
                aria-label={`Página ${p}`}
                aria-current={p === pagina ? 'page' : undefined}
              >{p}</button>
            )
          )}

          <button
            className="pag-btn pag-nav"
            disabled={pagina === totalPaginas}
            onClick={() => onChange(pagina + 1)}
            aria-label="Próxima página"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
            </svg>
          </button>
        </nav>
      )}
    </div>
  )
}