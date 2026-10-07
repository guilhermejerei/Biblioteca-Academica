/**
 * IconeBiblioteca
 * Ícone oficial do projeto: quadrado arredondado com estante de livros.
 * Extraído do favicon.svg gerado para o projeto.
 *
 * Props:
 *   size  — largura/altura em pixels (padrão: 28)
 *   className — classe CSS opcional
 */
export default function IconeBiblioteca({ size = 28, className = '' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Biblioteca"
    >
      <defs>
        <linearGradient id="ib-f" x1="0.1" y1="0" x2="0.8" y2="1">
          <stop offset="0"   stopColor="#9C322C"/>
          <stop offset="1"   stopColor="#4A1716"/>
        </linearGradient>
        <radialGradient id="ib-l" gradientUnits="userSpaceOnUse" cx="256" cy="170" r="240">
          <stop offset="0"   stopColor="#F7B87A"/>
          <stop offset="0.5" stopColor="#B8532A"/>
          <stop offset="1"   stopColor="#2A0F12"/>
        </radialGradient>
        <clipPath id="ib-k"><rect width="512" height="512" rx="118"/></clipPath>
        <clipPath id="ib-a"><path d="M130 436V214A126 126 0 0 1 382 214V436Z"/></clipPath>
      </defs>

      <g clipPath="url(#ib-k)">
        {/* Fundo vinho */}
        <rect width="512" height="512" fill="url(#ib-f)"/>

        {/* Moldura do arco branca */}
        <path
          fillRule="evenodd"
          fill="#FFF9F0"
          d="M96 456V214A160 160 0 0 1 416 214V456ZM130 436V214A126 126 0 0 1 382 214V436Z"
        />

        {/* Interior com luz e livros */}
        <g clipPath="url(#ib-a)">
          <rect x="120" y="80" width="272" height="370" fill="url(#ib-l)"/>

          {/* Prateleira 1 */}
          <rect x="128" y="204" width="34"  height="96"  rx="3" fill="#E2CBAA"/>
          <rect x="164" y="216" width="30"  height="84"  rx="3" fill="#E27A3E"/>
          <rect x="196" y="200" width="36"  height="100" rx="3" fill="#FFF8EE"/>
          <rect x="234" y="212" width="30"  height="88"  rx="3" fill="#F0A055"/>
          <rect x="266" y="208" width="34"  height="92"  rx="3" fill="#E2CBAA"/>
          <rect x="302" y="216" width="36"  height="84"  rx="3" fill="#E27A3E"/>

          {/* Divisória */}
          <rect x="120" y="300" width="272" height="14"  fill="#C99A68"/>

          {/* Prateleira 2 */}
          <rect x="128" y="344" width="36"  height="92"  rx="3" fill="#FFF8EE"/>
          <rect x="166" y="336" width="30"  height="100" rx="3" fill="#E27A3E"/>
          <rect x="198" y="352" width="34"  height="84"  rx="3" fill="#E2CBAA"/>
          <rect x="234" y="340" width="36"  height="96"  rx="3" fill="#F0A055"/>
          <rect x="272" y="348" width="30"  height="88"  rx="3" fill="#FFF8EE"/>
          <rect x="304" y="342" width="34"  height="94"  rx="3" fill="#E27A3E"/>
        </g>
      </g>
    </svg>
  )
}
