import { useEffect, useMemo, useRef, useState } from 'react'
import Modal from './Modal'
import CapaLivro from './CapaLivro'
import { buscarLivros } from '../api/livros'
import { realizarEmprestimo } from '../api/emprestimos'
import { listarUsuariosParaEmprestimo } from '../api/usuarios'
import './NovoEmprestimo.css'

/**
 * Novo empréstimo, em duas etapas.
 *
 * A ordem é livro primeiro e pessoa depois, que é a ordem real do balcão: o
 * livro está na mão e o cartão do usuário vem junto. O formulário antigo
 * perguntava o usuário primeiro e o livro depois, e nenhum dos dois campos
 * ajudava a escolher o outro.
 *
 * A busca de livro roda no servidor (GET /api/livros?texto=), não no
 * navegador. Com 25 livros um <select> dá conta; com 500 vira uma lista sem
 * rolagem útil, e era assim que a tela estava: carregava o acervo inteiro para
 * jogar numa tag <option>.
 *
 * A pessoa entra só pelo nome. O CPF fica de fora de propósito, e a API foi
 * criada com isso em mente: GET /api/usuarios/para-emprestimo devolve nome e
 * o que a pessoa já tem em aberto, e nada mais.
 */

/** Prazos oferecidos em atalho. O campo de data continua livre para outros. */
const PRAZOS = [
  { dias: 7,  rotulo: '7 dias' },
  { dias: 14, rotulo: '14 dias' },
  { dias: 21, rotulo: '21 dias' },
]

const TAMANHO_BUSCA = 24

