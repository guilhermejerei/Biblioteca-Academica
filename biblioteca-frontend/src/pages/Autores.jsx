import { useEffect, useState, useMemo } from 'react'
import Formulario from '../components/Formulario'
import Paginacao from '../components/Paginacao'
import { useDialogo } from '../context/DialogoContext'
import { useSom } from '../context/SomContext'
import { listarAutores, cadastrarAutor, atualizarAutor, excluirAutor } from '../api/autores'
import './ListaComBusca.css'

const CAMPOS = [{ name: 'nome', label: 'Nome', required: true, placeholder: 'Nome do autor' }]

const POR_PAGINA_PADRAO = 20

export default function Autores() {
  const { alertar, confirmar } = useDialogo()
  const { tocar } = useSom()
  const [autores, setAutores]             = useState([])
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
    try { setAutores(await listarAutores()) }
    catch { setErroGeral('Não foi possível carregar os autores.') }
    finally { setCarregando(false) }
  }

  useEffect(() => { carregar() }, [])

  function abrirNovo()  { tocar('toggle'); setEditando(null); setValores({ nome: '' }); setErro(''); setDrawerAberto(true) }
  function abrirEdicao(a) { tocar('toggle'); setEditando(a); setValores({ nome: a.nome }); setErro(''); setDrawerAberto(true) }
  function fechar()     { tocar('toggle'); setDrawerAberto(false); setErro('') }

  async function handleSubmit(e) {
    e.preventDefault(); setErro('')
    try {
      if (editando) await atualizarAutor(editando.id, valores)
      else await cadastrarAutor(valores)
      tocar('success')
      fechar(); carregar()
    } catch (err) {
      tocar('error')
      setErro(err.response?.data?.erro || err.message || 'Erro ao salvar.')
    }
  }

  async function handleExcluir(id) {
    const ok = await confirmar('Excluir este autor?', 'Excluir autor')
    if (!ok) return
    try { await excluirAutor(id); tocar('delete'); carregar() }
    catch (err) { await alertar(err.response?.data?.erro || 'Não foi possível excluir.', 'erro') }
  }

  const filtrados = useMemo(() => {
    if (!busca.trim()) return autores
    const q = busca.toLowerCase()
    return autores.filter(a => a.nome.toLowerCase().includes(q))
  }, [autores, busca])

  // ── Paginação ────────────────────────────────────────
  // A lista inteira já está em memória (GET /api/autores não pagina),
  // então o recorte é feito aqui. Volta para a página 1 quando o
  // conjunto muda, para nunca cair numa página que ficou vazia.
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
            <h1 className="pagina-titulo">Autores</h1>
            <p className="pagina-subtitulo" aria-live="polite">
              {filtrados.length} de {autores.length} autor(es)
              {totalPaginas > 1 && ` · página ${paginaSegura} de ${totalPaginas}`}
            </p>
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
          <>
            <ul className="lcb-lista">
              {paginaAtual.map(a => (
                <li key={a.id} className={`lcb-item ${editando?.id === a.id && drawerAberto ? 'lcb-item--ativo' : ''}`}>
                  <span className="lcb-item-nome">{a.nome}</span>
                  <div className="lcb-item-acoes">
                    <button className="btn-editar" onClick={() => abrirEdicao(a)}>Editar</button>
                    <button className="btn-excluir" onClick={() => handleExcluir(a.id)}>Excluir</button>
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
              rotulo="Paginação de autores"
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
