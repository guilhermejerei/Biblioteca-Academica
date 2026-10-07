import api from './config'

export async function listarEmprestimos() {
  const res = await api.get('/emprestimos')
  return res.data
}

export async function buscarEmprestimoPorId(id) {
  const res = await api.get(`/emprestimos/${id}`)
  return res.data
}

export async function buscarEmprestimosPorUsuario(usuarioId) {
  const res = await api.get(`/emprestimos/usuario/${usuarioId}`)
  return res.data
}

export async function buscarEmprestimosAtivos() {
  const res = await api.get('/emprestimos/ativos')
  return res.data
}

export async function buscarEmprestimosAtrasados() {
  const res = await api.get('/emprestimos/atrasados')
  return res.data
}

export async function realizarEmprestimo(usuarioId, livroId, dataPrevistaDevolucao = null) {
  const payload = { usuarioId, livroId }
  if (dataPrevistaDevolucao) payload.dataPrevistaDevolucao = dataPrevistaDevolucao
  const res = await api.post('/emprestimos', payload)
  return res.data
}

export async function registrarDevolucao(id) {
  const res = await api.put(`/emprestimos/${id}/devolucao`)
  return res.data
}

export async function atualizarPrazo(id, novaDataPrevista) {
  const res = await api.put(`/emprestimos/${id}/prazo`, { novaDataPrevista })
  return res.data
}
