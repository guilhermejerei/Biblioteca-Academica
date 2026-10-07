import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { DialogoProvider } from './context/DialogoContext'
import { SincronizacaoProvider } from './context/SincronizacaoContext'
import { RotaProtegida, RotaBibliotecario } from './components/RotaProtegida'
import Navbar from './components/Navbar'
import GrainyBackground from './components/GrainyBackground'

// Páginas públicas
import Login    from './pages/Login'
import Cadastro from './pages/Cadastro'

// Páginas autenticadas
import Dashboard   from './pages/Dashboard'
import Livros      from './pages/Livros'
import Autores     from './pages/Autores'
import Categorias  from './pages/Categorias'
import Usuarios    from './pages/Usuarios'
import Emprestimos from './pages/Emprestimos'
import MeuPerfil   from './pages/MeuPerfil'
import MeusEmprestimos from './pages/MeusEmprestimos'

// Renderiza o fundo apenas nas rotas públicas
function FundoPublico() {
  const { pathname } = useLocation()
  const rotaPublica = pathname === '/login' || pathname === '/cadastro'
  return rotaPublica ? <GrainyBackground /> : null
}

export default function App() {
  return (
    <AuthProvider>
      <DialogoProvider>
        <SincronizacaoProvider>
        <BrowserRouter>
          {/* Fundo fixo — renderizado fora de qualquer container de conteúdo */}
          <FundoPublico />

          <Routes>
            {/* Rotas públicas — sem Navbar */}
            <Route path="/login"    element={<Login />} />
            <Route path="/cadastro" element={<Cadastro />} />

            {/* Rotas autenticadas — com Navbar */}
            <Route element={<RotaProtegida />}>
              <Route element={<LayoutComNavbar />}>

                {/* Rotas para qualquer usuário autenticado */}
                <Route path="/livros"           element={<Livros />} />
                <Route path="/meus-emprestimos" element={<MeusEmprestimos />} />
                <Route path="/meu-perfil"       element={<MeuPerfil />} />

                {/* Rotas exclusivas do BIBLIOTECARIO */}
                <Route element={<RotaBibliotecario />}>
                  <Route path="/"            element={<Dashboard />} />
                  <Route path="/autores"     element={<Autores />} />
                  <Route path="/categorias"  element={<Categorias />} />
                  <Route path="/usuarios"    element={<Usuarios />} />
                  <Route path="/emprestimos" element={<Emprestimos />} />
                </Route>

                <Route path="*" element={<Navigate to="/livros" replace />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
        </SincronizacaoProvider>
      </DialogoProvider>
    </AuthProvider>
  )
}

function LayoutComNavbar() {
  return (
    <>
      <Navbar />
      <main>
        <Outlet />
      </main>
    </>
  )
}

import { Outlet } from 'react-router-dom'
