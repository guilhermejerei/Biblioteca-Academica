import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Protege rotas que exigem autenticação.
 * Se não estiver logado, redireciona para /login.
 */
export function RotaProtegida() {
  const { usuario } = useAuth()
  if (!usuario) return <Navigate to="/login" replace />
  return <Outlet />
}

/**
 * Protege rotas exclusivas de BIBLIOTECARIO.
 * Se for ALUNO ou não autenticado, redireciona para /.
 */
export function RotaBibliotecario() {
  const { usuario } = useAuth()
  if (!usuario) return <Navigate to="/login" replace />
  if (usuario.tipo !== 'BIBLIOTECARIO') return <Navigate to="/" replace />
  return <Outlet />
}
