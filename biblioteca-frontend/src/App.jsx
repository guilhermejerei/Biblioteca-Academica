import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { AuthProvider } from './context/AuthContext'
import { DialogoProvider } from './context/DialogoContext'
import { SincronizacaoProvider } from './context/SincronizacaoContext'
import { SomProvider } from './context/SomContext'
import { RotaProtegida, RotaBibliotecario } from './components/RotaProtegida'
import Navbar from './components/Navbar'
import GrainyBackground from './components/GrainyBackground'
import CursorDot from './components/CursorDot'

// Páginas públicas
import Login    from './pages/Login'
import Cadastro from './pages/Cadastro'

// Páginas autenticadas — carregadas sob demanda
const Dashboard        = lazy(() => import('./pages/Dashboard'))
const Livros           = lazy(() => import('./pages/Livros'))
const Autores          = lazy(() => import('./pages/Autores'))
const Categorias       = lazy(() => import('./pages/Categorias'))
const Usuarios         = lazy(() => import('./pages/Usuarios'))
const Emprestimos      = lazy(() => import('./pages/Emprestimos'))
const MeuPerfil        = lazy(() => import('./pages/MeuPerfil'))
const MeusEmprestimos  = lazy(() => import('./pages/MeusEmprestimos'))

// Renderiza o fundo apenas nas rotas públicas
function FundoPublico() {
  const { pathname } = useLocation()
  const rotaPublica = pathname === '/login' || pathname === '/cadastro'
  return rotaPublica ? <GrainyBackground /> : null
}

export default function App() {
  return (
    <SomProvider>
    <AuthProvider>
      <DialogoProvider>
        <SincronizacaoProvider>
        <BrowserRouter>
          {/* Fundo fixo — renderizado fora de qualquer container de conteúdo */}
          <FundoPublico />

          {/* Cursor de ponto. Fica aqui, acima das rotas, para valer também nas
              telas de login e cadastro — que é onde não há navbar segurando o
              resto da tela. */}
          <CursorDot />

          <Suspense fallback={<div style={{display:'flex', justifyContent:'center', alignItems:'center', minHeight:'60vh'}}><div className="spinner" /></div>}>
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
          </Suspense>
        </BrowserRouter>
        </SincronizacaoProvider>
      </DialogoProvider>
    </AuthProvider>
    </SomProvider>
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
