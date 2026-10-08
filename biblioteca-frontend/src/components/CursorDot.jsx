import { useCallback, useEffect, useRef, useState } from 'react'
import './CursorDot.css'

/**
 * CursorDot — o cursor do site.
 *
 * Some com a seta do sistema e deixa um ponto que segue o mouse, com um anel
 * que persegue o ponto com atraso. O ponto cresce sobre o que dá para clicar e
 * vira um traço sobre campos de texto.
 *
 * ── Por que existe um botão para desligar ──
 *
 * Esconder o cursor do sistema é um ganho estético e uma barreira para quem
 * tem dificuldade de mirar ou de enxergá-lo. Não é uma decisão que o site
 * pode tomar sozinho: por isso a preferência é do usuário, fica guardada e
 * o botão fica visível para desfazê-la com um clique. Recomeça desligado em
 * quem pediu menos movimento no sistema.
 *
 * ── Nada disso liga em touchscreen ──
 *
 * O gate é (hover: hover) and (pointer: fine). Em celular e tablet não existe
 * mouse para seguir, e esconder o cursor de toque deixaria a interface sem
 * nenhuma indicação de onde o dedo vai cair.
 */

/** Coisas que respondem a um clique e que o ponto deve denunciar. */
const INTERATIVOS = [
  'a[href]',
  'button',
  'summary',
  '[role="button"]',
  '[role="tab"]',
  '[role="switch"]',
  '[role="option"]',
  '[role="menuitem"]',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

/**
 * Campos onde o ponto vira traço de digitação.
 *
 * Os que abrem um diálogo do sistema ficam de fora de propósito: em
 * input[type=file] e em select, o cursor de seta é a informação útil — o
 * popover do select é um menu, não um texto.
 */
const CAMPOS_DE_TEXTO =
  'input:not([type="button"]):not([type="submit"]):not([type="reset"])' +
  ':not([type="checkbox"]):not([type="radio"]):not([type="range"])' +
  ':not([type="color"]):not([type="file"]), textarea'

/** Botões que abrem o seletor de arquivos e os <select> ficam com a seta. */
const COM_SETA = 'select, input[type="file"], input[type="color"]'

/**
 * Quando o anel já está no lugar, dá para parar de pedir animação.
 *
 * Sem isto a gente redesenha dois elementos a 60fps mesmo com o mouse parado,
 * que é o caso comum: o gasto é constante e invisível para quem olha.
 */
const PARADO = 0.4

export default function CursorDot() {
  const raizRef    = useRef(null)
  const pontoRef   = useRef(null)
  const anelRef    = useRef(null)

  // Onde o mouse está de verdade, e onde cada elemento está desenhado.
  // A diferença entre os dois é o atraso do anel.
  const alvo  = useRef({ x: 0, y: 0 })
  const atual = useRef({ x: 0, y: 0 })
  const anel  = useRef({ x: 0, y: 0 })

  const quadro = useRef(0)
  const [ligado, setLigado] = useState(false)
  const [mostrado, setMostrado] = useState(false)

  /**
   * Liga e desliga, e cuida da classe no <html>.
   *
   * A classe precisa estar no <html> e não num div: a regra que esconde a
   * seta precisa alcançar qualquer elemento, inclusive os que estão dentro de
   * iframe ou de shadow DOM, e o seletor parte do html para ter especificidade
   * suficiente contra o `cursor: pointer` que cada componente define.
   */
  useEffect(() => {
    const raiz = document.documentElement
    if (ligado) raiz.classList.add('com-ponto')
    else        raiz.classList.remove('com-ponto')
    return () => raiz.classList.remove('com-ponto')
  }, [ligado])

  /**
   * Escreve a posição. Só `transform`, nunca `left`/`top`.
   *
   * Mudar left/top reprojeta a página inteira a cada mousemove; transform é
   * aplicado só na camada do elemento, o que mantém o cursor a 60fps mesmo
   * com a estante aberta.
   */
  const desenhar = useCallback((x, y, ax, ay) => {
    const p = pontoRef.current
    const a = anelRef.current
    if (p) p.style.transform = `translate3d(${x}px, ${y}px, 0)`
    if (a) a.style.transform = `translate3d(${ax}px, ${ay}px, 0)`
  }, [])

  /**
   * Um laço só para os dois elementos.
   *
   * O ponto vai colado no mouse, sem atraso: atraso no ponto principal faz o
   * clique parecer errado. O anel persegue com interpolação, e é ele que dá a
   * sensação de peso. Enquanto os dois não chegarem, redesenha; quando chegam,
   * para.
   */
  const passo = useCallback(() => {
    const t = alvo.current
    const c = atual.current
    const a = anel.current

    c.x = t.x
    c.y = t.y
    // 0.16 por quadro ≈ chega em ~95% do alvo em 10 quadros (≈160ms)
    a.x += (t.x - a.x) * 0.16
    a.y += (t.y - a.y) * 0.16

    desenhar(c.x, c.y, a.x, a.y)

    const parou =
      Math.abs(t.x - a.x) < PARADO &&
      Math.abs(t.y - a.y) < PARADO

    quadro.current = requestAnimationFrame(passo)
    if (parou) {
      // Encosta o anel exatamente no alvo e dorme.
      a.x = t.x
      a.y = t.y
      desenhar(c.x, c.y, a.x, a.y)
      quadro.current = 0
    }
  }, [desenhar])

  const acordar = useCallback(() => {
    if (!quadro.current) quadro.current = requestAnimationFrame(passo)
  }, [passo])

  useEffect(() => {
    if (!ligado) return

    let ultimoAlvo = null
    let dentroDaJanela = false

    /** Reinicia o anel longe do mouse quando ele entra de novo. */
    function preparar() {
      const t = alvo.current
      atual.current = { x: t.x, y: t.y }
      anel.current = { x: t.x, y: t.y }
      desenhar(t.x, t.y, t.x, t.y)
      acordar()
    }

    function aoMover(e) {
      alvo.current = { x: e.clientX, y: e.clientY }
      if (!dentroDaJanela) {
        dentroDaJanela = true
        setMostrado(true)
        preparar()
        return
      }
      desenhar(e.clientX, e.clientY, anel.current.x, anel.current.y)
      acordar()
    }

    function aoEntrar() {
      dentroDaJanela = true
      setMostrado(true)
      // O alvo mudou de elemento enquanto o mouse estava fora da janela, e a
      // comparação com ultimoAlvo não pegaria isso: tem que reavaliar.
      ultimoAlvo = null
    }

    function aoSair(e) {
      // relatedTarget nulo = saiu pela borda da janela, não para outro elemento
      if (!e.relatedTarget) {
        dentroDaJanela = false
        setMostrado(false)
      }
    }

    /**
     * Só olha o que há sob o mouse quando o alvo MUDA.
     *
     * Descobrir se o que está embaixo é clicável exige getComputedStyle e um
     * laço sobre os elementos — caro demais para rodar a cada mousemove. Mas
     * raramente o alvo muda: o mesmo botão recebe milhares de eventos seguidos.
     */
    function aoTrocarDeAlvo(e) {
      const novo = e.target instanceof Element ? e.target : null
      if (novo === ultimoAlvo) return
      ultimoAlvo = novo

      const raiz = raizRef.current
      if (!raiz) return

      // Saiu de cima de um elemento (apontou para a janela, o DevTools, um
      // iframe). Sem limpar aqui o ponto ficaria com a cor e o formato do
      // último botão sobre o qual ele passou.
      if (!novo) {
        raiz.classList.remove('ponto--clicavel', 'ponto--texto', 'ponto--seta')
        raiz.style.removeProperty('--cor-ponto')
        return
      }

      const ehComSeta = !!novo.closest(COM_SETA)
      const ehCampo   = !ehComSeta && !!novo.closest(CAMPOS_DE_TEXTO)
      const ehClicavel = !ehComSeta && !!novo.closest(INTERATIVOS)

      raiz.classList.toggle('ponto--clicavel', ehClicavel)
      raiz.classList.toggle('ponto--texto', ehCampo)
      raiz.classList.toggle('ponto--seta', ehComSeta)

      // Pega a cor da área quando o elemento tem uma. É o mesmo --cor-area que
      // as pilhas e as lombadas usam, então o ponto assume a cor do assunto em
      // que o mouse está — sem inventar uma segunda paleta.
      let cor = ''
      if (ehClicavel) {
        const comCor = novo.closest('[style*="--cor-area"]')
        if (comCor) {
          const v = getComputedStyle(comCor).getPropertyValue('--cor-area').trim()
          if (v && v !== 'transparent') cor = v
        }
      }
      raiz.style.setProperty('--cor-ponto', cor)
    }

    function aoPressionar() {
      raizRef.current?.classList.add('ponto--pressionado')
    }
    function aoSoltar() {
      raizRef.current?.classList.remove('ponto--pressionado')
    }

    // pointermove/passive: nunca chama preventDefault, e o passive avisa o
    // navegador para não esperar o JS antes de rolar a página.
    window.addEventListener('pointermove', aoMover, { passive: true })
    document.addEventListener('pointerover', aoTrocarDeAlvo, { passive: true })
    window.addEventListener('pointerdown', aoPressionar, { passive: true })
    window.addEventListener('pointerup', aoSoltar, { passive: true })
    window.addEventListener('pointercancel', aoSoltar, { passive: true })
    document.addEventListener('pointerenter', aoEntrar, { passive: true })
    document.documentElement.addEventListener('mouseleave', aoSair)

    return () => {
      window.removeEventListener('pointermove', aoMover)
      document.removeEventListener('pointerover', aoTrocarDeAlvo)
      window.removeEventListener('pointerdown', aoPressionar)
      window.removeEventListener('pointerup', aoSoltar)
      window.removeEventListener('pointercancel', aoSoltar)
      document.removeEventListener('pointerenter', aoEntrar)
      document.documentElement.removeEventListener('mouseleave', aoSair)
      if (quadro.current) cancelAnimationFrame(quadro.current)
      quadro.current = 0
    }
  }, [ligado, desenhar, acordar])

  /**
   * A preferência inicial.
   *
   * Quem pediu menos movimento no sistema começa com o cursor normal: quem
   * sente enjoo com animação é exatamente quem mais sofre com um cursor que
   * persegue o mouse.
   */
  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    const soTemTeclado = window.matchMedia('(hover: none) and (pointer: coarse)')
    try {
      const guardado = localStorage.getItem('ponto_no_cursor')
      setLigado(guardado === null ? !mql.matches && !soTemTeclado.matches : guardado === '1')
    } catch {
      setLigado(false)
    }
  }, [])

  function alternar() {
    setLigado(anterior => {
      const novo = !anterior
      try { localStorage.setItem('ponto_no_cursor', novo ? '1' : '0') } catch {}
      return novo
    })
  }

  const nomeBotao = ligado
    ? 'Usar o cursor normal do sistema'
    : 'Usar o cursor de ponto do site'

  return (
    <>
      {ligado && (
        <div
          className={`ponto-cursor ${mostrado ? 'ponto-cursor--visivel' : ''}`}
          ref={raizRef}
          aria-hidden="true"
        >
          <div className="ponto-anel"  ref={anelRef} />
          <div className="ponto-nucleo" ref={pontoRef} />
        </div>
      )}

      <button
        type="button"
        className={`ponto-chave ${ligado ? 'ponto-chave--ligado' : ''}`}
        onClick={alternar}
        aria-pressed={ligado}
        title={nomeBotao}
      >
        <span className="ponto-chave-icone" aria-hidden="true">
          <span className="ponto-chave-bola" />
        </span>
        <span className="sr-only">{nomeBotao}</span>
      </button>
    </>
  )
}