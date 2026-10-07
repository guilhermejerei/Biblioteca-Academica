import api from './config'

export async function listarUsuarios() {
  const res = await api.get('/usuarios')
  return res.data
}

export async function buscarUsuarioPorId(id) {
  const res = await api.get(`/usuarios/${id}`)
  return res.data
}

export async function cadastrarUsuario(usuario) {
  const res = await api.post('/usuarios', usuario)
  return res.data
}

export async function atualizarUsuario(id, usuario) {
  const res = await api.put(`/usuarios/${id}`, usuario)
  return res.data
}

export async function excluirUsuario(id) {
  await api.delete(`/usuarios/${id}`)
}
