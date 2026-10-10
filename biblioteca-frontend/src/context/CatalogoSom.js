/**
 * Catálogo de sons do site.
 *
 * Fica separado de SomContext.jsx de propósito: um módulo que exporta
 * componentes e, ao mesmo tempo, valores soltos quebra o Fast Refresh do
 * Vite — o estado é descartado a cada edição e a página recarrega. Dados
 * estáticos ficam no próprio módulo, sem estado nenhum.
 */

/**
 * Os sons que existem em /public/sounds.
 *
 * Uma lista fechada, e não uma validação por caminho: `tocar()` só aceita
 * estes nomes, então nenhum componente consegue pedir um arquivo que não
 * está na pasta — nem por engano, nem por engano de digitação.
 */
export const NOMES_VALIDOS = [
  'click',
  'navigate',
  'toggle',
  'confirm',
  'success',
  'error',
  'delete',
  'login',
]

/** Volume a que o som volta em "Restaurar padrões". */
export const VOLUME_PADRAO = 0.4

/**
 * Variação de playbackRate por tipo de som.
 * Sons de feedback têm variação menor (identidade preservada).
 * Sons de clique têm variação maior (sensação de teclado mecânico).
 */
export const VARIACAO_RATE = {
  click:    { min: 0.88, max: 1.14 },
  confirm:  { min: 0.93, max: 1.07 },
  success:  { min: 0.96, max: 1.04 },
  error:    { min: 0.95, max: 1.05 },
  toggle:   { min: 0.90, max: 1.10 },
  navigate: { min: 0.92, max: 1.08 },
  delete:   { min: 0.90, max: 1.10 },
  login:    { min: 0.97, max: 1.03 },
}