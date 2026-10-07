import './CardResumo.css'

/**
 * Card de resumo para o Dashboard.
 *
 * Props:
 * - titulo: string
 * - valor: number ou string
 * - icone: elemento SVG (JSX)
 * - cor: classe CSS extra ("card-verde", "card-vermelho", "card-amarelo")
 */
export default function CardResumo({ titulo, valor, icone, cor = '' }) {
  return (
    <div className={`card-resumo ${cor}`}>
      <div className="card-icone">{icone}</div>
      <div className="card-info">
        <span className="card-valor">{valor}</span>
        <span className="card-titulo">{titulo}</span>
      </div>
    </div>
  )
}
