import { useEffect, useState, useMemo, useRef } from 'react'
import Tabela from '../components/Tabela'
import Modal from '../components/Modal'
import Formulario from '../components/Formulario'
import CapaLivro from '../components/CapaLivro'
import { useAuth } from '../context/AuthContext'
import { useDialogo } from '../context/DialogoContext'
import {
  listarLivros,
  cadastrarLivro,
  atualizarLivro,
  excluirLivro,
  buscarCapaNovamente,
  uploadCapaManual,
  listarCapasParaRevisao,
  aprovarCapa,
  rejeitarCapa,
  sincronizarCapas
} from '../api/livros'
import { listarAutores } from '../api/autores'
import { listarCategorias } from '../api/categorias'
import { useSincronizacao } from '../context/SincronizacaoContext'
import './Pagina.css'
import './Livros.css'

// ── Colunas da tabela administrativa ────────────────────────
const COLUNAS = [
  { chave: 'titulo',         label: 'Título' },
  { chave: 'isbn',           label: 'ISBN' },
  { chave: 'anoPublicacao',  label: 'Ano' },
  { chave: 'autor.nome',     label: 'Autor' },
  { chave: 'categoria.nome', label: 'Categoria' },
  { chave: 'estoque',        label: 'Exemplares' }
]

// ── Paleta de cores para capas geradas ──────────────────────
const PALETA_CAPAS = [
  ['#c35a2b','#8c2b2b'], ['#2b5c8c','#1a3a5c'], ['#2b8c5a','#1a5c3a'],
  ['#8c6b2b','#5c4318'], ['#6b2b8c','#3a1a5c'], ['#2b7a8c','#1a4a5c'],
  ['#8c2b5a','#5c1a3a'], ['#3a8c2b','#1a5c18'], ['#8c3a2b','#5c2018'],
  ['#5c2b8c','#3a1a6b'], ['#2b8c8c','#1a5c5c'], ['#8c7a2b','#5c5018'],
]

function corCapa(titulo = '') {
  let hash = 0
  for (let i = 0; i < titulo.length; i++) hash = titulo.charCodeAt(i) + ((hash << 5) - hash)
  return PALETA_CAPAS[Math.abs(hash) % PALETA_CAPAS.length]
}

// ── Épocas fixas conforme especificação ─────────────────────
// Cada item: { label, value, ini, fim }
// "value" é a string usada no estado (ex: "2010-9999")
const EPOCAS = [
  { label: 'Atualidade',      value: '2010-9999', ini: 2010,  fim: 9999 },
  { label: 'Anos 2000',       value: '2000-2009', ini: 2000,  fim: 2009 },
  { label: 'Anos 90',         value: '1990-1999', ini: 1990,  fim: 1999 },
  { label: 'Anos 80',         value: '1980-1989', ini: 1980,  fim: 1989 },
  { label: 'Anos 70',         value: '1970-1979', ini: 1970,  fim: 1979 },
  { label: 'Anos 60',         value: '1960-1969', ini: 1960,  fim: 1969 },
  { label: 'Anos 50',         value: '1950-1959', ini: 1950,  fim: 1959 },
  { label: 'Anos 40',         value: '1940-1949', ini: 1940,  fim: 1949 },
  { label: 'Anos 30',         value: '1930-1939', ini: 1930,  fim: 1939 },
  { label: 'Anos 20',         value: '1920-1929', ini: 1920,  fim: 1929 },
  { label: 'Anos 10',         value: '1910-1919', ini: 1910,  fim: 1919 },
  { label: 'Século XIX',      value: '1800-1899', ini: 1800,  fim: 1899 },
  { label: 'Século XVIII',    value: '1700-1799', ini: 1700,  fim: 1799 },
  { label: 'Século XVII',     value: '1600-1699', ini: 1600,  fim: 1699 },
  { label: 'Século XVI',      value: '1500-1599', ini: 1500,  fim: 1599 },
  { label: 'Idade Média',     value: '500-1499',  ini: 500,   fim: 1499 },
  { label: 'Antiguidade',     value: '-9999-499', ini: -9999, fim: 499  },
]

// Mapeia o valor do select para o range { ini, fim }
function epocaParaRange(value) {
  const ep = EPOCAS.find(e => e.value === value)
  return ep ? { ini: ep.ini, fim: ep.fim } : null
}

// Retorna o label completo para exibir no select (inclui anos)
function epocaFullLabel(ep) {
  if (ep.value === '2010-9999') return `Atualidade (2010–atual)`
  if (ep.value === '-9999-499') return `Antiguidade (antes de 500)`
  return `${ep.label} (${ep.ini}–${ep.fim})`
}

// ── Opções de tamanho do grid ────────────────────────────────
// 3 opções: 3, 4, 5 colunas — 4 linhas fixas cada
const OPCOES_GRID = [
  { colunas: 3, porPagina: 12, label: '3 colunas' },
  { colunas: 4, porPagina: 16, label: '4 colunas' },
  { colunas: 5, porPagina: 20, label: '5 colunas' },
]
const GRID_PADRAO = OPCOES_GRID[1] // 4 colunas, 16 por página

