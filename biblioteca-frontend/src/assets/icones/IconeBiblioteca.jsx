/**
 * IconeBiblioteca — o ícone do site, em React.
 *
 * Porta de public/icone.svg, o desenho de referência: um arco de entrada com
 * três prateleiras de livros, com sombra e moldura em degradê. Antes o navbar
 * usava uma versão simplificada de duas prateleiras que só existia aqui; ela
 * e o public/favicon.svg foram trocados por este mesmo desenho, para que a
 * aba do navegador, o ícone do app instalado e a marca dentro do site
 * contem a mesma história.
 *
 * Os ids dos gradientes e clipes levam o prefixo "ib-" porque ids de SVG são
 * globais na página: sem o prefixo, duas cópias do componente (o navbar e a
 * tela de login, por exemplo) colidiria. Não muda nada no desenho.
 *
 * Props:
 *   size       — lado em pixels (padrão: 28)
 *   className  — classe CSS opcional
 *   semRotulo  — omite o aria-label. Use quando o ícone repete um texto que
 *                já está ao lado na tela; aí o leitor de ouve "Biblioteca"
 *                duas vezes. O navbar e o login passam true.
 */
export default function IconeBiblioteca({
  size = 28,
  className = '',
  semRotulo = false,
  titulo = 'Biblioteca Acadêmica',
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width={size}
      height={size}
      className={className}
      role={semRotulo ? 'presentation' : 'img'}
      aria-label={semRotulo ? undefined : titulo}
      aria-hidden={semRotulo ? 'true' : undefined}
      focusable="false"
    >
      <defs>
        <linearGradient id="ib-fundo" x1="0.1" y1="0" x2="0.8" y2="1">
          <stop offset="0"    stopColor="#9C322C" />
          <stop offset="0.55" stopColor="#6E211F" />
          <stop offset="1"    stopColor="#341113" />
        </linearGradient>

        <linearGradient id="ib-moldura" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFF9F0" />
          <stop offset="1" stopColor="#EAD6B6" />
        </linearGradient>

        <radialGradient id="ib-luz" gradientUnits="userSpaceOnUse" cx="256" cy="170" r="240">
          <stop offset="0"   stopColor="#F7B87A" />
          <stop offset="0.4" stopColor="#C9622F" />
          <stop offset="1"   stopColor="#2A0F12" />
        </radialGradient>

        <clipPath id="ib-forma">
          <rect width="512" height="512" rx="118" />
        </clipPath>

        <clipPath id="ib-abertura">
          <path d="M142 432V210A114 114 0 0 1 370 210V432Z" />
        </clipPath>

        <filter id="ib-sombra" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="12" />
        </filter>
      </defs>

      <g clipPath="url(#ib-forma)">
        <rect width="512" height="512" fill="url(#ib-fundo)" />

        {/* Sombra do arco sobre o fundo vinho, para a moldura parecer recortada */}
        <path
          d="M116 448V210A140 140 0 0 1 396 210V448Z"
          fill="#1A0809"
          opacity="0.5"
          filter="url(#ib-sombra)"
          transform="translate(0 10)"
        />

        {/* Moldura do arco */}
        <path
          fillRule="evenodd"
          fill="url(#ib-moldura)"
          d="M116 448V210A140 140 0 0 1 396 210V448ZM142 432V210A114 114 0 0 1 370 210V432Z"
        />

        {/* Interior com luz */}
        <g clipPath="url(#ib-abertura)">
          <rect x="130" y="90" width="252" height="350" fill="url(#ib-luz)" />
          <Prateleira />
        </g>

        {/* Contorno interno */}
        <path
          d="M142 432V210A114 114 0 0 1 370 210V432"
          fill="none"
          stroke="#C99A68"
          strokeWidth="3"
          opacity="0.9"
        />
      </g>
    </svg>
  )
}

/**
 * Um livro: corpo e as duas lombadas que separam os volumes.
 *
 * As lombadas são o que faz a prateleira parecer estante e não uma fileira de
 * blocos. São desenhadas dentro do livro em vez de agrupadas por prateleira
 * porque é assim que o SVG original estava escrito, e é o que produz o
 * desenho — mexer na ordem mudaria a imagem.
 */
