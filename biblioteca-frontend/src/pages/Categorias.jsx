import { useEffect, useState, useMemo } from 'react'
import { useDialogo } from '../context/DialogoContext'
import {
  arvoreCategorias,
  cadastrarCategoria,
  atualizarCategoria,
  excluirCategoria,
  proximaOrdemArea,
} from '../api/categorias'
import './Pagina.css'
import './Categorias.css'

/**
 * As dez cores de área já em uso, mais as que sobraram da paleta.
 *
 * Todas passam em 4.5:1 contra o branco — que é onde o branco da lombada e do
 * rótulo da capa senta em cima da cor da área. Viram os botões do seletor
 * porque oferecer uma cor que o servidor vai recusar seria oferecer um
 * caminho que só dá erro.
 *
 * A última é proposital: Literary é vinho, e uma nova área que também fosse
 * vinho confundiria as pilhas do acervo.
 */
const PALETA = [
  { hex: '#8C2B2B', nome: 'Vinho' },
  { hex: '#6B4A3A', nome: 'Marrom' },
  { hex: '#2F6B4F', nome: 'Verde' },
  { hex: '#1E3D59', nome: 'Azul' },
  { hex: '#4A2545', nome: 'Ameixa' },
  { hex: '#6E5A16', nome: 'Oliva' },
  { hex: '#9C4A1E', nome: 'Ferrugem' },
  { hex: '#7A2E5C', nome: 'Magenta' },
  { hex: '#3F6B7A', nome: 'Petróleo' },
  { hex: '#8C6B2B', nome: 'Ocre' },
  { hex: '#5A3D8C', nome: 'Violeta' },
]

const MODOS = [
  { valor: 'area', rotulo: 'Área', curto: 'a grande' },
  { valor: 'sub',  rotulo: 'Subcategoria', curto: 'a pequena' },
]

const VAZIO = { nome: '', modo: 'area', cor: PALETA[0].hex, ordemExibicao: 1, categoriaPai: '' }

