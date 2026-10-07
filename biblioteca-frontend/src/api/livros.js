import api from './config'

export async function listarLivros() {
  const res = await api.get('/livros')
  return res.data
}

export async function buscarLivroPorId(id) {
  const res = await api.get(`/livros/${id}`)
  return res.data
}

export async function buscarLivroPorIsbn(isbn) {
  const res = await api.get(`/livros/isbn/${isbn}`)
  return res.data
}

export async function cadastrarLivro(livro) {
  const res = await api.post('/livros', livro)
  return res.data
}

export async function atualizarLivro(id, livro) {
  const res = await api.put(`/livros/${id}`, livro)
  return res.data
}

export async function excluirLivro(id) {
  await api.delete(`/livros/${id}`)
}

export async function buscarCapaNovamente(id) {
  const res = await api.post(`/livros/${id}/capa/buscar`)
  return res.data
}

export async function uploadCapaManual(id, arquivo) {
  const formData = new FormData()
  formData.append('arquivo', arquivo)
  const res = await api.post(`/livros/${id}/capa`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return res.data
}

export async function listarCapasParaRevisao() {
  const res = await api.get('/livros/capas/revisao')
  return res.data
}

export async function aprovarCapa(id) {
  const res = await api.put(`/livros/${id}/capa/aprovar`)
  return res.data
}

export async function rejeitarCapa(id) {
  const res = await api.put(`/livros/${id}/capa/rejeitar`)
  return res.data
}

export async function sincronizarCapas() {
  const res = await api.post('/livros/capas/sincronizar')
  return res.data
}