function Livro({ x, y, largura, altura, cor, comLombadas = true }) {
  return (
    <>
      <rect x={x} y={y} width={largura} height={altura} rx="3" fill={cor} />
      {comLombadas && (
        <>
          <rect x={x} y={y + Math.round(altura * 0.2)} width={largura} height="3" fill="#000" opacity="0.2" />
          <rect
            x={x}
            y={y + Math.round(altura * 0.78)}
            width={largura}
            height="3"
            fill="#000"
            opacity="0.2"
          />
        </>
      )}
    </>
  )
}

/** A prateleira de madeira que separa um andar do outro. */
function Divisoria({ y }) {
  return <rect x="130" y={y} width="252" height="10" fill="#C99A68" />
}

/**
 * As três prateleiras do ícone.
 *
 * As alturas são todas diferentes de propósito: livros de mesma altura lado a
 * lado parecem uma parede. E há um livro tombado no andar do meio — é o único
 * detalhe que faz o desenho não parecer gerado por máquina.
 */
function Prateleira() {
  return (
    <g>
      {/* ── Andar de cima ─────────────────────────────── */}
      <Livro x={140} y={164} largura={22} altura={74} cor="#8C2B2B" />
      <Livro x={164} y={152} largura={18} altura={86} cor="#E2CBAA" />
      <Livro x={184} y={168} largura={26} altura={70} cor="#E27A3E" comLombadas={false} />
      <Livro x={212} y={156} largura={20} altura={82} cor="#FFF8EE" />
      <Livro x={234} y={162} largura={24} altura={76} cor="#6B4A3A" />
      <Livro x={260} y={150} largura={18} altura={88} cor="#F0A055" />
      <Livro x={280} y={166} largura={26} altura={72} cor="#B23A32" comLombadas={false} />
      <Livro x={308} y={158} largura={20} altura={80} cor="#E2CBAA" />
      <Livro x={330} y={170} largura={24} altura={68} cor="#8C2B2B" comLombadas={false} />
      <Livro x={356} y={154} largura={22} altura={84} cor="#FFF8EE" />

      <Divisoria y={238} />

      {/* ── Andar do meio ─────────────────────────────── */}
      <Livro x={140} y={260} largura={24} altura={78} cor="#E27A3E" />
      <Livro x={166} y={254} largura={18} altura={84} cor="#FFF8EE" />
      <Livro x={186} y={266} largura={26} altura={72} cor="#8C2B2B" comLombadas={false} />
      <Livro x={214} y={258} largura={20} altura={80} cor="#E2CBAA" />

      {/* O livro tombado — o único que se destaca do alinhamento */}
      <g transform="rotate(14 252 338)">
        <Livro x={252} y={254} largura={22} altura={84} cor="#F0A055" />
      </g>

      <Livro x={276} y={264} largura={26} altura={74} cor="#6B4A3A" />
      <Livro x={304} y={256} largura={18} altura={82} cor="#FFF8EE" />
      <Livro x={324} y={268} largura={24} altura={70} cor="#B23A32" comLombadas={false} />
      <Livro x={350} y={260} largura={20} altura={78} cor="#E2CBAA" />

      <Divisoria y={338} />

      {/* ── Andar de baixo ────────────────────────────── */}
      <Livro x={140} y={354} largura={20} altura={78} cor="#FFF8EE" />
      <Livro x={162} y={350} largura={26} altura={82} cor="#8C2B2B" />
      <Livro x={190} y={362} largura={18} altura={70} cor="#E2CBAA" comLombadas={false} />
      <Livro x={210} y={352} largura={24} altura={80} cor="#E27A3E" />
      <Livro x={236} y={350} largura={20} altura={82} cor="#6B4A3A" />
      <Livro x={258} y={364} largura={26} altura={68} cor="#FFF8EE" comLombadas={false} />
      <Livro x={286} y={352} largura={18} altura={80} cor="#F0A055" />
      <Livro x={306} y={358} largura={24} altura={74} cor="#B23A32" />
      <Livro x={332} y={350} largura={22} altura={82} cor="#E2CBAA" />
      <Livro x={356} y={362} largura={20} altura={70} cor="#8C2B2B" comLombadas={false} />
    </g>
  )
}