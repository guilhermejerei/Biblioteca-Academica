import { useEffect, useRef } from 'react'
import './GrainyBackground.css'

/**
 * GrainyBackground
 *
 * Quatro manchas animadas (transform apenas — GPU, sem repaint) sobre
 * base #f4f0ea, cobertas por grão monocromático em tile repetido.
 *
 * Técnica do grão:
 *   - Canvas 256×256 na resolução nativa (devicePixelRatio)
 *   - Cada pixel: ruído monocromático com distribuição gaussiana aproximada
 *     (média de dois randoms → menos agressivo que ruído branco puro)
 *   - Canvas → dataURL → background-image repetida em tile 256px
 *   - mix-blend-mode soft-light: preserva cores, adiciona só textura
 *   - Muito mais leve que canvas full-screen: zero repaint após mount
 */
export default function GrainyBackground() {
  const grainRef = useRef(null)

  useEffect(() => {
    const el = grainRef.current
    if (!el) return

    // Tile pequeno — 256px é suficiente para o padrão não ser óbvio
    const SIZE = 256
    const dpr  = Math.min(window.devicePixelRatio || 1, 2)

    const canvas = document.createElement('canvas')
    canvas.width  = SIZE * dpr
    canvas.height = SIZE * dpr

    const ctx = canvas.getContext('2d')
    const img = ctx.createImageData(SIZE * dpr, SIZE * dpr)
    const d   = img.data

    for (let i = 0; i < d.length; i += 4) {
      // Gaussiana aproximada: média de dois randoms
      const v = ((Math.random() + Math.random()) * 127.5) | 0
      d[i]     = v + 64  // R — puxa para o meio (64–191), evita preto/branco puros
      d[i + 1] = v + 64  // G
      d[i + 2] = v + 64  // B
      d[i + 3] = 255     // A — opacidade controlada pela div via CSS
    }

    ctx.putImageData(img, 0, 0)

    // Aplica como background-image repetida — muito mais eficiente que canvas full-screen
    const url = canvas.toDataURL('image/png')
    el.style.backgroundImage = `url(${url})`
  }, [])

  return (
    <div className="gb" aria-hidden="true">
      {/* Manchas de cor — animadas só com transform (zero repaint) */}
      <div className="gb__blob gb__sun"   />
      <div className="gb__blob gb__light" />
      <div className="gb__blob gb__shade" />
      <div className="gb__blob gb__cool"  />

      {/* Grão: tile repetido via background-image, blend soft-light */}
      <div ref={grainRef} className="gb__grain" />
    </div>
  )
}