/** "2026-10-08" do browser, que é o formato que o input type=date quer. */
function iso(dias = 0) {
  const d = new Date()
  d.setDate(d.getDate() + dias)
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mes}-${dia}`
}

/** "08/10/2026" para ler na tela. */
function dataBruta(isoStr) {
  if (!isoStr) return ''
  const [a, m, d] = isoStr.split('-')
  return `${d}/${m}/${a}`
}

export default function NovoEmprestimo({ onFechar, onConcluido }) {
  const [etapa, setEtapa] = useState(1)

  const [buscaLivro, setBuscaLivro]     = useState('')
  const [resultados, setResultados]     = useState([])
  const [buscandoLivro, setBuscandoLivro] = useState(true)
  /**
   * Contador que força uma nova busca. Entra na dependência do efeito, então
   * somar um nele refaz a consulta com o mesmo termo.
   *
   * É o que corrige o 409: o servidor acabou de recusar por estoque zerado, e
   * a lista na tela ainda mostra o livro como disponível. Recarregar traz o
   * estoque real antes de a pessoa tentar de novo.
   */
  const [recarregarLivros, setRecarregarLivros] = useState(0)
  const [livro, setLivro]               = useState(null)
  const [livroIndisponivel, setLivroIndisponivel] = useState('')

  const [pessoas, setPessoas]           = useState([])
  const [buscaPessoa, setBuscaPessoa]   = useState('')
  const [pessoa, setPessoa]             = useState(null)
  const [prazo, setPrazo]               = useState(iso(14))

  const [erro, setErro]     = useState('')
  const [salvando, setSalvando] = useState(false)
  const buscaRef = useRef(null)

  // ── Etapa 1: livros ───────────────────────────────────────

  useEffect(() => {
    let cancelado = false
    setBuscandoLivro(true)
    buscarLivros({ texto: buscaLivro, pagina: 1, tamanho: TAMANHO_BUSCA })
      .then(r => { if (!cancelado) setResultados(r.itens ?? []) })
      .catch(() => { if (!cancelado) setResultados([]) })
      .finally(() => { if (!cancelado) setBuscandoLivro(false) })
    return () => { cancelado = true }
  }, [buscaLivro, recarregarLivros])

  // ── Etapa 2: pessoas ──────────────────────────────────────

  useEffect(() => {
    if (etapa !== 2) return
    listarUsuariosParaEmprestimo()
      .then(setPessoas)
      .catch(() => setPessoas([]))
  }, [etapa])

  const pessoasFiltradas = useMemo(() => {
    const termo = buscaPessoa.trim().toLowerCase()
    if (!termo) return pessoas
    return pessoas.filter(p => p.nome.toLowerCase().includes(termo))
  }, [pessoas, buscaPessoa])

  // Depois da 2ª pessoa, alguém atrás tem um atraso. A lista avisa antes de
  // confirmar, não depois de o erro vir do servidor.
  const atrasadas = useMemo(
    () => pessoasFiltradas.filter(p => p.emprestimos?.some(e => e.status === 'ATRASADO')).length,
    [pessoasFiltradas]
  )

  function escolherLivro(l) {
    if (!l.quantidadeDisponivel) return
    setLivro(l)
    setLivroIndisponivel('')
    setErro('')
  }

  function irParaPessoa() {
    setErro('')
    setEtapa(2)
    // O foco vai para a busca da pessoa: sem isso o foco fica no botão que
    // sumiu e o teclado perde o lugar.
    setTimeout(() => buscaRef.current?.focus(), 60)
  }

  function voltarAoLivro() {
    setEtapa(1)
    setPessoa(null)
    setErro('')
  }

  async function confirmar() {
    if (!livro || !pessoa) {
      setErro('Escolha o livro e a pessoa antes de confirmar.')
      return
    }
    if (!prazo) {
      setErro('Informe a data prevista de devolução.')
      return
    }

    setErro('')
    setSalvando(true)
    try {
      await realizarEmprestimo(pessoa.id, livro.id, prazo)
      onConcluido?.()
    } catch (err) {
      const status = err.response?.status
      const msg = err.response?.data?.erro || 'Não foi possível registrar o empréstimo.'

      // 409 é estoque. Outro bibliotecário levou o último exemplar entre a
      // busca e o clique. O formulário antigo FECHAVA o modal e mostrava um
      // aviso, jogando fora livro, pessoa e prazo já escolhidos; aqui o
      // modal fica aberto e volta para a etapa do livro.
      if (status === 409) {
        setLivroIndisponivel(msg)
        setEtapa(1)
        // Recarrega a lista: sem isso o livro esgotado continuaria na tela
        // marcado como "último exemplar" e clicável, inviting a pessoa a
        // tentar de novo o mesmo clique que acabou de falhar.
        setRecarregarLivros(n => n + 1)
      } else {
        setErro(msg)
      }
    } finally {
      setSalvando(false)
    }
  }

  function estoque(l) {
    if (!l.quantidadeDisponivel) return null
    const total = l.quantidadeTotal ?? 0
    // Sobrou um só: é o caso que o bibliotecário precisa ver antes de clicar.
    if (l.quantidadeDisponivel === 1) {
      return { texto: 'último exemplar', classe: 'emp-estoque-ultimo' }
    }
    return { texto: `${l.quantidadeDisponivel} de ${total}`, classe: 'emp-estoque-ok' }
  }

  const pessoasComAtraso = (p) => p.emprestimos?.filter(e => e.status === 'ATRASADO') ?? []

  return (
    <Modal titulo="Novo empréstimo" onFechar={onFechar} largo>
      {/* ── Trilha das etapas ─────────────────────────────── */}
      <ol className="emp-trilha">
        <li className={`emp-trilha-passo ${etapa >= 1 ? 'ativo' : ''} ${etapa > 1 ? 'feito' : ''}`}>
          <span className="emp-trilha-num">1</span> O livro
        </li>
        <li className={`emp-trilha-passo ${etapa >= 2 ? 'ativo' : ''}`}>
          <span className="emp-trilha-num">2</span> Quem leva
        </li>
      </ol>

      {erro && <p className="erro-msg" role="alert">{erro}</p>}

      {/* ══ Etapa 1 ══════════════════════════════════════ */}
      {etapa === 1 && (
        <section className="emp-etapa" aria-label="Escolha do livro">
          <div className="emp-busca">
            <svg className="emp-busca-icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/>
            </svg>
            <input
              ref={buscaRef}
              type="search"
              value={buscaLivro}
              onChange={e => { setBuscaLivro(e.target.value); setLivroIndisponivel('') }}
              placeholder="Buscar por título, autor ou ISBN…"
              aria-label="Buscar livro"
              autoFocus
            />
            {buscaLivro && (
              <button className="emp-busca-limpar" onClick={() => setBuscaLivro('')} aria-label="Limpar busca">✕</button>
            )}
          </div>

          {livroIndisponivel && (
            <p className="emp-aviso-estoque" role="status">
              <strong>{livroIndisponivel}</strong>
              Escolha outro exemplar ou confira o estoque.
            </p>
          )}

          {buscandoLivro ? (
            <p className="emp-estado">Procurando no acervo…</p>
          ) : resultados.length === 0 ? (
            <p className="emp-estado">
              {buscaLivro.trim()
                ? 'Nenhum livro com esse nome.'
                : 'Digite para começar a buscar.'}
            </p>
          ) : (
            <>
              <ul className="emp-lista-livros">
                {resultados.map(l => {
                  const est = estoque(l)
                  const semExemplar = !l.quantidadeDisponivel
                  const escolhido = livro?.id === l.id
                  return (
                    <li key={l.id}>
                      <button
                        type="button"
                        className={`emp-livro ${escolhido ? 'emp-livro--escolhido' : ''} ${semExemplar ? 'emp-livro--sem' : ''}`}
                        onClick={() => escolherLivro(l)}
                        disabled={semExemplar}
                        aria-pressed={escolhido}
                      >
                        <span className="emp-livro-capa">
                          <CapaLivro livro={l} />
                        </span>
                        <span className="emp-livro-texto">
                          <span className="emp-livro-titulo">{l.titulo}</span>
                          <span className="emp-livro-autor">{l.autor?.nome ?? '—'}</span>
                        </span>
                        {est ? (
                          <span className={`emp-estoque ${est.classe}`}>{est.texto}</span>
                        ) : (
                          <span className="emp-estoque emp-estoque--zero">sem exemplar</span>
                        )}
                        {escolhido && <span className="emp-livro-ok" aria-hidden="true">✓</span>}
                      </button>
                    </li>
                  )
                })}
              </ul>

              <p className="emp-rodape">
                {resultados.length === TAMANHO_BUSCA
                  ? `Mostrando os primeiros ${TAMANHO_BUSCA}. Refine a busca para achar o título exato.`
                  : `${resultados.length} livro(s).`}
              </p>
            </>
          )}

          <div className="emp-acoes">
            <button
              className="btn-primario"
              onClick={irParaPessoa}
              disabled={!livro}
            >
              {livro ? `Continuar com "${livro.titulo}"` : 'Escolha um livro'}
            </button>
          </div>
        </section>
      )}

      {/* ══ Etapa 2 ══════════════════════════════════════ */}
      {etapa === 2 && (
        <section className="emp-etapa" aria-label="Escolha de quem leva">
          <div className="emp-escolhido">
            <span className="emp-escolhido-capa">
              <CapaLivro livro={livro} />
            </span>
            <span className="emp-escolhido-texto">
              <span className="emp-escolhido-rotulo">Livro escolhido</span>
              <span className="emp-escolhido-titulo">{livro?.titulo}</span>
              <span className="emp-escolhido-autor">{livro?.autor?.nome}</span>
            </span>
            <button className="emp-trocar" onClick={voltarAoLivro}>Trocar</button>
          </div>

          <div className="emp-busca">
            <svg className="emp-busca-icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/>
            </svg>
            <input
              ref={buscaRef}
              type="search"
              value={buscaPessoa}
              onChange={e => setBuscaPessoa(e.target.value)}
              placeholder="Buscar pessoa pelo nome…"
              aria-label="Buscar pessoa"
              autoFocus
            />
            {buscaPessoa && (
              <button className="emp-busca-limpar" onClick={() => setBuscaPessoa('')} aria-label="Limpar busca">✕</button>
            )}
          </div>

          {atrasadas > 0 && (
            <p className="emp-aviso-atraso" role="status">
              {atrasadas === 1
                ? '1 pessoa da lista tem empréstimo atrasado.'
                : `${atrasadas} pessoas da lista têm empréstimo atrasado.`}
            </p>
          )}

          {pessoasFiltradas.length === 0 ? (
            <p className="emp-estado">
              {pessoas.length === 0
                ? 'Carregando...'
                : 'Ninguém com esse nome.'}
            </p>
          ) : (
            <ul className="emp-lista-pessoas">
              {pessoasFiltradas.map(p => {
                const atrasos = pessoasComAtraso(p)
                const emAberto = p.emprestimos?.length ?? 0
                const escolhida = pessoa?.id === p.id
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      className={`emp-pessoa ${escolhida ? 'emp-pessoa--escolhida' : ''}`}
                      onClick={() => { setPessoa(p); setErro('') }}
                      aria-pressed={escolhida}
                    >
                      <span className="emp-pessoa-nome">{p.nome}</span>
                      {atrasos.length > 0 ? (
                        <span className="emp-pessoa-selo emp-pessoa-selo--atraso">
                          {atrasos.length === 1 ? '1 atrasado' : `${atrasos.length} atrasados`}
                        </span>
                      ) : emAberto > 0 ? (
                        <span className="emp-pessoa-selo">
                          {emAberto} com ela
                        </span>
                      ) : (
                        <span className="emp-pessoa-selo emp-pessoa-selo--zero">nada com ela</span>
                      )}
                      {escolhida && <span className="emp-livro-ok" aria-hidden="true">✓</span>}
                    </button>

                    {/* O que a pessoa já tem aparece ao escolher, e não na lista:
                        uma pessoa tem poucos livros, uma biblioteca tem
                        milhares. */}
                    {escolhida && emAberto > 0 && (
                      <ul className="emp-empestimos-da-pessoa">
                        {p.emprestimos.map(e => (
                          <li key={e.id} className={e.status === 'ATRASADO' ? 'atrasado' : ''}>
                            <span className="emp-emp-titulo">{e.titulo}</span>
                            <span className="emp-emp-status">{e.status}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                )
              })}
            </ul>
          )}

          <div className="formulario-campo">
            <label id="emp-prazo-rotulo">Devolução prevista</label>
            <div className="emp-prazos" role="group" aria-labelledby="emp-prazo-rotulo">
              {PRAZOS.map(p => {
                const valor = iso(p.dias)
                const ativo = prazo === valor
                return (
                  <button
                    key={p.dias}
                    type="button"
                    className={`emp-prazo ${ativo ? 'emp-prazo--ativo' : ''}`}
                    onClick={() => setPrazo(valor)}
                    aria-pressed={ativo}
                  >
                    {p.rotulo}
                  </button>
                )
              })}
            </div>
            <input
              className="emp-data"
              type="date"
              value={prazo}
              min={iso(0)}
              onChange={e => setPrazo(e.target.value)}
              aria-label="Data prevista de devolução"
            />
          </div>

          {/* O resumo: o bibliotecário revê livro, pessoa e prazo antes de
              gravar. Sem ele, o botão é um salto no escuro. */}
          <div className="emp-resumo">
            <p className="emp-resumo-linha">
              <span>Livro</span>
              <strong>{livro?.titulo}</strong>
            </p>
            <p className="emp-resumo-linha">
              <span>Pessoa</span>
              <strong>{pessoa?.nome ?? '—'}</strong>
            </p>
            <p className="emp-resumo-linha">
              <span>Devolução</span>
              <strong>{dataBruta(prazo)}</strong>
            </p>
          </div>

          <div className="emp-acoes">
            <button className="btn-secundario" onClick={voltarAoLivro}>Voltar</button>
            <button
              className="btn-primario"
              onClick={confirmar}
              disabled={!pessoa || salvando}
            >
              {salvando ? 'Registrando…' : 'Registrar empréstimo'}
            </button>
          </div>
        </section>
      )}
    </Modal>
  )
}