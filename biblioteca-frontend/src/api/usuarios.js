import api from './config'

export async function listarUsuarios() {
  const res = await api.get('/usuarios')
  return res.data
}

/**
 * Quem pode levar livro, para a tela de novo empréstimo.
 *
 * Lista enxuta de propósito: só o nome e o que a pessoa já tem em aberto. Sem
 * CPF, e-mail nem telefone, porque no balcão a escolha é pelo nome e um CPF
 * de onze dígitos ao lado de cada um só rouba largura.
 */
export async function listarUsuariosParaEmprestimo() {
  const res = await api.get('/usuarios/para-emprestimo')
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
