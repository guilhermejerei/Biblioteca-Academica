import { useEffect, useMemo, useRef, useState } from 'react'
import './FiltroPilhas.css'

/**
 * O filtro em pilhas.
 *
 * Uma pilha por área, sempre na mesma ordem, desenhada em SVG na cor da área.
 * Clicar abre o painel com as subcategorias daquela área; marcar uma fecha e
 * recalcula a estante.
 *
 * O componente é burro de propósito: não busca nada, não filtra nada. Tudo
 * chega pronto — a árvore com as contagens, a seleção atual, o modo e o
 * total — e sai por callbacks. Assim dá para testar as regras sem subir um
 * servidor, que é o que a Etapa 5 faz.
 *
 * Acessibilidade:
 *  - a pilha é <button> com aria-expanded e aria-controls
 *  - a subcategoria é <button> com aria-pressed
 *  - a cor nunca é o único indício: quem está marcado ganha um ✓ e a palavra
 *    "marcada" no rótulo acessível
 *  - o painel fecha com Escape e devolve o foco para a pilha
 *  - a contagem de resultados vive numa região aria-live educada
 */
export default function FiltroPilhas({
  arvore = [],
  selecionados = [],          // ids de subcategoria
  areasSelecionadas = [],      // ids de área
  modo = 'qualquer',
  totalNoModo = 0,
  totalQualquer = 0,
  totalTodas = 0,
  zeroNoModo = false,
  carregando = false,
  onAlternarSubcategoria,
  onAlternarArea,
  onLimpar,
  onTrocarModo,
}) {
  const [pilhaAberta, setPilhaAberta] = useState(null)
  const [busca, setBusca] = useState('')
  const pilhaRefs = useRef({})

  const marcadas = useMemo(() => new Set(selecionados), [selecionados])
  const areasMarcadas = useMemo(() => new Set(areasSelecionadas), [areasSelecionadas])

  // Se a área aberta sumir da árvore (o público não vê as vazias), fecha o
  // painel em vez de deixar um botão apontando para nada.
  useEffect(() => {
    if (pilhaAberta !== null && !arvore.some(a => a.id === pilhaAberta)) {
      setPilhaAberta(null)
    }
  }, [arvore, pilhaAberta])

  // Escape fecha o painel e devolve o foco para a pilha que abriu.
  useEffect(() => {
    if (pilhaAberta === null) return
    function aoTeclar(e) {
      if (e.key === 'Escape') {
        const alvo = pilhaRefs.current[pilhaAberta]
        setPilhaAberta(null)
        alvo?.focus()
      }
    }
    document.addEventListener('keydown', aoTeclar)
    return () => document.removeEventListener('keydown', aoTeclar)
  }, [pilhaAberta])

  const areaAberta = arvore.find(a => a.id === pilhaAberta) ?? null

  const totalMarcadas = selecionados.length + areasSelecionadas.length
  const temFiltro = totalMarcadas > 0

  // Subcategorias que casam com a busca, em qualquer área. É o que permite
  // achar "Ficção Científica" sem abrir a pilha de Literatura.
  const resultadosBusca = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return []
    const achados = []
    for (const area of arvore) {
      for (const sub of area.subcategorias) {
        if (sub.nome.toLowerCase().includes(termo)) {
          achados.push({ area, sub })
        }
      }
    }
    return achados
  }, [busca, arvore])

  function abrirPilha(id) {
    setPilhaAberta(atual => (atual === id ? null : id))
  }

  function aoMarcar(id) {
    onAlternarSubcategoria(id)
  }

  const rotuloContagem =
    `${totalNoModo} ${totalNoModo === 1 ? 'livro' : 'livros'}` +
    (temFiltro ? ` para ${totalMarcadas} ${totalMarcadas === 1 ? 'categoria' : 'categorias'}` : ' no acervo')

  return (
    <section className="pilhas" aria-label="Filtrar por categoria">

      {/* ── Fileira de pilhas ─────────────────────────── */}
      <div className="pilhas-fileira" role="list">
        {arvore.map(area => {
          const marcadasDaArea = area.subcategorias.filter(s => marcadas.has(s.id)).length
          const estaMarcada = areasMarcadas.has(area.id)
          const aberta = pilhaAberta === area.id

          return (
            <div className="pilha-slot" role="listitem" key={area.id}>
              <button
                type="button"
                ref={el => { pilhaRefs.current[area.id] = el }}
                className={`pilha ${aberta ? 'pilha--aberta' : ''} ${estaMarcada ? 'pilha--marcada' : ''}`}
                onClick={() => abrirPilha(area.id)}
                aria-expanded={aberta}
                aria-controls={`painel-pilha-${area.id}`}
                style={{ '--cor-area': area.cor }}
              >
                <PilhaLivros area={area} />

                <span className="pilha-texto">
                  <span className="pilha-nome">{area.nome}</span>
                  <span className="pilha-total">
                    {area.totalLivros} {area.totalLivros === 1 ? 'livro' : 'livros'}
                  </span>
                </span>

                {marcadasDaArea > 0 && (
                  <span className="pilha-selo" aria-hidden="true">{marcasAreasSelecionadas(estaMarcada, marcadasDaArea)}</span>
                )}
                {/* O número vai também no rótulo acessível, para não ser só visual */}
                <span className="sr-only">
                  {estaMarcada
                    ? 'toda a área marcada'
                    : marcadasDaArea > 0
                      ? `${marcadasDaArea} ${marcadasDaArea === 1 ? 'subcategoria marcada' : 'subcategorias marcadas'}`
                      : ''}
                </span>
              </button>
            </div>
          )
        })}
      </div>

      {/* ── Painel da pilha aberta ───────────────────── */}
      {areaAberta && (
        <div
          className="painel-pilha"
          id={`painel-pilha-${areaAberta.id}`}
          role="group"
          aria-label={`Categorias de ${areaAberta.nome}`}
          style={{ '--cor-area': areaAberta.cor }}
        >
          <div className="painel-cabecalho">
            <h3 className="painel-titulo">
              <span className="painel-ponto" aria-hidden="true" />
              {areaAberta.nome}
            </h3>
            <button
              type="button"
              className="painel-fechar"
              onClick={() => {
                const alvo = pilhaRefs.current[areaAberta.id]
                setPilhaAberta(null)
                alvo?.focus()
              }}
              aria-label={`Fechar as categorias de ${areaAberta.nome}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <div className="painel-grade">
            {/* "Toda a pilha" vale como UMA escolha, não como uma por subcategoria */}
            <button
              type="button"
              className={`sub-btn sub-btn--toda ${areasMarcadas.has(areaAberta.id) ? 'sub-btn--marcada' : ''}`}
              onClick={() => onAlternarArea(areaAberta.id)}
              aria-pressed={areasMarcadas.has(areaAberta.id)}
              disabled={areaAberta.totalLivros === 0 && !areasMarcadas.has(areaAberta.id)}
            >
              <span className="sub-nome">Toda a pilha</span>
              <span className="sub-contagem">{areaAberta.totalLivros}</span>
              {areasMarcadas.has(areaAberta.id) && <span className="sub-ok" aria-hidden="true">✓</span>}
            </button>

            {areaAberta.subcategorias.map(sub => {
              const marcada = marcadas.has(sub.id)
              // Contagem zerada: o botão fica desligado, e o motivo aparece no
              // title e no texto para leitor de tela, não só no cursor de "não".
              const zerada = sub.contagemNoFiltro === 0
              return (
                <button
                  type="button"
                  key={sub.id}
                  className={`sub-btn ${marcada ? 'sub-btn--marcada' : ''}`}
                  onClick={() => aoMarcar(sub.id)}
                  aria-pressed={marcada}
                  disabled={zerada && !marcada}
                  title={zerada ? 'Nenhum livro com esta combinação' : undefined}
                >
                  <span className="sub-nome">{sub.nome}</span>
                  <span className="sub-contagem">{sub.contagemNoFiltro}</span>
                  {marcada && <span className="sub-ok" aria-hidden="true">✓</span>}
                  {zerada && !marcada && (
                    <span className="sr-only">nenhum livro com esta combinação</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Busca de categoria ────────────────────────── */}
      <div className="busca-cat">
        <label className="busca-cat-rotulo" htmlFor="busca-categoria">
          Buscar categoria
        </label>
        <div className="busca-cat-campo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/>
          </svg>
          {/* Campo de busca comum. O padrão de combobox foi descartado de propósito:
            aria-expanded não é aceito por <input type="search">, e declarar
            role="listbox" aqui obrigaria os filhos a serem role="option", o
            que não descreve botões de marcar e desmarcar. O que importa —
            que o resultado seja anunciado — vem do aria-live da lista abaixo. */}
          <input
            id="busca-categoria"
            type="search"
            value={busca}
            placeholder="Ache uma subcategoria em qualquer área…"
            onChange={e => setBusca(e.target.value)}
            aria-describedby="busca-cat-resultados"
            autoComplete="off"
          />
          {busca && (
            <button
              type="button"
              className="busca-cat-limpar"
              onClick={() => setBusca('')}
              aria-label="Limpar a busca de categoria"
            >✕</button>
          )}
        </div>

        {/*
          A lista existe sempre, mesmo escondida quando não há busca. O
          aria-describedby aponta para cá, e um alvo que some do DOM deixa a
          referência pendurada. Com aria-live, o leitor de tela anuncia quantas
          categorias o termo encontrou a cada tecla.
        */}
        <ul
          className="busca-cat-lista"
          id="busca-cat-resultados"
          aria-live="polite"
          hidden={!busca.trim()}
        >
          {resultadosBusca.length === 0 && (
            <li className="busca-cat-vazia">Nenhuma categoria com esse nome.</li>
          )}
          {resultadosBusca.map(({ area, sub }) => (
            <li key={sub.id}>
              <button
                type="button"
                className={`busca-cat-item ${marcadas.has(sub.id) ? 'busca-cat-item--marcada' : ''}`}
                onClick={() => aoMarcar(sub.id)}
                aria-pressed={marcadas.has(sub.id)}
                style={{ '--cor-area': area.cor }}
              >
                <span className="busca-cat-pilhao" aria-hidden="true" />
                <span className="busca-cat-nome">{sub.nome}</span>
                <span className="busca-cat-area">{area.nome}</span>
                <span className="busca-cat-n">{sub.totalLivros}</span>
                {marcadas.has(sub.id) && <span className="sub-ok" aria-hidden="true">✓</span>}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* ── Resumo e controles ────────────────────────── */}
      {temFiltro && (
        <div className="pilhas-resumo">
          <p className="resumo-contagem" aria-live="polite">
            {carregando ? 'Procurando…' : rotuloContagem}
          </p>

          <ul className="resumo-etiquetas">
            {arvore.filter(a => areasMarcadas.has(a.id)).map(area => (
              <li key={`area-${area.id}`}>
                <span className="etiqueta etiqueta--area" style={{ '--cor-area': area.cor }}>
                  <span className="etiqueta-ponto" aria-hidden="true" />
                  {area.nome}
                  <span className="sr-only"> (toda a área)</span>
                  <button onClick={() => onAlternarArea(area.id)} aria-label={`Remover a área ${area.nome} do filtro`}>×</button>
                </span>
              </li>
            ))}

            {selecionados.map(id => {
              // O id sozinho não diz nada na tela: precisa do nome da
              // subcategoria e da pilha a que ela pertence.
              const achada = acharSubcategoria(arvore, id)
              if (!achada) return null
              const { area, sub } = achada
              return (
                <li key={`sub-${id}`}>
                  <span className="etiqueta" style={{ '--cor-area': area.cor }}>
                    <span className="etiqueta-ponto" aria-hidden="true" />
                    {sub.nome}
                    <span className="etiqueta-area"> · {area.nome}</span>
                    <button
                      onClick={() => aoMarcar(id)}
                      aria-label={`Remover ${sub.nome} do filtro`}
                    >×</button>
                  </span>
                </li>
              )
            })}
          </ul>

          <button type="button" className="resumo-limpar" onClick={onLimpar}>
            Limpar filtros
          </button>
        </div>
      )}

      {/* ── Combinar ──────────────────────────────────── */}
      {totalMarcadas >= 2 && (
        <div className="combinar" role="group" aria-label="Como combinar as categorias marcadas">
          <span className="combinar-rotulo">Combinar</span>
          <div className="combinar-grade">
            <button
              type="button"
              className={`combinar-op ${modo === 'qualquer' ? 'combinar-op--ativa' : ''}`}
              onClick={() => onTrocarModo('qualquer')}
              aria-pressed={modo === 'qualquer'}
            >
              Qualquer uma <span className="combinar-n">({totalQualquer})</span>
            </button>
            <button
              type="button"
              className={`combinar-op ${modo === 'todas' ? 'combinar-op--ativa' : ''}`}
              onClick={() => onTrocarModo('todas')}
              aria-pressed={modo === 'todas'}
            >
              Todas elas <span className="combinar-n">({totalTodas})</span>
            </button>
          </div>
        </div>
      )}

      {/* ── "Todas elas" sem resultado ────────────────── */}
      {zeroNoModo && (
        <div className="aviso-zero" role="status">
          <p className="aviso-zero-texto">
            Nenhum livro tem <strong>todas</strong> as {totalMarcadas} categorias marcadas ao mesmo tempo.
            Com <em>Qualquer uma</em> aparecem {totalQualquer}.
          </p>
          <button type="button" className="aviso-zero-btn" onClick={() => onTrocarModo('qualquer')}>
            Ver os {totalQualquer} livros
          </button>
        </div>
      )}
    </section>
  )
}

/**
 * Acha uma subcategoria pelo id e devolve também a área dela.
 *
 * A URL traz só ids, então o nome e a cor precisam ser buscados na árvore que
 * já veio da API — inventar um segundo lugar para essa informação faria os dois
 * poderem divergir.
 */
function acharSubcategoria(arvore, id) {
  for (const area of arvore) {
    for (const sub of area.subcategorias) {
      if (sub.id === id) return { area, sub }
    }
  }
  return null
}

/**
 * O desenho de três a quatro livros empilhados, na cor da área.
 *
 * Feito em SVG e não com CSS porque cada livro precisa da sua fatia de cor —
 * com fundo único os livros viram uma mancha só e a pilha deixa de parecer
 * uma pilha. A escala sai da altura, o que mantém a proporção em qualquer
 * tamanho de tela sem depender de fonte de ícone.
 */
function PilhaLivros({ area }) {
  const n = Math.min(Math.max(area.totalLivros, 1), 4)
  const altura = 13
  const recuo = 5

  return (
    <svg className="pilha-desenho" viewBox="0 0 44 58" width="44" height="58" aria-hidden="true">
      {/* A base é sempre desenhada, mesmo com 0 livros: a pilha existe para
          dizer "aqui tem este assunto", mesmo que esteja vazia no filtro. */}
      {Array.from({ length: n }).map((_, i) => {
        const y = 52 - i * altura
        const largura = 34 - (i % 2 === 0 ? 0 : recuo)
        const x = (44 - largura) / 2
        return (
          <rect
            key={i}
            x={x}
            y={y - altura + 2}
            width={largura}
            height={altura}
            rx="2"
            fill="var(--cor-area)"
            opacity={1 - i * 0.16}
          />
        )
      })}
      {/* A lombada de cada livro, para a pilha não virar um bloco só */}
      {Array.from({ length: n }).map((_, i) => {
        const y = 52 - i * altura
        const largura = 34 - (i % 2 === 0 ? 0 : recuo)
        const x = (44 - largura) / 2
        return (
          <rect
            key={`l-${i}`}
            x={x + 1.5}
            y={y - altura + 4}
            width="3"
            height={altura - 4}
            rx="1"
            fill="rgba(255,255,255,0.45)"
          />
        )
      })}
    </svg>
  )
}

/**
 * O que vai no selo da pilha: o número de subcategorias marcadas, ou 1 quando
 * a área inteira está marcada — para não parecer que a pilha "sumiu" um item.
 */
function marcasAreasSelecionadas(areaMarcada, marcadasDaArea) {
  if (areaMarcada) return '✓'
  return marcadasDaArea
}