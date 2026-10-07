import './Tabela.css'

/**
 * Componente de tabela genérica reutilizável.
 *
 * Props:
 * - colunas: array de { chave, label } definindo as colunas
 * - dados: array de objetos com os dados
 * - acoes: função que recebe a linha e retorna botões de ação (opcional)
 */
export default function Tabela({ colunas, dados, acoes }) {
  if (!dados || dados.length === 0) {
    return <p className="tabela-vazia">Nenhum registro encontrado.</p>
  }

  return (
    <div className="tabela-container">
      <table className="tabela">
        <thead>
          <tr>
            {colunas.map((col) => (
              <th key={col.chave}>{col.label}</th>
            ))}
            {acoes && <th>Ações</th>}
          </tr>
        </thead>
        <tbody>
          {dados.map((linha, index) => (
            <tr key={linha.id ?? index}>
              {colunas.map((col) => (
                <td key={col.chave}>
                  {/* Suporte a colunas aninhadas como "autor.nome" */}
                  {col.chave.includes('.')
                    ? col.chave.split('.').reduce((obj, key) => obj?.[key], linha) ?? '—'
                    : linha[col.chave] ?? '—'}
                </td>
              ))}
              {acoes && <td className="tabela-acoes">{acoes(linha)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
