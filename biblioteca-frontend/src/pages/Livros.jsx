import { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import Tabela from '../components/Tabela'
import Modal from '../components/Modal'
import Formulario from '../components/Formulario'
import CapaLivro from '../components/CapaLivro'
import Paginacao from '../components/Paginacao'
import FiltroPilhas from '../components/FiltroPilhas'
import { useAuth } from '../context/AuthContext'
import { useDialogo } from '../context/DialogoContext'
import {
  listarLivros,
  buscarLivros,
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
import { listarCategorias, arvoreCategorias } from '../api/categorias'
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

/** O mesmo limite que o servidor valida, pra não descobrir errado. */
const MAX_CATEGORIAS_POR_LIVRO = 4

/**
 * Lê a lista de ids de um parâmetro da URL.
 *
 * "cat=12,15,abc" tem que devolver [12, 15] e não quebrar a página: a URL pode
 * ter sido montada à mão, vir de um link antigo de quando a taxonomia tinha
 * outros ids, ou simplesmente estar digitada errado. Um filtro que derruba a
 * tela por causa de um número é pior do que um filtro que ignora o número.
 */
function idsDaUrl(valor) {
  if (!valor) return []
  return valor
    .split(',')
    .map(s => parseInt(s.trim(), 10))
    .filter(n => Number.isInteger(n) && n > 0)
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
  // A cor vem da área da categoria principal: é ela que define a lombada.
  const corArea = livro.categoriaPrincipal?.categoriaPai?.cor ?? null
  // A principal vem primeiro na lista, para o card não esconder qual é.
  const categorias = [
    ...(livro.categorias ?? []).filter(c => c.id === livro.categoriaPrincipal?.id),
    ...(livro.categorias ?? []).filter(c => c.id !== livro.categoriaPrincipal?.id),
  ]

  return (
    <article
      className={`livro-card ${!disponivel ? 'livro-card--indisponivel' : ''}`}
      style={corArea ? { '--cor-area': corArea } : undefined}
    >
      {/* Capa com imagem servida pelo backend e fallback CSS */}
      <div className="livro-capa">
        <CapaLivro livro={livro} cor={corArea} />
        {!disponivel && <div className="livro-capa-overlay">Indisponível</div>}
      </div>

      <div className="livro-card-corpo">
        <p className="livro-card-categoria">
          {categorias.map(c => c.nome).join(' · ') || '—'}
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

// A paginação vive em components/Paginacao.jsx, compartilhada com
// Autores e Categorias.

// ════════════════════════════════════════════════════════════
// Componente principal
// ════════════════════════════════════════════════════════════
export default function Livros() {
  const { isBibliotecario } = useAuth()
  const { alertar, confirmar } = useDialogo()
  const { sincronizar, status: sincStatus } = useSincronizacao()
  const ehBibliotecario = isBibliotecario()

  // A listagem de livros não mora aqui: vem de buscarNoServidor(), já filtrada
  // e paginada pelo banco. Aqui ficam só as listas de apoio dos outros filtros.
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
  const [filtroAutor,     setFiltroAutor]     = useState('')
  const [filtroEpoca,     setFiltroEpoca]     = useState('')
  const [filtroEstoque,   setFiltroEstoque]   = useState('todos')
  const [filtrosAbertos,  setFiltrosAbertos]  = useState(false)

  // ── Filtro em pilhas ──────────────────────────────────
  // A seleção mora na URL, e não no estado. Assim o botão voltar desfaz,
  // recarregar mantém e um link colado no WhatsApp traz o filtro inteiro —
  // as três coisas caem de graça de um estado só.
  const [params, setParams] = useSearchParams()

  // Decodificar a URL devolve um array NOVO a cada render. Se esse array fosse
  // dependência do useCallback da busca, o callback mudaria de identidade a
  // cada render, o efeito rodaria de novo, o estado mudaria, novo render —
// e o navegador nunca pararia de pedir /api/livros. Memorizar pela string
  // bruta quebra o ciclo: enquanto a URL não muda, o array é o mesmo.
  const catBruto  = params.get('cat')
  const areaBruto = params.get('area')
  const paginaBruta = params.get('pagina')

  const categoriasUrl = useMemo(() => idsDaUrl(catBruto), [catBruto])
  const areasUrl      = useMemo(() => idsDaUrl(areaBruto), [areaBruto])
  const modoUrl       = params.get('modo') === 'todas' ? 'todas' : 'qualquer'
  const paginaUrl     = Math.max(1, parseInt(paginaBruta || '1', 10) || 1)

  const [arvore, setArvore]       = useState([])
  const [paginaDados, setPaginaDados] = useState({ itens: [], total: 0, totalPaginas: 0 })
  /**
   * Quantos livros tem o acervo sem nenhum filtro. Vem separado porque somar
   * os totais das áreas não serve: um livro com duas subcategorias da mesma
   * área seria contado duas vezes.
   */
  const [totalAcervo, setTotalAcervo] = useState(0)
  // Só os dois totais que o "Combinar" mostra. As contagens por subcategoria e
  // por área que a API também devolve não são guardadas aqui: elas chegam
  // dentro de cada nó da árvore, já no formato que o botão mostra, e manter
  // as duas cópias faria elas poderem divergir na tela.
  const [facetas, setFacetas]     = useState({ totalQualquer: 0, totalTodas: 0 })
  const [zeroNoModo, setZeroNoModo] = useState(false)
  const [carregandoEstante, setCarregandoEstante] = useState(true)

  /**
   * Escreve o filtro na URL.
   *
   * Usa replace em vez de push quando só a página muda: trocar de página não
   * deve encher o histórico de voltas, mas marcar uma categoria deve — aí o
   * "voltar" desfaz a marcação, que é o que se espera.
   */
  function atualizarUrl(mudancas, { substituir = false } = {}) {
    setParams(antigos => {
      const proximos = new URLSearchParams(antigos)
      for (const [chave, valor] of Object.entries(mudancas)) {
        // Página 1 é o padrão: gravar "pagina=1" só enfeita a URL que o
        // usuário vai copiar para o colega.
        const ehPaginaPadrao = chave === 'pagina' && valor === 1
        if (valor === null || valor === '' || ehPaginaPadrao ||
            (Array.isArray(valor) && valor.length === 0)) {
          proximos.delete(chave)
        } else {
          proximos.set(chave, Array.isArray(valor) ? valor.join(',') : String(valor))
        }
      }
      return proximos
    }, { replace: substituir })
  }

  function alternarCategoria(id) {
    const nova = categoriasUrl.includes(id)
      ? categoriasUrl.filter(x => x !== id)
      : [...categoriasUrl, id]
    atualizarUrl({ cat: nova, pagina: 1 })
  }

  function alternarArea(id) {
    const nova = areasUrl.includes(id)
      ? areasUrl.filter(x => x !== id)
      : [...areasUrl, id]
    atualizarUrl({ area: nova, pagina: 1 })
  }

  function trocarModo(modo) {
    atualizarUrl({ modo: modo === 'qualquer' ? null : modo })
  }

  function limparFiltroCategorias() {
    atualizarUrl({ cat: null, area: null, modo: null, pagina: 1 })
  }

  // Grid (aluno). A página não mora aqui: é paginaUrl, que vem da URL.
  const [gridConfig, setGridConfig] = useState(GRID_PADRAO)

  /**
   * Busca a estante e a árvore no servidor, sempre com o filtro atual.
   *
   * As duas vão juntas porque as contagens da pilha e as da estante precisam
   * dizer a mesma coisa. Se buscassem em momentos diferentes, marcar uma
   * categoria poderia mostrar "42 livros" na pilha e "40" na estante.
   */
  const buscarNoServidor = useCallback(async () => {
    setCarregandoEstante(true)
    const comum = {
      categorias: categoriasUrl,
      areas: areasUrl,
      modo: modoUrl,
      texto: busca,
      autor: filtroAutor ? parseInt(filtroAutor) : null,
      epoca: filtroEpoca,
      disponiveis: filtroEstoque === 'todos' ? '' : filtroEstoque === 'disponiveis',
    }
    try {
      const [resposta, arvore] = await Promise.all([
        buscarLivros({ ...comum, pagina: paginaUrl, tamanho: gridConfig.porPagina }),
        arvoreCategorias(comum),
      ])
      setPaginaDados(resposta)
      setFacetas({
        totalQualquer: resposta.totalQualquer,
        totalTodas: resposta.totalTodas,
      })
      setZeroNoModo(resposta.zeroNoModo)
      setArvore(arvore.areas ?? [])
      // Só some o aviso quando a busca deu certo. Um erro antigo ficaria
      // na tela ao lado de uma estante perfeitamente carregada.
      setErroGeral('')
    } catch {
      setErroGeral('Não foi possível carregar o acervo.')
    } finally {
      setCarregandoEstante(false)
    }
  }, [categoriasUrl, areasUrl, modoUrl, busca, filtroAutor, filtroEpoca, filtroEstoque, paginaUrl, gridConfig.porPagina])

  // Um efeito só, para as duas requisições. Separate, a estante e a árvore
  // chegariam em momentos diferentes e a tela piscaria duas vezes.
  useEffect(() => {
    if (carregando) return
    buscarNoServidor()
  }, [buscarNoServidor, carregando])

  async function carregar() {
    setErroGeral('')
    try {
      const [autoresData, categoriasData] = await Promise.all([
        listarAutores(), listarCategorias()
      ])
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

  // O total do acervo sem filtro, uma vez só. Depois ele não muda mais.
  useEffect(() => {
    if (carregando) return
    buscarLivros({ pagina: 1, tamanho: 1 })
      .then(r => setTotalAcervo(r.total ?? 0))
      .catch(() => setTotalAcervo(0))
  }, [carregando])

  // ── O que a estante mostra ─────────────────────────────
  // O recorte inteiro acontece no servidor. Aqui não sobra filtragem: o que
  // chega já é a página pedida, com os totais e as facetas prontos.
  const livrosPagina  = paginaDados.itens ?? []
  const totalPaginas   = Math.max(1, paginaDados.totalPaginas ?? 1)
  const paginaSegura   = Math.min(paginaUrl, totalPaginas)

  const totalMarcadas = categoriasUrl.length + areasUrl.length
  const temFiltroAtivo =
    busca || totalMarcadas > 0 || filtroAutor || filtroEpoca || filtroEstoque !== 'todos'

  /** Quantos filtros estão no ar — o número que aparece no botão "Filtros". */
  const quantidadeDeFiltros =
    totalMarcadas +
    (busca ? 1 : 0) +
    (filtroAutor ? 1 : 0) +
    (filtroEpoca ? 1 : 0) +
    (filtroEstoque !== 'todos' ? 1 : 0)

  function limparFiltros() {
    setBusca(''); setFiltroAutor('')
    setFiltroEpoca(''); setFiltroEstoque('todos')
    limparFiltroCategorias()
  }

  /**
 * As categorias agrupadas por área, na ordem da tela de filtros.
 *
 * Só entram subcategorias. A lista vem inteira — com as áreas — porque a tela
 * de administração precisa delas, mas um livro não pode ser ligado a uma área:
 * o servidor rejeitaria com "é uma área, não uma categoria". Agrupar também
 * evita que alguém procure "Ficção Científica" entre 57 botões sem fim.
 */
const categoriasAgrupadas = useMemo(() => {
  const porArea = new Map()
  for (const c of categorias) {
    if (!c.categoriaPai) continue
    const chave = c.categoriaPai.id
    if (!porArea.has(chave)) porArea.set(chave, { area: c.categoriaPai, subs: [] })
    porArea.get(chave).subs.push(c)
  }
  return [...porArea.values()]
    .sort((a, b) => (a.area.ordemExibicao ?? 999) - (b.area.ordemExibicao ?? 999))
    .map(g => ({ ...g, subs: g.subs.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')) }))
  }, [categorias])

  /**
   * Só o que o servidor já devolveu: a lista completa de autores e de épocas.
   *
   * Antes, o menu de autores escondeia quem não tinha livro depois do filtro,
   * e fazia isso com um cálculo no navegador que rodava a cada tecla. Agora o
   * servidor já sabe o que existe, e esconder autor por autor exigiria uma
   * contagem por autor que ninguém pediu.
   */
  const autoresDisponiveis = useMemo(
    () => [...autores].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
    [autores]
  )
  const epocasDisponiveis = EPOCAS

  // ════════════════════════════════════════════════════════════
  // Barra de filtros
  // ════════════════════════════════════════════════════════════
  const barraFiltros = (
    <div className="livros-filtros-area">
      <FiltroPilhas
        arvore={arvore}
        selecionados={categoriasUrl}
        areasSelecionadas={areasUrl}
        modo={modoUrl}
        totalNoModo={paginaDados.total ?? 0}
        totalQualquer={facetas.totalQualquer}
        totalTodas={facetas.totalTodas}
        zeroNoModo={zeroNoModo}
        carregando={carregandoEstante}
        onAlternarSubcategoria={alternarCategoria}
        onAlternarArea={alternarArea}
        onLimpar={limparFiltroCategorias}
        onTrocarModo={trocarModo}
      />

      <div className="livros-busca-wrapper">
        <svg className="livros-busca-icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/>
        </svg>
        <input
          className="livros-busca-input"
          type="search"
          placeholder="Buscar por título, autor ou ISBN…"
          value={busca}
          onChange={e => { setBusca(e.target.value); atualizarUrl({ pagina: 1 }) }}
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
          {quantidadeDeFiltros > 0 && (
            <span className="livros-filtros-badge">{quantidadeDeFiltros}</span>
          )}
        </button>

        {temFiltroAtivo && (
          <button className="livros-limpar-btn" onClick={limparFiltros}>Limpar filtros</button>
        )}
      </div>

      {filtrosAbertos && (
        <div className="livros-filtros-grid">
          <SelectBuscavel
            label="Autor"
            placeholderOpcao="Todos os autores"
            opcoes={autoresDisponiveis.map(a => ({ value: a.id, label: a.nome }))}
            valor={filtroAutor}
            onChange={v => { setFiltroAutor(v); atualizarUrl({ pagina: 1 }) }}
          />

          <SelectBuscavel
            label="Época"
            placeholderOpcao="Todas as épocas"
            opcoes={epocasDisponiveis.map(ep => ({ value: ep.value, label: epocaFullLabel(ep) }))}
            valor={filtroEpoca}
            onChange={v => { setFiltroEpoca(v); atualizarUrl({ pagina: 1 }) }}
          />

          <SelectBuscavel
            label="Disponibilidade"
            placeholderOpcao="Todos"
            opcoes={[
              { value: 'disponiveis',   label: 'Disponíveis' },
              { value: 'indisponiveis', label: 'Indisponíveis' },
            ]}
            valor={filtroEstoque === 'todos' ? '' : filtroEstoque}
            onChange={v => { setFiltroEstoque(v || 'todos'); atualizarUrl({ pagina: 1 }) }}
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
              <p className="pagina-subtitulo" aria-live="polite">
                {paginaDados.total ?? 0} de {totalAcervo} livro(s)
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
              {paginaDados.total ?? 0} livro{(paginaDados.total ?? 0) !== 1 ? 's' : ''}
              {temFiltroAtivo && ' filtrados'}
              {totalPaginas > 1 && ` · página ${paginaSegura} de ${totalPaginas}`}
            </p>
            <GridDropdown
              gridConfig={gridConfig}
              onChange={op => { setGridConfig(op); atualizarUrl({ pagina: 1 }) }}
            />
          </div>

          {/* Grid de cards */}
          {livrosPagina.length === 0 ? (
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
                    style={{ '--cor-area': livro.categoriaPrincipal?.categoriaPai?.cor ?? 'transparent' }}
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
                            // A principal vem primeiro para o formulário saber qual é,
                          // já que ele ainda usa "a primeira é a principal".
                          categoriaIds: [
                            ...(livro.categorias ?? []).filter(c => c.id === livro.categoriaPrincipal?.id),
                            ...(livro.categorias ?? []).filter(c => c.id !== livro.categoriaPrincipal?.id),
                          ].map(c => c.id),
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
                pagina={paginaSegura}
                totalPaginas={totalPaginas}
                onChange={p => {
                  // Trocar de página não deve encher o histórico de voltas:
                  // são 12 cliques para voltar na barra do navegador.
                  atualizarUrl({ pagina: p }, { substituir: true })
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
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
                        if (valores.categoriaIds.length > MAX_CATEGORIAS_POR_LIVRO) {
                          setErro(`Escolha no máximo ${MAX_CATEGORIAS_POR_LIVRO} categorias. Você marcou ${valores.categoriaIds.length}.`)
                          return
                        }
                        const payload = {
                          titulo: valores.titulo,
                          isbn: livroEditando ? livroEditando.isbn : valores.isbn,
                          anoPublicacao: valores.anoPublicacao ? parseInt(valores.anoPublicacao) : null,
                          quantidadeTotal: parseInt(valores.quantidadeTotal),
                          autor: { id: parseInt(valores.autorId) },
                          // O backend lê as categorias de livroCategorias, com uma
                          // marcada como principal. Este formulário numera as
                          // escolhidas na ordem em que foram marcadas e a
                          // número 1 é a principal — é o que o ★ na grade
                          // indica. A Etapa 4 troca isso por um campo
                          // "qual é a principal" explícito, com busca e
                          // criação de subcategoria.
                          livroCategorias: (valores.categoriaIds ?? []).map((id, i) => ({
                            categoria: { id: parseInt(id) },
                            principal: i === 0,
                          })),
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
                        <label>
                          Categorias
                          <span style={{ fontSize: '0.7rem', fontWeight: 400, opacity: 0.7 }}>
                            (de 1 a {MAX_CATEGORIAS_POR_LIVRO}; a marcada com ★ é a principal)
                          </span>
                        </label>

                        {(valores.categoriaIds ?? []).length >= MAX_CATEGORIAS_POR_LIVRO && (
                          <p className="multi-cat-aviso">
                            {MAX_CATEGORIAS_POR_LIVRO} marcadas — o limite. Desmarque uma para trocar.
                          </p>
                        )}

                        {categoriasAgrupadas.map(grupo => (
                          <div key={grupo.area.id} className="multi-cat-grupo">
                            <p className="multi-cat-area" style={{ '--cor-area': grupo.area.cor }}>
                              <span className="multi-cat-ponto" aria-hidden="true" />
                              {grupo.area.nome}
                            </p>
                            <div className="multi-cat-grid">
                              {grupo.subs.map(c => {
                                const ids = valores.categoriaIds ?? []
                                const selecionado = ids.includes(c.id) || ids.includes(String(c.id))
                                const ordem = ids.indexOf(c.id) !== -1
                                  ? ids.indexOf(c.id)
                                  : ids.indexOf(String(c.id))
                                const principal = selecionado && ordem === 0
                                const travado = !selecionado &&
                                  ids.length >= MAX_CATEGORIAS_POR_LIVRO
                                return (
                                  <button
                                    key={c.id}
                                    type="button"
                                    className={`multi-cat-btn ${selecionado ? 'multi-cat-btn--ativo' : ''} ${principal ? 'multi-cat-btn--principal' : ''}`}
                                    disabled={travado}
                                    onClick={() => {
                                      const atual = valores.categoriaIds ?? []
                                      const id = c.id
                                      setValores({
                                        ...valores,
                                        categoriaIds: selecionado
                                          ? atual.filter(x => x !== id && x !== String(id))
                                          : [...atual, id],
                                      })
                                    }}
                                  >
                                    {selecionado && (
                                      <span className="multi-cat-ordem" aria-hidden="true">
                                        {ordem + 1}
                                      </span>
                                    )}
                                    {c.nome}
                                    {selecionado && <span className="multi-cat-check">✓</span>}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        ))}
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
          <p className="livros-hero-sub">{totalAcervo} títulos no acervo</p>
        </div>
        <div className="livros-hero-stat">
          <span className="livros-hero-numero">
            {facetas.totalQualquer}
          </span>
          <span className="livros-hero-label">livros no filtro atual</span>
        </div>
      </div>

      {erroGeral && <p className="erro-msg">{erroGeral}</p>}
      {barraFiltros}

      {livrosPagina.length === 0 ? (
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
              {paginaDados.total ?? 0} resultado{(paginaDados.total ?? 0) !== 1 ? 's' : ''}
              {temFiltroAtivo && ' para os filtros aplicados'}
              {totalPaginas > 1 && ` · página ${paginaSegura} de ${totalPaginas}`}
            </p>

          {/* Seletor de grid — dropdown */}
          <GridDropdown
            gridConfig={gridConfig}
            onChange={op => { setGridConfig(op); atualizarUrl({ pagina: 1 }) }}
          />
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
            pagina={paginaSegura}
            totalPaginas={totalPaginas}
            onChange={p => {
              atualizarUrl({ pagina: p }, { substituir: true })
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          />
        </>
      )}
    </div>
  )
}