export default function Categorias() {
  const { alertar, confirmar } = useDialogo()

  const [arvore, setArvore]       = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erroGeral, setErroGeral] = useState('')

  const [drawer, setDrawer]       = useState(null)   // null | 'area' | 'sub'
  const [editando, setEditando]   = useState(null)
  const [valores, setValores]     = useState(VAZIO)
  const [erro, setErro]           = useState('')
  const [salvando, setSalvando]   = useState(false)
  const [aberta, setAberta]       = useState(() => new Set())
  const [busca, setBusca]         = useState('')

  async function carregar() {
    try {
      setErroGeral('')
      setArvore((await arvoreCategorias()).areas ?? [])
    } catch {
      setErroGeral('Não foi possível carregar as categorias.')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => { carregar() }, [])

  // ── Abrir o drawer ──────────────────────────────────────

  async function abrirNova(modo, area = null) {
    setErro('')
    setEditando(null)
    setDrawer(modo)
    if (modo === 'area') {
      // A ordem sugerida é a última da fileira: assunto novo entra no fim.
      let ordem = 1
      try { ordem = await proximaOrdemArea() } catch { /* fica 1 */ }
      setValores({ ...VAZIO, modo: 'area', cor: PALETA[10].hex, ordemExibicao: ordem })
    } else {
      setValores({ ...VAZIO, modo: 'sub', categoriaPai: area?.id ?? '' })
    }
  }

  function abrirEdicao(categoria) {
    setErro('')
    setEditando(categoria)
    const ehArea = !categoria.categoriaPai
    setDrawer(ehArea ? 'area' : 'sub')
    setValores({
      nome: categoria.nome,
      modo: ehArea ? 'area' : 'sub',
      cor: categoria.cor ?? PALETA[0].hex,
      ordemExibicao: categoria.ordemExibicao ?? 1,
      categoriaPai: categoria.categoriaPai?.id ?? '',
    })
  }

  function fechar() { setDrawer(null); setEditando(null); setErro('') }

  // ── Salvar ──────────────────────────────────────────────

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')

    if (!valores.nome.trim()) {
      setErro('A categoria precisa de um nome.')
      return
    }
    // Uma subcategoria sem área escolhida não tem para onde ser ligada, e a
    // API a aceitaria como área — que é o erro que a tela antiga cometia.
    if (valores.modo === 'sub' && !valores.categoriaPai) {
      setErro('Escolha a área a que esta subcategoria pertence.')
      return
    }

    const corpo = { nome: valores.nome.trim() }
    if (valores.modo === 'area') {
      corpo.cor = valores.cor
      corpo.ordemExibicao = parseInt(valores.ordemExibicao, 10) || 1
    } else {
      corpo.categoriaPai = { id: parseInt(valores.categoriaPai, 10) }
    }

    setSalvando(true)
    try {
      if (editando) await atualizarCategoria(editando.id, corpo)
      else await cadastrarCategoria(corpo)
      fechar()
      await carregar()
      if (valores.modo === 'area' && !editando) {
        await alertar(`Área "${valores.nome.trim()}" criada. Ela já aparece no filtro do acervo.`, 'sucesso')
      }
    } catch (err) {
      setErro(erroDaApi(err))
    } finally {
      setSalvando(false)
    }
  }

  // ── Excluir ─────────────────────────────────────────────

  async function handleExcluir(categoria, contagem) {
    const ehArea = !categoria.categoriaPai
    const nome = `"${categoria.nome}"`

    if (ehArea && contagem.subcategorias > 0) {
      await alertar(
        `${nome} tem ${contagem.subcategorias} subcategoria(s). `
        + 'Mova ou apague as subcategorias antes de apagar a área.',
        'aviso'
      )
      return
    }
    if (contagem.livros > 0) {
      await alertar(
        `${nome} está em ${contagem.livros} livro(s). `
        + 'Tirar a categoria deixaria esses livros sem classificação.',
        'aviso'
      )
      return
    }

    const ok = await confirmar(
      ehArea
        ? `Apagar a área ${nome}?`
        : `Apagar a subcategoria ${nome}?`,
      'Apagar categoria'
    )
    if (!ok) return

    try {
      await excluirCategoria(categoria.id)
      await carregar()
    } catch (err) {
      await alertar(erroDaApi(err), 'erro')
    }
  }

  // ── Busca ───────────────────────────────────────────────

  /**
   * A busca atravessa os dois níveis.
   *
   * Quando o termo casa com uma subcategoria, a área dela fica na lista mesmo
   * não cassando: senão o resultado some da tela justo quando a pessoa
   * procurou por ele, e ela concluiria que a categoria não existe.
   */
  const filtrado = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return arvore

    return arvore.reduce((saida, area) => {
      const areaCassa = area.nome.toLowerCase().includes(termo)
      const subs = area.subcategorias.filter(s => s.nome.toLowerCase().includes(termo))
      if (areaCassa || subs.length > 0) {
        saida.push({ ...area, subcategorias: areaCassa ? area.subcategorias : subs })
      }
      return saida
    }, [])
  }, [arvore, busca])

  const totalSub = useMemo(
    () => arvore.reduce((s, a) => s + a.subcategorias.length, 0),
    [arvore]
  )

  function alternar(areaId) {
    setAberta(atual => {
      const proximo = new Set(atual)
      if (proximo.has(areaId)) proximo.delete(areaId)
      else proximo.add(areaId)
      return proximo
    })
  }

  // ── Render ──────────────────────────────────────────────

  if (carregando) return (
    <div className="pagina"><div className="dashboard-carregando"><div className="spinner" /></div></div>
  )

  const corDe = (area) => area.cor ?? 'var(--marrom-apoio)'

  return (
    <div className={`bib-layout ${drawer ? 'bib-layout--drawer-aberto' : ''}`}>
      <div className="bib-main">
        <div className="pagina-header">
          <div>
            <h1 className="pagina-titulo">Categorias</h1>
            <p className="pagina-subtitulo" aria-live="polite">
              {arvore.length} área(s) · {totalSub} subcategoria(s)
              {busca.trim() && ` · ${filtrado.length} área(s) no filtro`}
            </p>
          </div>
          {/*
            Um botão só. O drawer já abre com "Esta categoria é: Área /
            Subcategoria", então dois botões na lista seriam duas respostas
            para a mesma pergunta — e o segundo ("+ Subcategoria") deixaria
            quem quer criar uma área procurar num lugar óbvio demais.
          */}
          <button className="btn-primario" onClick={() => abrirNova('area')}>
            + Adicionar categoria
          </button>
        </div>

        {erroGeral && <p className="erro-msg">{erroGeral}</p>}

        <p className="ctg-explicacao">
          As <strong>áreas</strong> são as grandes categorias e viram as pilhas do acervo.
          É a cor delas que pinta a lombada dos livros. As <strong>subcategorias</strong>{' '}
          ficam dentro de uma área e são as que se marcam no filtro. Um livro se
          liga sempre a subcategorias, nunca diretamente a uma área.
        </p>

        <div className="lcb-busca-wrapper">
          <svg className="lcb-busca-icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/>
          </svg>
          <input
            className="lcb-busca-input"
            type="search"
            placeholder="Buscar área ou subcategoria…"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            aria-label="Buscar área ou subcategoria"
          />
          {busca && <button className="lcb-busca-limpar" onClick={() => setBusca('')} aria-label="Limpar">✕</button>}
        </div>

        {filtrado.length === 0 ? (
          <p className="tabela-vazia">
            {busca.trim() ? 'Nenhuma categoria com esse nome.' : 'Nenhuma categoria cadastrada.'}
          </p>
        ) : (
          <ul className="ctg-lista">
            {filtrado.map(area => {
              const expandida = busca.trim() ? true : aberta.has(area.id)
              return (
                <li key={area.id} className="ctg-area" style={{ '--cor-area': corDe(area) }}>

                  <div className="ctg-area-linha">
                    <button
                      className="ctg-area-nome"
                      onClick={() => alternar(area.id)}
                      aria-expanded={expandida}
                      aria-controls={`subs-${area.id}`}
                    >
                      <svg className={`ctg-seta ${expandida ? 'ctg-seta--aberta' : ''}`}
                            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6"/>
                      </svg>
                      <span className="ctg-ponto" aria-hidden="true" />
                      {area.nome}
                    </button>

                    <span className="ctg-area-numeros">
                      {area.totalLivros} livro{area.totalLivros !== 1 ? 's' : ''}
                      {' · '}
                      {area.subcategorias.length} sub
                    </span>

                    <div className="ctg-area-acoes">
                      <button className="btn-editar" onClick={() => abrirEdicao(
                        { id: area.id, nome: area.nome, cor: area.cor,
                          ordemExibicao: area.ordem, categoriaPai: null }) }>
                        Editar
                      </button>
                      <button className="btn-excluir" onClick={() => handleExcluir(
                        { id: area.id, nome: area.nome, categoriaPai: null },
                        { subcategorias: area.subcategorias.length, livros: area.totalLivros }) }>
                        Excluir
                      </button>
                    </div>
                  </div>

                  {expandida && (
                    <ul className="ctg-subs" id={`subs-${area.id}`}>
                      {area.subcategorias.length === 0 && (
                        <li className="ctg-subs-vazia">
                          Nenhuma subcategoria ainda.{' '}
                          <button onClick={() => abrirNova('sub', area)}>Criar a primeira</button>
                        </li>
                      )}

                      {area.subcategorias.map(sub => (
                        <li key={sub.id}
                            className={`ctg-sub ${editando?.id === sub.id && drawer ? 'ctg-sub--ativo' : ''}`}>
                          <span className="ctg-sub-nome">{sub.nome}</span>
                          <span className="ctg-sub-n">
                            {sub.totalLivros} livro{sub.totalLivros !== 1 ? 's' : ''}
                          </span>
                          <span className="ctg-sub-acoes">
                            <button className="btn-editar btn-editar--mini"
                                    onClick={() => abrirEdicao(
                                      { id: sub.id, nome: sub.nome, cor: null, ordemExibicao: 0,
                                        categoriaPai: { id: area.id } })}>
                              Editar
                            </button>
                            <button className="btn-excluir btn-excluir--mini"
                                    onClick={() => handleExcluir(
                                      { id: sub.id, nome: sub.nome, categoriaPai: { id: area.id } },
                                      { subcategorias: 0, livros: sub.totalLivros })}>
                              Excluir
                            </button>
                          </span>
                        </li>
                      ))}

                      <li className="ctg-subs-nova">
                        <button onClick={() => abrirNova('sub', area)}>
                          + Subcategoria em {area.nome}
                        </button>
                      </li>
                    </ul>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* ── Drawer ──────────────────────────────────────── */}
      {drawer && (
        <>
          <div className="bib-drawer-backdrop" onClick={fechar} aria-hidden="true" />
          <aside className="bib-drawer">
            <div className="bib-drawer-header">
              <h2 className="bib-drawer-titulo">
                {editando
                  ? `Editar ${valores.modo === 'area' ? 'área' : 'subcategoria'}`
                  : `Nova ${valores.modo === 'area' ? 'área' : 'subcategoria'}`}
              </h2>
              <button className="bib-drawer-fechar" onClick={fechar} aria-label="Fechar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <div className="bib-drawer-corpo">
              {erro && <p className="erro-msg" role="alert">{erro}</p>}

              {/* Escolha do nível. Só aparece ao criar: uma categoria não vira
                  área e subcategoria na edição, porque as filhas dela ficariam
                  órfãs. */}
              {!editando && (
                <fieldset className="ctg-nivel">
                  <legend>Esta categoria é</legend>
                  {MODOS.map(m => (
                    <label key={m.valor} className={`ctg-nivel-op ${valores.modo === m.valor ? 'ctg-nivel-op--ativa' : ''}`}>
                      <input
                        type="radio"
                        name="modo"
                        value={m.valor}
                        checked={valores.modo === m.valor}
                        onChange={() => setValores({ ...valores, modo: m.valor })}
                      />
                      <strong>{m.rotulo}</strong>
                      <span>{m.curto}</span>
                    </label>
                  ))}
                </fieldset>
              )}

              <div className="formulario-campo">
                <label htmlFor="ctg-nome">Nome</label>
                <input
                  id="ctg-nome"
                  type="text"
                  value={valores.nome}
                  onChange={e => setValores({ ...valores, nome: e.target.value })}
                  placeholder={valores.modo === 'area' ? 'Ex.: Direito e Legislação' : 'Ex.: Direito Constitucional'}
                  maxLength={100}
                  autoFocus
                />
              </div>

              {valores.modo === 'area' ? (
                <>
                  <div className="formulario-campo">
                    <label id="ctg-cor-rotulo">Cor da área</label>
                    <div className="ctg-cores" role="radiogroup" aria-labelledby="ctg-cor-rotulo">
                      {PALETA.map(c => (
                        <button
                          key={c.hex}
                          type="button"
                          role="radio"
                          aria-checked={valores.cor === c.hex}
                          aria-label={c.nome}
                          title={`${c.nome} ${c.hex}`}
                          className={`ctg-cor ${valores.cor === c.hex ? 'ctg-cor--ativa' : ''}`}
                          style={{ '--cor-area': c.hex }}
                          onClick={() => setValores({ ...valores, cor: c.hex })}
                        >
                          {valores.cor === c.hex && <span aria-hidden="true">✓</span>}
                        </button>
                      ))}
                    </div>
                    <p className="ctg-dica">
                      Todas passam em 4.5:1 contra o branco, que é onde o branco
                      da lombada senta em cima da cor. Uma cor clara deixaria o
                      título do livro ilegível na capa.
                    </p>
                  </div>

                  <div className="formulario-campo">
                    <label htmlFor="ctg-ordem">Ordem na estante</label>
                    <input
                      id="ctg-ordem"
                      type="number"
                      min={1}
                      value={valores.ordemExibicao}
                      onChange={e => setValores({ ...valores, ordemExibicao: e.target.value })}
                    />
                    <p className="ctg-dica">
                      Define a posição da pilha no acervo. Menor aparece primeiro.
                    </p>
                  </div>
                </>
              ) : (
                <div className="formulario-campo">
                  <label htmlFor="ctg-area">Área da subcategoria</label>
                  <select
                    id="ctg-area"
                    value={valores.categoriaPai}
                    onChange={e => setValores({ ...valores, categoriaPai: e.target.value })}
                  >
                    <option value="">Escolha a área…</option>
                    {arvore.map(a => (
                      <option key={a.id} value={a.id}>{a.nome}</option>
                    ))}
                  </select>
                  <p className="ctg-dica">
                    Subcategoria fica dentro de uma área e não pode ter
                    subcategoria. São dois níveis, e só.
                  </p>
                </div>
              )}

              <div className="ctg-acoes">
                <button className="btn-primario" onClick={handleSubmit} disabled={salvando}>
                  {salvando ? 'Salvando…' : editando ? 'Salvar' : 'Criar'}
                </button>
                <button className="btn-secundario" onClick={fechar}>Cancelar</button>
              </div>
            </div>
          </aside>
        </>
      )}
    </div>
  )
}

/**
 * A mensagem do servidor, com um texto de reserva quando ela não vem.
 *
 * A API responde {"erro": "..."} nas regras de negócio. Quando o erro é de
 * outra natureza — corpo malformado, rede caída — o axios entrega um erro sem
 * esse campo, e mostrar "undefined" na tela ajuda ninguém.
 */
function erroDaApi(err) {
  return err?.response?.data?.erro
    || (err?.response ? 'Não foi possível concluir a operação.' : 'Servidor indisponível. Verifique sua conexão.')
}