/**
 * Opções das preferências de aparência.
 *
 * Separado de PreferenciasContext.jsx pelo mesmo motivo de CatalogoSom.js:
 * misturar dados e componentes no mesmo módulo quebra o Fast Refresh.
 *
 * Cada lista aqui é a fonte da verdade. O <select> da tela de Configurações
 * monta os botões a partir dela, e o que vier do localStorage fora da lista
 * é descartado e cai no padrão — sem isso, uma preferência antiga ou
 * adulterada viraria um valor que nenhuma regra CSS reconhece, e a opção
 * ficaria marcada na tela sem nada acontecendo.
 */

export const OPCOES_FONTE = [
  { valor: 'pequeno', rotulo: 'Pequeno', px: '15px' },
  { valor: 'padrao',  rotulo: 'Padrão',  px: '16px' },
  { valor: 'grande',  rotulo: 'Grande',  px: '17.5px' },
]

export const DEFAULTS = {
  fonte: 'padrao',
  /** null = ainda não decidido; resolve no primeiro efeito do provider. */
  cursorPonto: null,
}

/** Só aceita o valor se estiver na lista; senão devolve o padrão. */
export function validar(valor, opcoes, padrao) {
  return opcoes.some(o => o.valor === valor) ? valor : padrao
}