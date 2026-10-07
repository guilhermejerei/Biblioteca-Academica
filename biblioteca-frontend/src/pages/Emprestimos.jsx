import { useEffect, useState } from 'react'
import Modal from '../components/Modal'
import Formulario from '../components/Formulario'
import { useDialogo } from '../context/DialogoContext'
import {
  listarEmprestimos, realizarEmprestimo, registrarDevolucao,
  buscarEmprestimosAtivos, buscarEmprestimosAtrasados, atualizarPrazo
} from '../api/emprestimos'
import { listarUsuarios } from '../api/usuarios'
import { listarLivros } from '../api/livros'
import './Pagina.css'
import './Emprestimos.css'

// ── Card de empréstimo (mobile e desktop) ────────────────────
function CardEmprestimo({ emp, original, onDevolver, onPrazo }) {
  const ativo = original?.status === 'ATIVO' || original?.status === 'ATRASADO'

  const statusCls = {
    ATIVO:     'badge-ativo',
    DEVOLVIDO: 'badge-devolvido',
    ATRASADO:  'badge-atrasado',
  }[original?.status] ?? ''

  return (
    <article className="emp-card">
      {/* Linha topo: título do livro + badge status */}
      <div className="emp-card-topo">
        <div className="emp-card-livro">
          <span className="emp-card-titulo">{original?.livro?.titulo ?? '—'}</span>
          <span className="emp-card-usuario">{original?.usuario?.nome ?? '—'}</span>
        </div>
        <span className={`badge ${statusCls}`}>{original?.status}</span>
      </div>

      {/* Datas + dias */}
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

      {/* Ações */}
      {ativo && (
        <div className="emp-card-acoes">
          <button className="btn-devolver" onClick={() => onDevolver(original.id)}>
            Registrar devolução
          </button>
          <button className="btn-prazo" onClick={() => onPrazo(original)}>
            Alterar prazo
          </button>
        </div>
      )}
      {!ativo && (
        <p className="texto-devolvido emp-card-devolvido">Empréstimo encerrado</p>
      )}
    </article>
  )
}

// ── Tabela desktop (colunas sem ID) ──────────────────────────
const COLUNAS_DESKTOP = [
  { chave: 'usuario.nome',          label: 'Usuário' },
  { chave: 'livro.titulo',          label: 'Livro' },
  { chave: 'dataEmprestimo',        label: 'Empréstimo' },
  { chave: 'dataPrevistaDevolucao', label: 'Prev. Devolução' },
  { chave: 'dataDevolucao',         label: 'Devolvido em' },
  { chave: 'status',                label: 'Status' },
  { chave: 'diasRestantes',         label: 'Dias' },
]

import Tabela from '../components/Tabela'

