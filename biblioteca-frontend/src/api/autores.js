import api from './config'

export async function listarAutores() {
  const res = await api.get('/autores')
  return res.data
}

export async function buscarAutorPorId(id) {
  const res = await api.get(`/autores/${id}`)
  return res.data
}

export async function cadastrarAutor(autor) {
  const res = await api.post('/autores', autor)
  return res.data
}

export async function atualizarAutor(id, autor) {
  const res = await api.put(`/autores/${id}`, autor)
  return res.data
}

export async function excluirAutor(id) {
  await api.delete(`/autores/${id}`)
}
