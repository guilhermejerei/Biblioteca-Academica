import { useSom } from '../context/SomContext'
import { usePreferencias } from '../context/PreferenciasContext'
import { OPCOES_FONTE } from '../context/CatalogoAparencia'
import { IconeVolume, IconeCheck, IconePaleta } from '../components/IconesConfig'
import './Configuracoes.css'

/**
 * O som usado pelo botão de teste.
 *
 * 'click' é o mais curto e o mais neutro dos oito: é o que toca o tempo
 * todo, então é o melhor para avaliar o volume sem que a pessoa confuse o
 * efeito com o som que está medindo.
 */
const SOM_DE_TESTE = 'click'

export default function Configuracoes() {
  const {
    somAtivo, alternarSom, volume, definirVolume, testar, restaurarSom,
  } = useSom()

  const {
    fonte, definirFonte,
    cursorPonto, definirCursorPonto,
    restaurar: restaurarAparencia,
  } = usePreferencias()

  const somNoPadrao = somAtivo && volume === 0.4
  const aparenciaNoPadrao = fonte === 'padrao'

  const pct = Math.round(volume * 100)

  return (
    <div className="pagina conf-pagina">

      {/* ── Cabeçalho ───────────────────────────────────── */}
      <div className="pagina-header">
        <div>
          <h1 className="pagina-titulo">Configurações</h1>
          <p className="pagina-subtitulo">
            Ajuste o som e a aparência do site. Tudo é salvo neste navegador.
          </p>
        </div>

        <button
          type="button"
          className="btn-secundario"
          onClick={() => { restaurarSom(); restaurarAparencia() }}
          disabled={somNoPadrao && aparenciaNoPadrao}
        >
          Restaurar padrões
        </button>
      </div>

      {/* ══════════════════════════════════════════════════
          SOM
          ══════════════════════════════════════════════════ */}
      <section className="conf-secao">
        <header className="conf-secao-cab">
          <span className="conf-secao-icone"><IconeVolume mudo={!somAtivo} /></span>
          <div>
            <h2 className="conf-secao-titulo">Som</h2>
            <p className="conf-secao-desc">
              Sons curtos que tocam quando você interage com o site.
            </p>
          </div>
        </header>

        <div className="conf-cartoes">

          {/* ── Interruptor geral ─────────────────────── */}
          <div className="conf-cartao conf-cartao--interruptor">
            <div className="conf-cartao-texto">
              <span className="conf-rotulo">Som do site</span>
              <span className="conf-ajuda">
                {somAtivo ? 'Os sons tocam normalmente.' : 'Nenhum som é tocado.'}
              </span>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={somAtivo}
              aria-label="Som do site"
              className={`conf-switch ${somAtivo ? 'conf-switch--ligado' : ''}`}
              onClick={() => {
                // Liga com um som de confirmação para quem acabou de ligar:
                // o som passa a existir como retorno imediato do próprio clique.
                const ligando = !somAtivo
                alternarSom()
                if (ligando) window.setTimeout(() => testar(SOM_DE_TESTE), 60)
              }}
            >
              <span className="conf-switch-bola" />
            </button>
          </div>

          {/* ── Volume ────────────────────────────────── */}
          <div className={`conf-cartao conf-cartao--volume ${!somAtivo ? 'conf-cartao--inativa' : ''}`}>
            <div className="conf-volume-topo">
              <div className="conf-cartao-texto">
                <span className="conf-rotulo">Volume</span>
                <span className="conf-ajuda">Intensidade de todos os sons.</span>
              </div>

              <div className="conf-volume-acoes">
                <span className="conf-volume-valor">{pct}%</span>

                <button
                  type="button"
                  className="conf-testar"
                  onClick={() => testar(SOM_DE_TESTE)}
                  title="Ouvir um som de exemplo no volume escolhido"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                  </svg>
                  Testar som
                </button>
              </div>
            </div>

            {/* A régua é desenhada com um <div> e um <input type=range> por
                cima, invisível. Um range nativo styling se arrasta sozinho
                e só dá para trocar cor em navegador por navegador; aqui o
                desenho é o mesmo em todos e o input continua fazendo o
                teclado, o foco e o arrasto funcionarem como devem. */}
            <div className="conf-regua">
              {/* O input vem primeiro de propósito: é ele que recebe o
                  clique e o foco, e as camadas visuais depois de si são
                  apenas pintura, com pointer-events desligado para não
                  roubar o clique. */}
              <input
                type="range"
                className="conf-regua-input"
                min="0"
                max="1"
                step="0.01"
                value={somAtivo ? volume : 0}
                onChange={e => definirVolume(parseFloat(e.target.value))}
                onMouseUp={() => testar(SOM_DE_TESTE)}
                onTouchEnd={() => testar(SOM_DE_TESTE)}
                onKeyUp={e => { if (e.key.startsWith('Arrow')) testar(SOM_DE_TESTE) }}
                disabled={!somAtivo}
                aria-label="Volume dos sons"
                aria-valuetext={`${pct} por cento`}
              />

              <div className="conf-regua-trilho" />
              <div className="conf-regua-cheio" style={{ width: `${pct}%` }} />
              <div className="conf-regua-bola" style={{ left: `${pct}%` }} />
            </div>

            <div className="conf-volume-marcas" aria-hidden="true">
              <span>0</span>
              <span>25</span>
              <span>50</span>
              <span>75</span>
              <span>100</span>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          APARÊNCIA
          ══════════════════════════════════════════════════ */}
      <section className="conf-secao">
        <header className="conf-secao-cab">
          <span className="conf-secao-icone"><IconePaleta /></span>
          <div>
            <h2 className="conf-secao-titulo">Aparência</h2>
            <p className="conf-secao-desc">
              Como o site se apresenta para você.
            </p>
          </div>
        </header>

        <div className="conf-cartoes">

          {/* ── Cursor de ponto ────────────────────────── */}
          <div className="conf-cartao conf-cartao--interruptor">
            <div className="conf-cartao-texto">
              <span className="conf-rotulo">Cursor de ponto</span>
              <span className="conf-ajuda">
                Substitui a seta do sistema por um ponto que acompanha o mouse.
                Não fica disponível em telas de toque.
              </span>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={cursorPonto === true}
              aria-label="Cursor de ponto"
              className={`conf-switch ${cursorPonto ? 'conf-switch--ligado' : ''}`}
              onClick={() => definirCursorPonto(!cursorPonto)}
            >
              <span className="conf-switch-bola" />
            </button>
          </div>

          {/* ── Tamanho da fonte ───────────────────────── */}
          <div className="conf-cartao conf-cartao--opcao conf-cartao--fonte">
            <div className="conf-cartao-texto">
              <span className="conf-rotulo">Tamanho do texto</span>
              <span className="conf-ajuda">
                Afeta o site inteiro de uma vez.
              </span>
            </div>

            <div className="conf-segmentos" role="group" aria-label="Tamanho do texto">
              {OPCOES_FONTE.map(op => (
                <button
                  key={op.valor}
                  type="button"
                  className={`conf-segmento ${fonte === op.valor ? 'conf-segmento--ativo' : ''}`}
                  aria-pressed={fonte === op.valor}
                  onClick={() => definirFonte(op.valor)}
                >
                  <span className="conf-segmento-amostra" style={{ fontSize: op.px }}>Aa</span>
                  <span className="conf-segmento-rotulo">{op.rotulo}</span>
                  {fonte === op.valor && (
                    <span className="conf-segmento-tick"><IconeCheck /></span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Nota sobre onde as preferências ficam ──────── */}
      <p className="conf-nota">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
        </svg>
        Estas preferências ficam salvas apenas neste navegador. Entrar em outra
        conta ou usar outro dispositivo começa com o padrão do site.
      </p>
    </div>
  )
}