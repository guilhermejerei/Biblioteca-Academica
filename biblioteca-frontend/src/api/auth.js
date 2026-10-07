import api from './config'

export async function login(email, senha) {
  const res = await api.post('/auth/login', { email, senha })
  return res.data
}

export async function register(dados) {
  const res = await api.post('/auth/register', dados)
  return res.data
}

export async function logout() {
  try {
    await api.post('/auth/logout')
  } catch (_) {
    // ignora erros no logout — limpa o estado local de qualquer forma
  } finally {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
  }
}
