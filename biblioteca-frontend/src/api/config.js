import axios from 'axios'

// URL base da API — lida da variável de ambiente VITE_API_URL
// Defina em .env (não commite) ou em .env.example (modelo sem valores)
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api'
})

// Interceptor de requisição: injeta o token em todos os requests automaticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Interceptor de resposta: redireciona para /login em caso de 401,
// MAS apenas fora dos endpoints de autenticação.
// Um 401 em /auth/login ou /auth/register é senha errada — deve ser
// tratado pelo componente, não redirecionado, senão o erro some antes
// de ser exibido.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthEndpoint = error.config?.url?.includes('/auth/')
    if (error.response?.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('token')
      localStorage.removeItem('usuario')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
