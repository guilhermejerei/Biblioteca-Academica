import { useEffect, useState, useMemo } from 'react'
import Formulario from '../components/Formulario'
import { useDialogo } from '../context/DialogoContext'
import { listarAutores, cadastrarAutor, atualizarAutor, excluirAutor } from '../api/autores'
import './Pagina.css'
import './ListaComBusca.css'

const CAMPOS = [{ name: 'nome', label: 'Nome', required: true, placeholder: 'Nome do autor' }]

export default function Autores() {
  const { alertar, confirmar } = useDialogo()
  const [autores, setAutores]             = useState([])
  const [busca, setBusca]                 = useState('')
  const [drawerAberto, setDrawerAberto]   = useState(false)
  const [editando, setEditando]           = useState(null)
  const [valores, setValores]             = useState({ nome: '' })
  const [erro, setErro]                   = useState('')
  const [erroGeral, setErroGeral]         = useState('')
  const [carregando, setCarregando]       = useState(true)

  async function carregar() {
    try { setAutores(await listarAutores()) }
    catch { setErroGeral('Não foi possível carregar os autores.') }
    finally { setCarregando(false) }
  }

  useEffect(() => { carregar() }, [])

  function abrirNovo()  { setEditando(null); setValores({ nome: '' }); setErro(''); setDrawerAberto(true) }
  function abrirEdicao(a) { setEditando(a); setValores({ nome: a.nome }); setErro(''); setDrawerAberto(true) }
  function fechar()     { setDrawerAberto(false); setErro('') }

  async function handleSubmit(e) {
    e.preventDefault(); setErro('')
    try {
      if (editando) await atualizarAutor(editando.id, valores)
      else await cadastrarAutor(valores)
      fechar(); carregar()
    } catch (err) {
      setErro(err.response?.data?.erro || err.message || 'Erro ao salvar.')
    }
  }

  async function handleExcluir(id) {
    const ok = await confirmar('Excluir este autor?', 'Excluir autor')
    if (!ok) return
    try { await excluirAutor(id); carregar() }
    catch (err) { await alertar(err.response?.data?.erro || 'Não foi possível excluir.', 'erro') }
  }

  const filtrados = useMemo(() => {
    if (!busca.trim()) return autores
    const q = busca.toLowerCase()
    return autores.filter(a => a.nome.toLowerCase().includes(q))
  }, [autores, busca])

  if (carregando) return (
    <div className="pagina"><div className="dashboard-carregando"><div className="spinner" /></div></div>
  )

  return (
    <div className={`bib-layout ${drawerAberto ? 'bib-layout--drawer-aberto' : ''}`}>
      <div className="bib-main">
        <div className="pagina-header">
          <div>
            <h1 className="pagina-titulo">Autores</h1>
            <p className="pagina-subtitulo">{filtrados.length} de {autores.length} autor(es)</p>
          </div>
          <button className="btn-primario" onClick={abrirNovo}>+ Novo Autor</button>
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
            placeholder="Buscar autor…"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            aria-label="Buscar autor"
          />
          {busca && <button className="lcb-busca-limpar" onClick={() => setBusca('')} aria-label="Limpar">✕</button>}
        </div>

        {/* Lista */}
        {filtrados.length === 0 ? (
          <p className="tabela-vazia">Nenhum autor encontrado.</p>
        ) : (
          <ul className="lcb-lista">
            {filtrados.map(a => (
              <li key={a.id} className={`lcb-item ${editando?.id === a.id && drawerAberto ? 'lcb-item--ativo' : ''}`}>
                <span className="lcb-item-nome">{a.nome}</span>
                <div className="lcb-item-acoes">
                  <button className="btn-editar" onClick={() => abrirEdicao(a)}>Editar</button>
                  <button className="btn-excluir" onClick={() => handleExcluir(a.id)}>Excluir</button>
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
              <h2 className="bib-drawer-titulo">{editando ? 'Editar Autor' : 'Novo Autor'}</h2>
              <button className="bib-drawer-fechar" onClick={fechar} aria-label="Fechar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <div className="bib-drawer-corpo">
              {erro && <p className="erro-msg">{erro}</p>}
              <Formulario
                campos={CAMPOS} valores={valores}
                onChange={e => setValores({ nome: e.target.value })}
                onSubmit={handleSubmit}
                textoBotao={editando ? 'Atualizar' : 'Cadastrar'}
              />
            </div>
          </aside>
        </>
      )}
    </div>
  )
}
