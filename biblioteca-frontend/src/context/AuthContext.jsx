import { createContext, useContext, useState, useCallback } from 'react'
import { login as apiLogin, logout as apiLogout } from '../api/auth'

// Contexto de autenticação — acessível em qualquer componente via useAuth()
const AuthContext = createContext(null)

/**
 * AuthProvider envolve toda a aplicação e disponibiliza:
 * - usuario: { id, nome, email, tipo } ou null
 * - token: string ou null
 * - login(email, senha): faz login na API e salva no state + localStorage
 * - logout(): remove token e redireciona para /login
 * - isBibliotecario(): true se o tipo for BIBLIOTECARIO
 */
export function AuthProvider({ children }) {
  // Inicializa o estado a partir do localStorage (persiste entre recarregamentos)
  const [usuario, setUsuario] = useState(() => {
    try {
      const salvo = localStorage.getItem('usuario')
      return salvo ? JSON.parse(salvo) : null
    } catch {
      return null
    }
  })

  const [token, setToken] = useState(() => localStorage.getItem('token'))

  const login = useCallback(async (email, senha) => {
    const dados = await apiLogin(email, senha)
    // dados = { token, id, nome, email, tipo }
    const usuarioLogado = {
      id:    dados.id,
      nome:  dados.nome,
      email: dados.email,
      tipo:  dados.tipo
    }
    localStorage.setItem('token',   dados.token)
    localStorage.setItem('usuario', JSON.stringify(usuarioLogado))
    setToken(dados.token)
    setUsuario(usuarioLogado)
    return usuarioLogado
  }, [])

  const logout = useCallback(async () => {
    await apiLogout()
    setToken(null)
    setUsuario(null)
  }, [])

  const isBibliotecario = useCallback(() => {
    return usuario?.tipo === 'BIBLIOTECARIO'
  }, [usuario])

  return (
    <AuthContext.Provider value={{ usuario, token, login, logout, isBibliotecario }}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook para usar o contexto facilmente: const { usuario, login } = useAuth()
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>')
  return ctx
}