// ── Select com busca interna ─────────────────────────────────
function SelectBuscavel({ label, opcoes, valor, onChange, placeholderOpcao }) {
  const [busca, setBusca] = useState('')
  const [aberto, setAberto] = useState(false)
  const ref = useRef(null)

  const opcoesFiltradas = useMemo(() =>
    opcoes.filter(o => o.label.toLowerCase().includes(busca.toLowerCase())),
    [opcoes, busca]
  )

  const labelSelecionado = opcoes.find(o => String(o.value) === String(valor))?.label ?? placeholderOpcao

  useEffect(() => {
    function handleFora(e) {
      if (ref.current && !ref.current.contains(e.target)) setAberto(false)
    }
    document.addEventListener('mousedown', handleFora)
    return () => document.removeEventListener('mousedown', handleFora)
  }, [])

  function selecionar(value) { onChange(value); setAberto(false); setBusca('') }

  return (
    <div className="livros-filtro-campo" ref={ref}>
      <label>{label}</label>
      <div className={`sel-buscavel ${aberto ? 'aberto' : ''}`}>
        <button
          type="button"
          className={`sel-buscavel-trigger ${valor ? 'com-valor' : ''}`}
          onClick={() => setAberto(v => !v)}
          aria-haspopup="listbox"
          aria-expanded={aberto}
        >
          <span>{labelSelecionado}</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/>
          </svg>
        </button>

        {aberto && (
          <div className="sel-buscavel-dropdown" role="listbox">
            <div className="sel-buscavel-busca">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/>
              </svg>
              <input
                autoFocus
                type="text"
                placeholder={`Buscar ${label.toLowerCase()}…`}
                value={busca}
                onChange={e => setBusca(e.target.value)}
              />
            </div>
            <ul>
              <li
                className={!valor ? 'selecionado' : ''}
                role="option"
                aria-selected={!valor}
                onClick={() => selecionar('')}
              >{placeholderOpcao}</li>
              {opcoesFiltradas.length === 0 && (
                <li className="sem-resultado">Nenhum resultado</li>
              )}
              {opcoesFiltradas.map(o => (
                <li
                  key={o.value}
                  role="option"
                  aria-selected={String(valor) === String(o.value)}
                  className={String(valor) === String(o.value) ? 'selecionado' : ''}
                  onClick={() => selecionar(o.value)}
                >{o.label}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Dropdown de tamanho do grid ──────────────────────────────
function GridDropdown({ gridConfig, onChange }) {
  const [aberto, setAberto] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleFora(e) {
      if (ref.current && !ref.current.contains(e.target)) setAberto(false)
    }
    document.addEventListener('mousedown', handleFora)
    return () => document.removeEventListener('mousedown', handleFora)
  }, [])

  // Ícone de grade SVG com N colunas
  function GridIcon({ colunas, size = 18 }) {
    const gap = 2
    const dot = Math.floor((size - gap * (colunas - 1)) / colunas)
    const rows = 2
    const dots = []
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < colunas; c++) {
        dots.push(
          <rect
            key={`${r}-${c}`}
            x={c * (dot + gap)}
            y={r * (dot + gap)}
            width={dot}
            height={dot}
            rx="1"
          />
        )
      }
    }
    const w = colunas * dot + (colunas - 1) * gap
    const h = rows * dot + (rows - 1) * gap
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="currentColor">
        {dots}
      </svg>
    )
  }

  return (
    <div className="grid-dropdown" ref={ref}>
      <button
        className={`grid-dropdown-trigger ${aberto ? 'aberto' : ''}`}
        onClick={() => setAberto(v => !v)}
        aria-haspopup="listbox"
        aria-expanded={aberto}
        title="Tamanho do grid"
      >
        <GridIcon colunas={gridConfig.colunas} />
        <span>{gridConfig.label}</span>
        <svg className="grid-dropdown-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/>
        </svg>
      </button>

      {aberto && (
        <div className="grid-dropdown-menu" role="listbox">
          {OPCOES_GRID.map(op => (
            <button
              key={op.colunas}
              role="option"
              aria-selected={gridConfig.colunas === op.colunas}
              className={`grid-dropdown-item ${gridConfig.colunas === op.colunas ? 'ativo' : ''}`}
              onClick={() => { onChange(op); setAberto(false) }}
            >
              <GridIcon colunas={op.colunas} />
              <span>{op.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Card de livro ────────────────────────────────────────────
function CardLivro({ livro, onSolicitar }) {
  const disponivel = livro.quantidadeDisponivel > 0

  return (
    <article className={`livro-card ${!disponivel ? 'livro-card--indisponivel' : ''}`}>
      {/* Capa com imagem servida pelo backend e fallback CSS */}
      <div className="livro-capa">
        <CapaLivro livro={livro} />
        {!disponivel && <div className="livro-capa-overlay">Indisponível</div>}
      </div>

      <div className="livro-card-corpo">
        <p className="livro-card-categoria">
          {(livro.categorias ?? []).map(c => c.nome).join(' · ') || '—'}
        </p>
        <h3 className="livro-card-titulo">{livro.titulo}</h3>
        <p className="livro-card-autor">{livro.autor?.nome ?? '—'}</p>
        <div className="livro-card-rodape">
          <span className={`livro-estoque ${disponivel ? 'livro-estoque--ok' : 'livro-estoque--sem'}`}>
            {disponivel
              ? `${livro.quantidadeDisponivel} disponíve${livro.quantidadeDisponivel === 1 ? 'l' : 'is'}`
              : 'Indisponível'}
          </span>
          <button
            className="livro-card-btn"
            disabled={!disponivel}
            onClick={() => onSolicitar(livro)}
            aria-label={`Solicitar empréstimo de ${livro.titulo}`}
          >Solicitar</button>
        </div>
      </div>
    </article>
  )
}

// ── Paginação ────────────────────────────────────────────────
function Paginacao({ paginaAtual, totalPaginas, onChange }) {
  if (totalPaginas <= 1) return null

  // Máximo 7 botões: sempre mostra primeira, última e até 5 ao redor da atual
  function paginas() {
    const lista = []
    const delta = 2
    for (let i = 1; i <= totalPaginas; i++) {
      if (
        i === 1 || i === totalPaginas ||
        (i >= paginaAtual - delta && i <= paginaAtual + delta)
      ) {
        lista.push(i)
      }
    }
    // Insere reticências
    const comReticencias = []
    for (let i = 0; i < lista.length; i++) {
      if (i > 0 && lista[i] - lista[i - 1] > 1) comReticencias.push('…')
      comReticencias.push(lista[i])
    }
    return comReticencias
  }

  return (
    <nav className="livros-paginacao" aria-label="Paginação">
      <button
        className="pag-btn pag-nav"
        disabled={paginaAtual === 1}
        onClick={() => onChange(paginaAtual - 1)}
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
            className={`pag-btn ${p === paginaAtual ? 'ativo' : ''}`}
            onClick={() => onChange(p)}
            aria-label={`Página ${p}`}
            aria-current={p === paginaAtual ? 'page' : undefined}
          >{p}</button>
        )
      )}

      <button
        className="pag-btn pag-nav"
        disabled={paginaAtual === totalPaginas}
        onClick={() => onChange(paginaAtual + 1)}
        aria-label="Próxima página"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
        </svg>
      </button>
    </nav>
  )
}

// ════════════════════════════════════════════════════════════
// Componente principal
// ════════════════════════════════════════════════════════════
export default function Livros() {
  const { isBibliotecario } = useAuth()
  const { alertar, confirmar } = useDialogo()
  const { sincronizar, status: sincStatus } = useSincronizacao()
  const ehBibliotecario = isBibliotecario()

  const [livros,     setLivros]     = useState([])
  const [autores,    setAutores]    = useState([])
  const [categorias, setCategorias] = useState([])
  const [modalAberto, setModalAberto] = useState(false)
  const [livroEditando, setLivroEditando] = useState(null)
  const [valores, setValores] = useState({})
  const [erro, setErro] = useState('')
  const [erroGeral, setErroGeral] = useState('')
  const [carregando, setCarregando] = useState(true)

  // Gestão de Capas
  const [livrosEmRevisao, setLivrosEmRevisao]       = useState([])
  const [modalRevisaoAberto, setModalRevisaoAberto] = useState(false)
  const [modalRelatorioAberto, setModalRelatorioAberto] = useState(false)
  const [relatorioSinc, setRelatorioSinc]           = useState(null)
  const [buscandoCapa, setBuscandoCapa]             = useState(false)
  const [enviandoCapa, setEnviandoCapa]             = useState(false)
  const inputArquivoRef = useRef(null)

  const [busca,           setBusca]           = useState('')
  const [filtrosCategorias, setFiltrosCategorias] = useState([]) // array de IDs (multi)
  const [filtroAutor,     setFiltroAutor]     = useState('')
  const [filtroEpoca,     setFiltroEpoca]     = useState('')
  const [filtroEstoque,   setFiltroEstoque]   = useState('todos')
  const [filtrosAbertos,  setFiltrosAbertos]  = useState(false)

  // Grid e paginação (aluno)
  const [gridConfig, setGridConfig] = useState(GRID_PADRAO)
  const [pagina,     setPagina]     = useState(1)

  async function carregar() {
    setErroGeral('')
    try {
      const [livrosData, autoresData, categoriasData] = await Promise.all([
        listarLivros(), listarAutores(), listarCategorias()
      ])
      livrosData.sort((a, b) => (a.titulo ?? '').localeCompare(b.titulo ?? '', 'pt-BR'))
      setLivros(livrosData)
      setAutores(autoresData)
      setCategorias(categoriasData)

      if (ehBibliotecario) {
        try {
          const revisao = await listarCapasParaRevisao()
          setLivrosEmRevisao(revisao)
        } catch {}
      }
    } catch {
      setErroGeral('Não foi possível carregar os livros.')
    } finally {
      setCarregando(false)
    }
  }

  async function handleBuscarCapaNovamente(id) {
    setBuscandoCapa(true)
    try {
      const atualizado = await buscarCapaNovamente(id)
      setLivroEditando(atualizado)
      await carregar()
      await alertar(
        atualizado.capaStatus === 'ENCONTRADA'
          ? 'Capa encontrada e atualizada com sucesso!'
          : atualizado.capaStatus === 'REVISAR'
          ? 'Capa encontrada, mas com divergência de título. Enviada para Revisão!'
          : 'Nenhuma capa encontrada nas fontes externas para este ISBN.',
        atualizado.capaStatus === 'ENCONTRADA' ? 'sucesso' : 'aviso'
      )
    } catch (err) {
      await alertar(err.response?.data?.erro || 'Erro ao buscar capa.', 'erro')
    } finally {
      setBuscandoCapa(false)
    }
  }

  async function handleUploadCapaManual(e) {
    const file = e.target.files?.[0]
    if (!file || !livroEditando) return
    setEnviandoCapa(true)
    try {
      const atualizado = await uploadCapaManual(livroEditando.id, file)
      setLivroEditando(atualizado)
      await carregar()
      await alertar('Capa enviada e salva com sucesso!', 'sucesso')
    } catch (err) {
      await alertar(err.response?.data?.erro || 'Falha ao enviar arquivo de capa.', 'erro')
    } finally {
      setEnviandoCapa(false)
      if (inputArquivoRef.current) inputArquivoRef.current.value = ''
    }
  }

  async function handleSincronizarCapas() {
    await sincronizar()
    await carregar()
  }

  async function handleAprovarCapa(id) {
    try {
      await aprovarCapa(id)
      await carregar()
      await alertar('Capa aprovada e publicada no acervo!', 'sucesso')
    } catch (err) {
      await alertar(err.response?.data?.erro || 'Erro ao aprovar capa.', 'erro')
    }
  }

  async function handleRejeitarCapa(id) {
    try {
      await rejeitarCapa(id)
      await carregar()
      await alertar('Capa descartada. O livro voltará a SEM_CAPA.', 'aviso')
    } catch (err) {
      await alertar(err.response?.data?.erro || 'Erro ao rejeitar capa.', 'erro')
    }
  }

  useEffect(() => { carregar() }, [])

  // Volta p/ página 1 sempre que um filtro muda
  useEffect(() => { setPagina(1) }, [busca, filtrosCategorias, filtroAutor, filtroEpoca, filtroEstoque, gridConfig])

  // ── Filtros reativos ─────────────────────────────────────
  const livrosPorBusca = useMemo(() => {
    if (!busca) return livros
    const q = busca.toLowerCase()
    return livros.filter(l =>
      l.titulo?.toLowerCase().includes(q) ||
      l.autor?.nome?.toLowerCase().includes(q) ||
      l.isbn?.includes(q)
    )
  }, [livros, busca])

  function passaFiltros(livro, exceto = null) {
    const buscaOk = livrosPorBusca.includes(livro)

    // multi-categoria: livro passa se qualquer das suas categorias estiver no array selecionado
    const catOk = exceto === 'cat' || filtrosCategorias.length === 0 ||
      (livro.categorias ?? []).some(c => filtrosCategorias.includes(c.id))

    const autorOk = exceto === 'autor' || !filtroAutor ||
      livro.autor?.id === parseInt(filtroAutor)

    const range = epocaParaRange(filtroEpoca)
    const epocaOk = exceto === 'epoca' || !range ||
      (livro.anoPublicacao != null &&
       livro.anoPublicacao >= range.ini &&
       livro.anoPublicacao <= range.fim)

    const estOk = exceto === 'estoque' || filtroEstoque === 'todos' ||
      (filtroEstoque === 'disponiveis'   && livro.quantidadeDisponivel > 0) ||
      (filtroEstoque === 'indisponiveis' && livro.quantidadeDisponivel === 0)

    return buscaOk && catOk && autorOk && epocaOk && estOk
  }

  const categoriasDisponiveis = useMemo(() => {
    const ids = new Set(
      livros.filter(l => passaFiltros(l, 'cat'))
        .flatMap(l => (l.categorias ?? []).map(c => c.id))
    )
    return categorias.filter(c => ids.has(c.id)).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  }, [livros, categorias, livrosPorBusca, filtroAutor, filtroEpoca, filtroEstoque])

  const autoresDisponiveis = useMemo(() => {
    const ids = new Set(livros.filter(l => passaFiltros(l, 'autor')).map(l => l.autor?.id))
    return autores.filter(a => ids.has(a.id)).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  }, [livros, autores, livrosPorBusca, filtrosCategorias, filtroEpoca, filtroEstoque])

  // Épocas que têm pelo menos 1 livro dado os outros filtros
  const epocasDisponiveis = useMemo(() => {
    const anosPresentes = livros
      .filter(l => passaFiltros(l, 'epoca') && l.anoPublicacao != null)
      .map(l => l.anoPublicacao)
    return EPOCAS.filter(ep =>
      anosPresentes.some(a => a >= ep.ini && a <= ep.fim)
    )
  }, [livros, livrosPorBusca, filtrosCategorias, filtroAutor, filtroEstoque])

  const livrosFiltrados = useMemo(() =>
    livros.filter(l => passaFiltros(l)),
    [livros, livrosPorBusca, filtrosCategorias, filtroAutor, filtroEpoca, filtroEstoque]
  )

  const temFiltroAtivo = busca || filtrosCategorias.length > 0 || filtroAutor || filtroEpoca || filtroEstoque !== 'todos'

  function limparFiltros() {
    setBusca(''); setFiltrosCategorias([]); setFiltroAutor('')
    setFiltroEpoca(''); setFiltroEstoque('todos')
  }

  // Reset automático — remove categorias selecionadas que saíram do conjunto disponível
  // (compara por ID numérico, sem conversão de tipo)
  useEffect(() => {
    if (filtrosCategorias.length > 0) {
      const idsDisponiveis = new Set(categoriasDisponiveis.map(c => c.id))
      const mantidas = filtrosCategorias.filter(id => idsDisponiveis.has(id))
      if (mantidas.length !== filtrosCategorias.length) setFiltrosCategorias(mantidas)
    }
  }, [categoriasDisponiveis])

  useEffect(() => {
    if (filtroAutor && !autoresDisponiveis.find(a => a.id === parseInt(filtroAutor)))
      setFiltroAutor('')
  }, [autoresDisponiveis])

  useEffect(() => {
    if (filtroEpoca && !epocasDisponiveis.find(e => e.value === filtroEpoca))
      setFiltroEpoca('')
  }, [epocasDisponiveis])

  // ── Paginação ────────────────────────────────────────────
  const totalPaginas = Math.max(1, Math.ceil(livrosFiltrados.length / gridConfig.porPagina))
  const paginaSegura = Math.min(pagina, totalPaginas)
  const livrosPagina = useMemo(() => {
    const inicio = (paginaSegura - 1) * gridConfig.porPagina
    return livrosFiltrados.slice(inicio, inicio + gridConfig.porPagina)
  }, [livrosFiltrados, paginaSegura, gridConfig.porPagina])

  // ── Barra de filtros ─────────────────────────────────────
  const barraFiltros = (
    <div className="livros-filtros-area">
      <div className="livros-busca-wrapper">
        <svg className="livros-busca-icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/>
        </svg>
        <input
          className="livros-busca-input"
          type="search"
          placeholder="Buscar por título, autor ou ISBN…"
          value={busca}
          onChange={e => setBusca(e.target.value)}
          aria-label="Buscar livros"
        />
        {busca && (
          <button className="livros-busca-limpar" onClick={() => setBusca('')} aria-label="Limpar busca">✕</button>
        )}
      </div>

      <div className="livros-filtros-linha">
        <button
          className={`livros-filtros-toggle ${filtrosAbertos || temFiltroAtivo ? 'ativo' : ''}`}
          onClick={() => setFiltrosAbertos(v => !v)}
          aria-expanded={filtrosAbertos}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75"/>
          </svg>
          Filtros
          {temFiltroAtivo && <span className="livros-filtros-badge">●</span>}
        </button>

        {temFiltroAtivo && (
          <button className="livros-limpar-btn" onClick={limparFiltros}>Limpar filtros</button>
        )}
      </div>

      {filtrosAbertos && (
        <div className="livros-filtros-grid">
          {/* Categorias — seleção múltipla por pílulas */}
          <div className="livros-filtro-campo livros-filtro-campo--full">
            <label>Categorias</label>
            <div className="filtro-cat-pills">
              {categoriasDisponiveis.map(c => {
                const ativa = filtrosCategorias.includes(c.id)
                return (
                  <button
                    key={c.id}
                    type="button"
                    className={`filtro-cat-pill ${ativa ? 'filtro-cat-pill--ativa' : ''}`}
                    onClick={() => setFiltrosCategorias(ativa
                      ? filtrosCategorias.filter(id => id !== c.id)
                      : [...filtrosCategorias, c.id]
                    )}
                  >
                    {c.nome}
                    {ativa && <span className="filtro-cat-pill-x">✕</span>}
                  </button>
                )
              })}
            </div>
          </div>

          <SelectBuscavel
            label="Autor"
            placeholderOpcao="Todos os autores"
            opcoes={autoresDisponiveis.map(a => ({ value: a.id, label: a.nome }))}
            valor={filtroAutor}
            onChange={setFiltroAutor}
          />

          <SelectBuscavel
            label="Época"
            placeholderOpcao="Todas as épocas"
            opcoes={epocasDisponiveis.map(ep => ({ value: ep.value, label: epocaFullLabel(ep) }))}
            valor={filtroEpoca}
            onChange={setFiltroEpoca}
          />

          <SelectBuscavel
            label="Disponibilidade"
            placeholderOpcao="Todos"
            opcoes={[
              { value: 'disponiveis',   label: 'Disponíveis' },
              { value: 'indisponiveis', label: 'Indisponíveis' },
            ]}
            valor={filtroEstoque === 'todos' ? '' : filtroEstoque}
            onChange={v => setFiltroEstoque(v || 'todos')}
          />
        </div>
      )}
    </div>
  )

  if (carregando) return (
    <div className="pagina"><div className="dashboard-carregando"><div className="spinner" /></div></div>
  )

  // ════════════════════════════════════════
  // VISÃO DO BIBLIOTECÁRIO
  // ════════════════════════════════════════
  if (ehBibliotecario) {
    const campos = [
      { name: 'titulo',         label: 'Título',             required: true,  placeholder: 'Título do livro' },
      { name: 'isbn',           label: 'ISBN',               required: !livroEditando,
        placeholder: 'Ex: 9788535912381', readOnly: !!livroEditando,
        info: livroEditando ? 'O ISBN identifica o exemplar físico e não pode ser alterado.' : undefined },
      { name: 'anoPublicacao',  label: 'Ano de publicação',  required: false, type: 'number', placeholder: 'Ex: 2020' },
      { name: 'quantidadeTotal',label: 'Total de exemplares',required: true,  type: 'number', placeholder: 'Ex: 3' },
      { name: 'autorId',        label: 'Autor',              required: true,  type: 'select',
        options: autores.map(a => ({ value: a.id, label: a.nome })) },
    ]

    const drawerAberto = modalAberto || modalRevisaoAberto

    function fecharDrawer() {
      setModalAberto(false)
      setModalRevisaoAberto(false)
      setErro('')
    }

    return (
      <div className={`bib-layout ${drawerAberto ? 'bib-layout--drawer-aberto' : ''}`}>

        {/* ── Área principal ───────────────────────────── */}
        <div className="bib-main">
          {/* Cabeçalho */}
          <div className="pagina-header">
            <div>
              <h1 className="pagina-titulo">Acervo</h1>
              <p className="pagina-subtitulo">
                {livrosFiltrados.length} de {livros.length} livro(s)
              </p>
            </div>
            <div className="header-acoes-bibliotecario">
              <button
                type="button"
                className="btn-secundario-capas"
                disabled={sincStatus === 'rodando'}
                onClick={handleSincronizarCapas}
              >
                {sincStatus === 'rodando' ? 'Sincronizando…' : 'Sincronizar Capas'}
              </button>
              {livrosEmRevisao.length > 0 && (
                <button
                  type="button"
                  className="btn-revisao-capas"
                  onClick={() => { setModalAberto(false); setModalRevisaoAberto(true) }}
                >
                  <span className="btn-revisao-badge">{livrosEmRevisao.length}</span>
                  Capas para revisar
                </button>
              )}
              <button className="btn-primario" onClick={() => {
                setLivroEditando(null)
                setValores({ titulo: '', isbn: '', anoPublicacao: '', quantidadeTotal: '', autorId: '', categoriaIds: [] })
                setErro('')
                setModalRevisaoAberto(false)
                setModalAberto(true)
              }}>
                + Novo Livro
              </button>
            </div>
          </div>

          {erroGeral && <p className="erro-msg">{erroGeral}</p>}
          {barraFiltros}

          {/* Controles de grid + paginação — igual à visão do aluno */}
          <div className="livros-controles">
            <p className="livros-resultado-total">
              {livrosFiltrados.length} livro{livrosFiltrados.length !== 1 ? 's' : ''}
              {temFiltroAtivo && ' filtrados'}
              {totalPaginas > 1 && ` · página ${paginaSegura} de ${totalPaginas}`}
            </p>
            <GridDropdown gridConfig={gridConfig} onChange={op => { setGridConfig(op); setPagina(1) }} />
          </div>

          {/* Grid de cards */}
          {livrosFiltrados.length === 0 ? (
            <div className="livros-vazio">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0118 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
              <p>Nenhum livro encontrado.</p>
              {temFiltroAtivo && <button className="livros-limpar-btn" onClick={limparFiltros}>Limpar filtros</button>}
            </div>
          ) : (
            <>
              <div className="livros-grid" style={{ '--livros-colunas': gridConfig.colunas }}>
                {livrosPagina.map(livro => (
                  <article
                    key={livro.id}
                    className={`livro-card bib-card ${livroEditando?.id === livro.id && modalAberto ? 'bib-card--ativo' : ''}`}
                  >
                    <div className="livro-capa">
                      <CapaLivro livro={livro} />
                      <div className="bib-card-estoque">
                        {livro.quantidadeDisponivel}/{livro.quantidadeTotal}
                      </div>
                    </div>
                    <div className="livro-card-corpo">
                      <p className="livro-card-categoria">
                        {(livro.categorias ?? []).map(c => c.nome).join(' · ') || '—'}
                      </p>
                      <h3 className="livro-card-titulo">{livro.titulo}</h3>
                      <p className="livro-card-autor">{livro.autor?.nome ?? '—'}</p>
                      <div className="livro-card-rodape">
                        <button className="btn-editar-card" onClick={() => {
                          setLivroEditando(livro)
                          setValores({
                            titulo: livro.titulo,
                            isbn: livro.isbn,
                            anoPublicacao: livro.anoPublicacao ?? '',
                            quantidadeTotal: livro.quantidadeTotal ?? livro.quantidadeDisponivel,
                            autorId: livro.autor?.id ?? '',
                            categoriaIds: (livro.categorias ?? []).map(c => c.id),
                          })
                          setErro('')
                          setModalRevisaoAberto(false)
                          setModalAberto(true)
                        }}>Editar</button>
                        <button className="btn-excluir-card" onClick={async () => {
                          const ok = await confirmar('Excluir este livro?', 'Excluir livro')
                          if (!ok) return
                          try { await excluirLivro(livro.id); carregar() }
                          catch (err) { await alertar(err.response?.data?.erro || 'Não foi possível excluir.', 'erro') }
                        }}>Excluir</button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
              <Paginacao
                paginaAtual={paginaSegura}
                totalPaginas={totalPaginas}
                onChange={p => { setPagina(p); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
              />
            </>
          )}
        </div>

        {/* ── Drawer lateral ──────────────────────────── */}
        {drawerAberto && (
          <>
            {/* Backdrop clicável em mobile */}
            <div className="bib-drawer-backdrop" onClick={fecharDrawer} aria-hidden="true" />

            <aside className="bib-drawer">
              <div className="bib-drawer-header">
                <h2 className="bib-drawer-titulo">
                  {modalRevisaoAberto
                    ? `Capas para revisar (${livrosEmRevisao.length})`
                    : livroEditando ? 'Editar Livro' : 'Novo Livro'}
                </h2>
                <button className="bib-drawer-fechar" onClick={fecharDrawer} aria-label="Fechar painel">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="bib-drawer-corpo">

                {/* ── Conteúdo: formulário de livro ── */}
                {modalAberto && (
                  <>
                    {erro && <p className="erro-msg">{erro}</p>}
                    <Formulario
                      campos={campos}
                      valores={valores}
                      onChange={e => setValores({ ...valores, [e.target.name]: e.target.value })}
                      onSubmit={async (e) => {
                        e.preventDefault(); setErro('')
                        if (!valores.categoriaIds || valores.categoriaIds.length === 0) {
                          setErro('Selecione ao menos uma categoria.')
                          return
                        }
                        const payload = {
                          titulo: valores.titulo,
                          isbn: livroEditando ? livroEditando.isbn : valores.isbn,
                          anoPublicacao: valores.anoPublicacao ? parseInt(valores.anoPublicacao) : null,
                          quantidadeTotal: parseInt(valores.quantidadeTotal),
                          autor: { id: parseInt(valores.autorId) },
                          categorias: (valores.categoriaIds ?? []).map(id => ({ id: parseInt(id) })),
                        }
                        try {
                          if (livroEditando) await atualizarLivro(livroEditando.id, payload)
                          else await cadastrarLivro(payload)
                          fecharDrawer(); carregar()
                        } catch (err) {
                          setErro(err.response?.data?.erro || err.message || 'Erro ao salvar livro.')
                        }
                      }}
                      textoBotao={livroEditando ? 'Atualizar' : 'Cadastrar'}
                    >
                      {/* Seletor de categorias múltiplas — renderizado dentro do form via children */}
                      <div className="formulario-campo">
                        <label>Categorias <span style={{fontSize:'0.7rem',fontWeight:400,opacity:0.7}}>(selecione uma ou mais)</span></label>
                        <div className="multi-cat-grid">
                          {categorias.map(c => {
                            const selecionado = (valores.categoriaIds ?? []).includes(c.id) ||
                                                (valores.categoriaIds ?? []).includes(String(c.id))
                            return (
                              <button
                                key={c.id}
                                type="button"
                                className={`multi-cat-btn ${selecionado ? 'multi-cat-btn--ativo' : ''}`}
                                onClick={() => {
                                  const atual = valores.categoriaIds ?? []
                                  const id = c.id
                                  setValores({
                                    ...valores,
                                    categoriaIds: selecionado
                                      ? atual.filter(x => x !== id && x !== String(id))
                                      : [...atual, id]
                                  })
                                }}
                              >
                                {c.nome}
                                {selecionado && <span className="multi-cat-check">✓</span>}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </Formulario>

                    {livroEditando && (
                      <div className="modal-capa-secao">
                        <div className="modal-capa-box">
                          <CapaLivro livro={livroEditando} urlCapa={livroEditando.urlCapaInterna || livroEditando.urlCapa} />
                        </div>
                        <div className="modal-capa-detalhes">
                          <h4>Gestão da Capa</h4>
                          <div className="modal-capa-status-linha">
                            <span>Status:</span>
                            <span className={`badge-capa badge-capa-${livroEditando.capaStatus || 'SEM_CAPA'}`}>
                              {livroEditando.capaStatus === 'ENCONTRADA' ? 'Encontrada'
                               : livroEditando.capaStatus === 'REVISAR' ? 'Em Revisão' : 'Sem Capa'}
                            </span>
                          </div>
                          <div className="modal-capa-status-linha">
                            <span>Origem:</span>
                            <strong>{livroEditando.capaOrigem || 'Nenhuma'}</strong>
                          </div>
                          <div className="modal-capa-acoes">
                            <button type="button" className="btn-capa-mini"
                              disabled={buscandoCapa || enviandoCapa}
                              onClick={() => handleBuscarCapaNovamente(livroEditando.id)}>
                              {buscandoCapa ? 'Buscando…' : 'Buscar capa novamente'}
                            </button>
                            <button type="button" className="btn-capa-mini"
                              disabled={buscandoCapa || enviandoCapa}
                              onClick={() => inputArquivoRef.current?.click()}>
                              {enviandoCapa ? 'Enviando…' : 'Enviar imagem'}
                            </button>
                            <input ref={inputArquivoRef} type="file"
                              accept="image/jpeg,image/png,image/webp"
                              style={{ display: 'none' }} onChange={handleUploadCapaManual} />
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* ── Conteúdo: revisão de capas ── */}
                {modalRevisaoAberto && (
                  <div className="lista-revisao-grid">
                    {livrosEmRevisao.map(item => (
                      <div key={item.id} className="item-revisao-card">
                        <div className="item-revisao-capa">
                          <CapaLivro livro={item} urlCapa={item.urlCapaInterna} />
                        </div>
                        <div className="item-revisao-info">
                          <h4>{item.titulo}</h4>
                          <p><strong>Origem:</strong> {item.capaOrigem}</p>
                          <p className="item-revisao-aviso">
                            Título da API divergiu do cadastrado. Confirme se é a capa correta.
                          </p>
                        </div>
                        <div className="item-revisao-acoes">
                          <button className="btn-aprovar-capa" onClick={() => handleAprovarCapa(item.id)}>✓ Aprovar</button>
                          <button className="btn-rejeitar-capa" onClick={() => handleRejeitarCapa(item.id)}>✕ Rejeitar</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            </aside>
          </>
        )}
      </div>
    )
  }

  // ════════════════════════════════════════
  // VISÃO DO ALUNO — catálogo em cards
  // ════════════════════════════════════════
  return (
    <div className="pagina livros-catalogo">
      {/* Hero */}
      <div className="livros-hero">
        <div>
          <h1 className="livros-hero-titulo">
            O que você vai<br /><em>ler hoje?</em>
          </h1>
          <p className="livros-hero-sub">{livros.length} títulos no acervo</p>
        </div>
        <div className="livros-hero-stat">
          <span className="livros-hero-numero">
            {livros.filter(l => l.quantidadeDisponivel > 0).length}
          </span>
          <span className="livros-hero-label">disponíveis agora</span>
        </div>
      </div>

      {erroGeral && <p className="erro-msg">{erroGeral}</p>}
      {barraFiltros}

      {livrosFiltrados.length === 0 ? (
        <div className="livros-vazio">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0118 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
          <p>Nenhum livro encontrado com esses filtros.</p>
          {temFiltroAtivo && (
            <button className="livros-limpar-btn" onClick={limparFiltros}>Limpar filtros</button>
          )}
        </div>
      ) : (
        <>
          {/* Barra de controle: resultado + seletor de grid */}
          <div className="livros-controles">
            <p className="livros-resultado-total">
              {livrosFiltrados.length} resultado{livrosFiltrados.length !== 1 ? 's' : ''}
              {temFiltroAtivo && ' para os filtros aplicados'}
              {totalPaginas > 1 && ` · página ${paginaSegura} de ${totalPaginas}`}
            </p>

          {/* Seletor de grid — dropdown */}
          <GridDropdown gridConfig={gridConfig} onChange={op => { setGridConfig(op); setPagina(1) }} />
          </div>

          {/* Grid de cards */}
          <div
            className="livros-grid"
            style={{ '--livros-colunas': gridConfig.colunas }}
          >
            {livrosPagina.map(livro => (
              <CardLivro
                key={livro.id}
                livro={livro}
                onSolicitar={async (l) => {
                  await alertar(
                    `Para solicitar "${l.titulo}", procure um bibliotecário ou acesse a aba Empréstimos.`,
                    'aviso'
                  )
                }}
              />
            ))}
          </div>

          {/* Paginação */}
          <Paginacao
            paginaAtual={paginaSegura}
            totalPaginas={totalPaginas}
            onChange={p => { setPagina(p); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
          />
        </>
      )}
    </div>
  )
}
