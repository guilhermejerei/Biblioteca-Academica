import api from './config'

/**
 * A árvore de categorias: as áreas na ordem fixa, com as subcategorias, a cor
 * e as contagens.
 *
 * Aceita os mesmos filtros de busca da estante, porque a contagem que a pilha
 * mostra depende deles — uma pilha com 12 livros que estão todos fora do filtro
 * de texto tem que mostrar 0, senão o usuário marca e não acontece nada.
 *
 * @param {object} filtro  mesmo formato de buscarLivros
 */
export async function arvoreCategorias({
  categorias = [],
  areas = [],
  modo = 'qualquer',
  texto = '',
  autor = null,
  epoca = '',
  disponiveis = '',
} = {}) {
  const params = {}
  if (modo) params.modo = modo
  if (texto.trim()) params.texto = texto.trim()
  if (autor) params.autor = autor
  if (epoca) params.epoca = epoca
  if (disponiveis) params.disponiveis = disponiveis
  if (categorias.length) params.cat = categorias.join(',')
  if (areas.length) params.area = areas.join(',')

  const res = await api.get('/categorias/arvore', { params })
  return res.data
}

export async function listarCategorias() {
  const res = await api.get('/categorias')
  return res.data
}

export async function buscarCategoriaPorId(id) {
  const res = await api.get(`/categorias/${id}`)
  return res.data
}

export async function cadastrarCategoria(categoria) {
  const res = await api.post('/categorias', categoria)
  return res.data
}

export async function atualizarCategoria(id, categoria) {
  const res = await api.put(`/categorias/${id}`, categoria)
  return res.data
}

export async function excluirCategoria(id) {
  await api.delete(`/categorias/${id}`)
}
