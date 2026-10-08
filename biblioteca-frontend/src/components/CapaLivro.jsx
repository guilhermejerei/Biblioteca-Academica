import { useState, useMemo } from 'react'
import './CapaLivro.css'

/**
 * 12 paletas para as capas desenhadas em CSS, calculadas deterministicamente
 * a partir do hash do título do livro.
 */
const PALETAS = [
  { de: '#c35a2b', para: '#5c1f0d' }, // Terracota / Vinho
  { de: '#1e3d59', para: '#0f1f2e' }, // Azul Marinho Profundo
  { de: '#1b4d3e', para: '#0d2b22' }, // Verde Floresta
  { de: '#5d3a1a', para: '#2e1c0d' }, // Couro / Café
  { de: '#4a2545', para: '#261324' }, // Púrpura Escuro
  { de: '#2c5d63', para: '#132d30' }, // Azul Petróleo
  { de: '#7b2d26', para: '#3d1613' }, // Carmesim
  { de: '#2e5a27', para: '#173014' }, // Musgo
  { de: '#6b3012', para: '#361809' }, // Castanho
  { de: '#2b2d42', para: '#141520' }, // Grafite Azulado
  { de: '#504b43', para: '#282521' }, // Sépia / Antracite
  { de: '#723d46', para: '#391e23' }, // Borgonha
]

function obterPaleta(titulo = '') {
  let hash = 0
  for (let i = 0; i < titulo.length; i++) {
    hash = titulo.charCodeAt(i) + ((hash << 5) - hash)
  }
  return PALETAS[Math.abs(hash) % PALETAS.length]
}

/**
 * Escurece uma cor da área para o degradê da capa.
 *
 * A capa desenhada vai da cor da área a uma versão mais escura dela. Se
 * usasse a mesma nos dois pontos, o degradê sumiria e a capa viraria um bloco
 * chapado — o mesmo defeito que a pilha tinha antes de ganhar fatias.
 */
function escurecer(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex)
  if (!m) return hex
  const n = parseInt(m[1], 16)
  const r = Math.round(((n >> 16) & 0xff) * 0.62)
  const g = Math.round(((n >> 8) & 0xff) * 0.62)
  const b = Math.round((n & 0xff) * 0.62)
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}

export default function CapaLivro({
  livro,
  urlCapa: propUrlCapa,
  titulo: propTitulo,
  autor: propAutor,
  ano: propAno,
  categoria: propCategoria,
  cor: propCor,
  className = '',
  style = {}
}) {
  const [erroCarregamento, setErroCarregamento] = useState(false)
  const [carregando, setCarregando] = useState(true)

  // Extrai propriedades diretamente do objeto livro ou das props avulsas
  const titulo = livro?.titulo ?? propTitulo ?? ''
  const autorNome = livro?.autor?.nome ?? propAutor ?? ''
  const anoPublicacao = livro?.anoPublicacao ?? propAno ?? ''
  const categoriaNome = livro?.categoria?.nome ?? propCategoria ?? ''
  const urlCapa = livro?.urlCapa ?? propUrlCapa ?? null

  const paleta = useMemo(() => obterPaleta(titulo), [titulo])

  // A cor da área da categoria principal, quando existe. A capa desenhada usa
  // essa cor em vez da paleta por hash do título: assim dois livros da mesma
  // área saem da mesma cor, que é o que faz a estante parecer organizada.
  const corDaArea = propCor ?? livro?.categoriaPrincipal?.categoriaPai?.cor ?? null

  // Normaliza URL da capa: sempre servida pelo backend da biblioteca
  const urlCompleta = useMemo(() => {
    if (!urlCapa) return null
    if (urlCapa.startsWith('http://') || urlCapa.startsWith('https://')) {
      return urlCapa
    }
    const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:8080/api').replace(/\/api\/?$/, '')
    const path = urlCapa.startsWith('/') ? urlCapa : `/${urlCapa}`
    return `${apiBase}${path}`
  }, [urlCapa])

  const temImagemValida = Boolean(urlCompleta && !erroCarregamento)

  return (
    <div className={`capa-container ${className}`} style={style}>
      {/* 1. Imagem real servida pelo backend (se disponível e sem erro de carregamento) */}
      {temImagemValida && (
        <img
          src={urlCompleta}
          alt={`Capa do livro ${titulo}`}
          loading="lazy"
          className={`capa-imagem ${carregando ? 'carregando' : ''}`}
          onLoad={() => setCarregando(false)}
          onError={() => {
            setErroCarregamento(true)
            setCarregando(false)
          }}
        />
      )}

      {/* 2. Capa desenhada em CSS (quando não há imagem ou quando o carregamento falha) */}
      {!temImagemValida && (
        <div
          className="capa-desenhada"
          style={{
            background: corDaArea
              ? `linear-gradient(145deg, ${corDaArea} 0%, ${escurecer(corDaArea)} 100%)`
              : `linear-gradient(145deg, ${paleta.de} 0%, ${paleta.para} 100%)`,
          }}
          aria-label={`Capa estilizada: ${titulo}`}
        >
          <div className="capa-css-topo">
            {autorNome && <p className="capa-css-autor">{autorNome}</p>}
          </div>

          <div className="capa-css-meio">
            <h4 className="capa-css-titulo">{titulo}</h4>
            <div className="capa-css-linha" />
          </div>

          <div className="capa-css-base">
            {categoriaNome && <span className="capa-css-categoria">{categoriaNome}</span>}
            {anoPublicacao && <span className="capa-css-ano">{anoPublicacao}</span>}
          </div>
        </div>
      )}

      {/* 3. Efeitos de aspecto de livro físico sobrepostos à capa (dobra da lombada e corte de páginas) */}
      <div className="capa-dobra-esquerda" aria-hidden="true" />
      <div className="capa-corte-direita" aria-hidden="true" />
    </div>
  )
}
