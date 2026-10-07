import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { buscarEmprestimosPorUsuario } from '../api/emprestimos'
import Tabela from '../components/Tabela'
import './Pagina.css'
import './Emprestimos.css'

const COLUNAS_DESKTOP = [
  { chave: 'livro.titulo',          label: 'Livro' },
  { chave: 'dataEmprestimo',        label: 'Empréstimo' },
  { chave: 'dataPrevistaDevolucao', label: 'Devolução prevista' },
  { chave: 'dataDevolucao',         label: 'Devolvido em' },
  { chave: 'status',                label: 'Status' },
  { chave: 'diasRestantes',         label: 'Dias' },
]

// ── Card de empréstimo do aluno ──────────────────────────────
function MeuCardEmprestimo({ emp, original }) {
  const statusCls = {
    ATIVO:     'badge-ativo',
    DEVOLVIDO: 'badge-devolvido',
    ATRASADO:  'badge-atrasado',
  }[original?.status] ?? ''

  return (
    <article className="emp-card">
      <div className="emp-card-topo">
        <span className="emp-card-titulo">{original?.livro?.titulo ?? '—'}</span>
        <span className={`badge ${statusCls}`}>{original?.status}</span>
      </div>

      <div className="emp-card-datas">
        <div className="emp-card-data-item">
          <span className="emp-card-data-label">Empréstimo</span>
          <span className="emp-card-data-valor">{original?.dataEmprestimo ?? '—'}</span>
        </div>
        <div className="emp-card-data-item">
          <span className="emp-card-data-label">Devolução prevista</span>
          <span className="emp-card-data-valor">{original?.dataPrevistaDevolucao ?? '—'}</span>
        </div>
        {original?.dataDevolucao && (
          <div className="emp-card-data-item">
            <span className="emp-card-data-label">Devolvido em</span>
            <span className="emp-card-data-valor">{original.dataDevolucao}</span>
          </div>
        )}
        {emp.diasRestantes && emp.diasRestantes !== '—' && (
          <div className="emp-card-data-item">
            <span className="emp-card-data-label">Prazo</span>
            <span className="emp-card-data-valor">{emp.diasRestantes}</span>
          </div>
        )}
      </div>
    </article>
  )
}

export default function MeusEmprestimos() {
  const { usuario } = useAuth()
  const [emprestimos, setEmprestimos] = useState([])
  const [carregando, setCarregando]   = useState(true)
  const [erro, setErro]               = useState('')

  useEffect(() => {
    async function carregar() {
      try {
        const dados = await buscarEmprestimosPorUsuario(usuario.id)
        setEmprestimos(dados)
      } catch {
        setErro('Não foi possível carregar seus empréstimos.')
      } finally {
        setCarregando(false)
      }
    }
    if (usuario?.id) carregar()
  }, [usuario])

  function badgeStatus(status) {
    const cls = { ATIVO: 'badge-ativo', DEVOLVIDO: 'badge-devolvido', ATRASADO: 'badge-atrasado' }
    return <span className={`badge ${cls[status] ?? ''}`}>{status}</span>
  }

  function formatarDias(dias, status) {
    if (status === 'DEVOLVIDO' || dias === null || dias === undefined) return '—'
    if (status === 'ATRASADO') return <span className="dias-atrasado">{Math.abs(dias)}d atraso</span>
    return <span className="dias-restantes">{dias}d restantes</span>
  }

  const dadosFormatados = emprestimos.map(e => ({
    ...e,
    status:        badgeStatus(e.status),
    diasRestantes: formatarDias(e.diasRestantes, e.status),
  }))

  if (carregando) return (
    <div className="pagina"><div className="dashboard-carregando"><div className="spinner" /></div></div>
  )

  return (
    <div className="pagina">
      <div className="pagina-header">
        <div>
          <h1 className="pagina-titulo">Meus Empréstimos</h1>
          <p className="pagina-subtitulo">{emprestimos.length} registro(s)</p>
        </div>
      </div>

      {erro && <p className="erro-msg">{erro}</p>}

      {emprestimos.length === 0 ? (
        <div className="emp-vazio">Você não possui empréstimos registrados.</div>
      ) : (
        <>
          {/* Desktop */}
          <div className="emp-tabela-wrapper">
            <Tabela colunas={COLUNAS_DESKTOP} dados={dadosFormatados} />
          </div>

          {/* Mobile */}
          <div className="emp-cards-wrapper">
            {dadosFormatados.map(emp => (
              <MeuCardEmprestimo
                key={emp.id}
                emp={emp}
                original={emprestimos.find(e => e.id === emp.id)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
