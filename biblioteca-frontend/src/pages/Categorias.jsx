import { useEffect, useState, useMemo } from 'react'
import Formulario from '../components/Formulario'
import Paginacao from '../components/Paginacao'
import { useDialogo } from '../context/DialogoContext'
import { listarCategorias, cadastrarCategoria, atualizarCategoria, excluirCategoria } from '../api/categorias'
import './Pagina.css'
import './ListaComBusca.css'

const CAMPOS = [{ name: 'nome', label: 'Nome', required: true, placeholder: 'Nome da categoria' }]

const POR_PAGINA_PADRAO = 20

export default function Categorias() {
  const { alertar, confirmar } = useDialogo()
  const [categorias, setCategorias]       = useState([])
  const [busca, setBusca]                 = useState('')
  const [drawerAberto, setDrawerAberto]   = useState(false)
  const [editando, setEditando]           = useState(null)
  const [valores, setValores]             = useState({ nome: '' })
  const [erro, setErro]                   = useState('')
  const [erroGeral, setErroGeral]         = useState('')
  const [carregando, setCarregando]       = useState(true)
  const [pagina, setPagina]               = useState(1)
  const [porPagina, setPorPagina]         = useState(POR_PAGINA_PADRAO)

  async function carregar() {
    try { setCategorias(await listarCategorias()) }
    catch { setErroGeral('Não foi possível carregar as categorias.') }
    finally { setCarregando(false) }
  }

  useEffect(() => { carregar() }, [])

  function abrirNovo()    { setEditando(null); setValores({ nome: '' }); setErro(''); setDrawerAberto(true) }
  function abrirEdicao(c) { setEditando(c); setValores({ nome: c.nome }); setErro(''); setDrawerAberto(true) }
  function fechar()       { setDrawerAberto(false); setErro('') }

  async function handleSubmit(e) {
    e.preventDefault(); setErro('')
    try {
      if (editando) await atualizarCategoria(editando.id, valores)
      else await cadastrarCategoria(valores)
      fechar(); carregar()
    } catch (err) {
      setErro(err.response?.data?.erro || err.message || 'Erro ao salvar.')
    }
  }

  async function handleExcluir(id) {
    const ok = await confirmar('Excluir esta categoria?', 'Excluir categoria')
    if (!ok) return
    try { await excluirCategoria(id); carregar() }
    catch (err) { await alertar(err.response?.data?.erro || 'Não foi possível excluir.', 'erro') }
  }

  const filtrados = useMemo(() => {
    if (!busca.trim()) return categorias
    const q = busca.toLowerCase()
    return categorias.filter(c => c.nome.toLowerCase().includes(q))
  }, [categorias, busca])

  // ── Paginação ────────────────────────────────────────
  // O acervo tem mais de uma centena de categorias, o que fazia a
  // lista virar um scroll longo. A lista inteira já vem em memória
  // (GET /api/categorias não pagina), então o recorte é feito aqui.
  useEffect(() => { setPagina(1) }, [busca, porPagina])

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / porPagina))
  const paginaSegura = Math.min(pagina, totalPaginas)
  const paginaAtual = useMemo(() => {
    const inicio = (paginaSegura - 1) * porPagina
    return filtrados.slice(inicio, inicio + porPagina)
  }, [filtrados, paginaSegura, porPagina])

  if (carregando) return (
    <div className="pagina"><div className="dashboard-carregando"><div className="spinner" /></div></div>
  )

  return (
    <div className={`bib-layout ${drawerAberto ? 'bib-layout--drawer-aberto' : ''}`}>
      <div className="bib-main">
        <div className="pagina-header">
          <div>
            <h1 className="pagina-titulo">Categorias</h1>
            <p className="pagina-subtitulo" aria-live="polite">
              {filtrados.length} de {categorias.length} categoria(s)
              {totalPaginas > 1 && ` · página ${paginaSegura} de ${totalPaginas}`}
            </p>
          </div>
          <button className="btn-primario" onClick={abrirNovo}>+ Nova Categoria</button>
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
            placeholder="Buscar categoria…"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            aria-label="Buscar categoria"
          />
          {busca && <button className="lcb-busca-limpar" onClick={() => setBusca('')} aria-label="Limpar">✕</button>}
        </div>

        {/* Lista */}
        {filtrados.length === 0 ? (
          <p className="tabela-vazia">Nenhuma categoria encontrada.</p>
        ) : (
          <>
            <ul className="lcb-lista">
              {paginaAtual.map(c => (
                <li key={c.id} className={`lcb-item ${editando?.id === c.id && drawerAberto ? 'lcb-item--ativo' : ''}`}>
                  <span className="lcb-item-nome">{c.nome}</span>
                  <div className="lcb-item-acoes">
                    <button className="btn-editar" onClick={() => abrirEdicao(c)}>Editar</button>
                    <button className="btn-excluir" onClick={() => handleExcluir(c.id)}>Excluir</button>
                  </div>
                </li>
              ))}
            </ul>

            <Paginacao
              pagina={paginaSegura}
              totalPaginas={totalPaginas}
              onChange={setPagina}
              porPagina={porPagina}
              onPorPagina={setPorPagina}
              rotulo="Paginação de categorias"
            />
          </>
        )}
      </div>

      {/* Drawer lateral */}
      {drawerAberto && (
        <>
          <div className="bib-drawer-backdrop" onClick={fechar} aria-hidden="true" />
          <aside className="bib-drawer">
            <div className="bib-drawer-header">
              <h2 className="bib-drawer-titulo">{editando ? 'Editar Categoria' : 'Nova Categoria'}</h2>
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
