import { useEffect, useState, useMemo } from 'react'
import Formulario from '../components/Formulario'
import { useDialogo } from '../context/DialogoContext'
import { useSom } from '../context/SomContext'
import { listarUsuarios, atualizarUsuario, excluirUsuario } from '../api/usuarios'
import './ListaComBusca.css'

const CAMPOS = [
  { name: 'nome',     label: 'Nome',     required: true,  placeholder: 'Nome completo' },
  { name: 'cpf',      label: 'CPF',      required: true,  placeholder: '000.000.000-00' },
  { name: 'email',    label: 'E-mail',   required: true,  type: 'email', placeholder: 'email@exemplo.com' },
  { name: 'telefone', label: 'Telefone', required: false, placeholder: '(00) 00000-0000' },
]

const TIPO_LABEL = { ALUNO: 'Aluno', BIBLIOTECARIO: 'Bibliotecário' }

export default function Usuarios() {
  const { alertar, confirmar } = useDialogo()
  const { tocar } = useSom()
  const [usuarios, setUsuarios]         = useState([])
  const [busca, setBusca]               = useState('')
  const [drawerAberto, setDrawerAberto] = useState(false)
  const [editando, setEditando]         = useState(null)
  const [valores, setValores]           = useState({})
  const [erro, setErro]                 = useState('')
  const [erroGeral, setErroGeral]       = useState('')
  const [carregando, setCarregando]     = useState(true)

  async function carregar() {
    try { setUsuarios(await listarUsuarios()) }
    catch { setErroGeral('Não foi possível carregar os usuários.') }
    finally { setCarregando(false) }
  }

  useEffect(() => { carregar() }, [])

  function abrirEdicao(u) {
    tocar('toggle')
    setEditando(u)
    setValores({ nome: u.nome, cpf: u.cpf, email: u.email, telefone: u.telefone ?? '' })
    setErro('')
    setDrawerAberto(true)
  }

  function fechar() { tocar('toggle'); setDrawerAberto(false); setErro('') }

  async function handleSubmit(e) {
    e.preventDefault(); setErro('')
    try {
      await atualizarUsuario(editando.id, valores)
      tocar('success')
      fechar(); carregar()
    } catch (err) {
      tocar('error')
      setErro(err.response?.data?.erro || err.message || 'Erro ao atualizar usuário.')
    }
  }

  async function handleExcluir(id) {
    const ok = await confirmar('Excluir este usuário?', 'Excluir usuário')
    if (!ok) return
    try { await excluirUsuario(id); tocar('delete'); carregar() }
    catch (err) { await alertar(err.response?.data?.erro || 'Não foi possível excluir.', 'erro') }
  }

  const filtrados = useMemo(() => {
    if (!busca.trim()) return usuarios
    const q = busca.toLowerCase()
    return usuarios.filter(u =>
      u.nome?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.cpf?.includes(q)
    )
  }, [usuarios, busca])

  if (carregando) return (
    <div className="pagina"><div className="dashboard-carregando"><div className="spinner" /></div></div>
  )

  return (
    <div className={`bib-layout ${drawerAberto ? 'bib-layout--drawer-aberto' : ''}`}>
      <div className="bib-main">
        <div className="pagina-header">
          <div>
            <h1 className="pagina-titulo">Usuários</h1>
            <p className="pagina-subtitulo">{filtrados.length} de {usuarios.length} usuário(s)</p>
          </div>
        </div>

        {erroGeral && <p className="erro-msg">{erroGeral}</p>}

        {/* Busca */}
        <div className="lcb-busca-wrapper">
          <svg className="lcb-busca-icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/>
          </svg>
          <input
            className="lcb-busca-input"
            type="search"
            placeholder="Buscar por nome, e-mail ou CPF…"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            aria-label="Buscar usuário"
          />
          {busca && <button className="lcb-busca-limpar" onClick={() => setBusca('')} aria-label="Limpar">✕</button>}
        </div>

        {/* Lista */}
        {filtrados.length === 0 ? (
          <p className="tabela-vazia">Nenhum usuário encontrado.</p>
        ) : (
          <ul className="lcb-lista">
            {filtrados.map(u => (
              <li key={u.id} className={`lcb-item lcb-item--usuario ${editando?.id === u.id && drawerAberto ? 'lcb-item--ativo' : ''}`}>
                <div className="lcb-usuario-info">
                  <span className="lcb-item-nome">{u.nome}</span>
                  <span className="lcb-usuario-meta">{u.email} · {u.cpf}</span>
                </div>
                <div className="lcb-item-acoes">
                  <span className={`lcb-tipo-badge lcb-tipo-${u.tipo}`}>
                    {TIPO_LABEL[u.tipo] ?? u.tipo}
                  </span>
                  <button className="btn-editar" onClick={() => abrirEdicao(u)}>Editar</button>
                  <button className="btn-excluir" onClick={() => handleExcluir(u.id)}>Excluir</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Drawer lateral */}
      {drawerAberto && (
        <>
          <div className="bib-drawer-backdrop" onClick={fechar} aria-hidden="true" />
          <aside className="bib-drawer">
            <div className="bib-drawer-header">
              <h2 className="bib-drawer-titulo">Editar Usuário</h2>
              <button className="bib-drawer-fechar" onClick={fechar} aria-label="Fechar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <div className="bib-drawer-corpo">
              {erro && <p className="erro-msg">{erro}</p>}
              <Formulario
                campos={CAMPOS}
                valores={valores}
                onChange={e => setValores({ ...valores, [e.target.name]: e.target.value })}
                onSubmit={handleSubmit}
                textoBotao="Atualizar"
              />
            </div>
          </aside>
        </>
      )}
    </div>
  )
}