export default function Emprestimos() {
  const { alertar, confirmar } = useDialogo()

  const [emprestimos, setEmprestimos] = useState([])
  const [usuarios,    setUsuarios]    = useState([])
  const [livros,      setLivros]      = useState([])
  const [filtro,      setFiltro]      = useState('todos')
  const [modalAberto, setModalAberto] = useState(false)
  const [modalPrazo,  setModalPrazo]  = useState(false)
  const [emprestimoSelecionado, setEmprestimoSelecionado] = useState(null)
  const [valores,     setValores]     = useState({ usuarioId: '', livroId: '', dataPrevistaDevolucao: '' })
  const [valorPrazo,  setValorPrazo]  = useState({ novaDataPrevista: '' })
  const [erro,        setErro]        = useState('')
  const [erroGeral,   setErroGeral]   = useState('')
  const [carregando,  setCarregando]  = useState(true)

  async function carregar() {
    setErroGeral('')
    try {
      let dados
      if (filtro === 'ativos')         dados = await buscarEmprestimosAtivos()
      else if (filtro === 'atrasados') dados = await buscarEmprestimosAtrasados()
      else                             dados = await listarEmprestimos()
      setEmprestimos(dados)
    } catch {
      setErroGeral('Não foi possível carregar os empréstimos.')
    } finally {
      setCarregando(false)
    }
  }

  async function carregarSelects() {
    try {
      const [us, lv] = await Promise.all([listarUsuarios(), listarLivros()])
      setUsuarios(us)
      setLivros(lv)
    } catch { /* silencioso */ }
  }

  useEffect(() => { carregar() }, [filtro])
  useEffect(() => { carregarSelects() }, [])

  function dataDefault() {
    const d = new Date(); d.setDate(d.getDate() + 14)
    return d.toISOString().split('T')[0]
  }

  const camposEmprestimo = [
    { name: 'usuarioId', label: 'Usuário', required: true, type: 'select',
      options: usuarios.map(u => ({ value: u.id, label: `${u.nome} — ${u.cpf}` })) },
    { name: 'livroId', label: 'Livro', required: true, type: 'select',
      options: livros.map(l => ({
        value: l.id,
        label: `${l.titulo} (${l.quantidadeDisponivel} de ${l.quantidadeTotal ?? '?'} disponíveis)`,
        disabled: l.quantidadeDisponivel === 0
      })) },
    { name: 'dataPrevistaDevolucao', label: 'Data prevista de devolução',
      required: true, type: 'date' }
  ]

  const camposPrazo = [
    { name: 'novaDataPrevista', label: 'Nova data de devolução', required: true, type: 'date',
      min: new Date().toISOString().split('T')[0],
      info: 'A nova data deve ser hoje ou posterior. Não é possível retroagir o prazo.' }
  ]

  function abrirModal() {
    setValores({ usuarioId: '', livroId: '', dataPrevistaDevolucao: dataDefault() })
    setErro(''); setModalAberto(true)
  }
  function fecharModal()     { setModalAberto(false); setErro('') }
  function abrirModalPrazo(emp) {
    setEmprestimoSelecionado(emp)
    setValorPrazo({ novaDataPrevista: emp.dataPrevistaDevolucao ?? '' })
    setErro(''); setModalPrazo(true)
  }
  function fecharModalPrazo() { setModalPrazo(false); setErro(''); setEmprestimoSelecionado(null) }

  async function handleSubmit(e) {
    e.preventDefault(); setErro('')
    try {
      await realizarEmprestimo(parseInt(valores.usuarioId), parseInt(valores.livroId), valores.dataPrevistaDevolucao || null)
      fecharModal(); carregar(); carregarSelects()
    } catch (err) {
      const msg = err.response?.data?.erro || err.message || 'Erro ao realizar empréstimo.'
      if (err.response?.status === 409) { fecharModal(); await alertar(msg, 'aviso'); carregarSelects() }
      else setErro(msg)
    }
  }

  async function handleSubmitPrazo(e) {
    e.preventDefault(); setErro('')
    try {
      await atualizarPrazo(emprestimoSelecionado.id, valorPrazo.novaDataPrevista)
      fecharModalPrazo(); carregar()
    } catch (err) {
      setErro(err.response?.data?.erro || err.message || 'Erro ao atualizar prazo.')
    }
  }

  async function handleDevolver(id) {
    const ok = await confirmar('Confirmar devolução deste empréstimo?', 'Registrar devolução')
    if (!ok) return
    try { await registrarDevolucao(id); carregar(); carregarSelects() }
    catch (err) { await alertar(err.response?.data?.erro || 'Não foi possível registrar a devolução.', 'erro') }
  }

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
    status: badgeStatus(e.status),
    diasRestantes: formatarDias(e.diasRestantes, e.status)
  }))

  if (carregando) return (
    <div className="pagina"><div className="dashboard-carregando"><div className="spinner" /></div></div>
  )

  const FILTROS = [
    { key: 'todos',     label: 'Todos' },
    { key: 'ativos',    label: 'Ativos' },
    { key: 'atrasados', label: 'Atrasados' },
  ]

  return (
    <div className="pagina">
      <div className="pagina-header">
        <div>
          <h1 className="pagina-titulo">Empréstimos</h1>
          <p className="pagina-subtitulo">{emprestimos.length} registro(s)</p>
        </div>
        <button className="btn-primario" onClick={abrirModal}>Novo Empréstimo</button>
      </div>

      {/* Filtros de status */}
      <div className="emprestimos-filtros">
        {FILTROS.map(f => (
          <button key={f.key}
            className={`btn-filtro ${filtro === f.key ? 'ativo' : ''}`}
            onClick={() => setFiltro(f.key)}>
            {f.label}
          </button>
        ))}
      </div>

      {erroGeral && <p className="erro-msg">{erroGeral}</p>}

      {emprestimos.length === 0 ? (
        <div className="emp-vazio">Nenhum empréstimo encontrado.</div>
      ) : (
        <>
          {/* ── Desktop: tabela ─────────────────────────────── */}
          <div className="emp-tabela-wrapper">
            <Tabela
              colunas={COLUNAS_DESKTOP}
              dados={dadosFormatados}
              acoes={(emp) => {
                const original = emprestimos.find(e => e.id === emp.id)
                const ativo = original?.status === 'ATIVO' || original?.status === 'ATRASADO'
                return ativo ? (
                  <div className="acoes-emprestimo">
                    <button className="btn-devolver" onClick={() => handleDevolver(emp.id)}>Devolver</button>
                    <button className="btn-prazo" onClick={() => abrirModalPrazo(original)}>Prazo</button>
                  </div>
                ) : <span className="texto-devolvido">Devolvido</span>
              }}
            />
          </div>

          {/* ── Mobile: cards ───────────────────────────────── */}
          <div className="emp-cards-wrapper">
            {dadosFormatados.map(emp => (
              <CardEmprestimo
                key={emp.id}
                emp={emp}
                original={emprestimos.find(e => e.id === emp.id)}
                onDevolver={handleDevolver}
                onPrazo={abrirModalPrazo}
              />
            ))}
          </div>
        </>
      )}

      {/* Modal: Novo Empréstimo */}
      {modalAberto && (
        <Modal titulo="Novo Empréstimo" onFechar={fecharModal}>
          {erro && <p className="erro-msg">{erro}</p>}
          <Formulario campos={camposEmprestimo} valores={valores}
            onChange={e => setValores({ ...valores, [e.target.name]: e.target.value })}
            onSubmit={handleSubmit} textoBotao="Realizar Empréstimo" />
        </Modal>
      )}

      {/* Modal: Alterar Prazo */}
      {modalPrazo && (
        <Modal titulo="Alterar Prazo de Devolução" onFechar={fecharModalPrazo}>
          {erro && <p className="erro-msg">{erro}</p>}
          <p className="prazo-info">
            <strong>{emprestimoSelecionado?.livro?.titulo}</strong>
          </p>
          <Formulario campos={camposPrazo} valores={valorPrazo}
            onChange={e => setValorPrazo({ ...valorPrazo, [e.target.name]: e.target.value })}
            onSubmit={handleSubmitPrazo} textoBotao="Salvar Prazo" />
        </Modal>
      )}
    </div>
  )
}
