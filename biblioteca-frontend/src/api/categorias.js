import api from './config'

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
