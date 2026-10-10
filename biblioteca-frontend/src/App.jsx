import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { AuthProvider } from './context/AuthContext'
import { DialogoProvider } from './context/DialogoContext'
import { SincronizacaoProvider } from './context/SincronizacaoContext'
import { SomProvider } from './context/SomContext'
import { PreferenciasProvider } from './context/PreferenciasContext'
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
const Configuracoes    = lazy(() => import('./pages/Configuracoes'))

// Renderiza o fundo apenas nas rotas públicas
function FundoPublico() {
  const { pathname } = useLocation()
  const rotaPublica = pathname === '/login' || pathname === '/cadastro'
  return rotaPublica ? <GrainyBackground /> : null
}

export default function App() {
  return (
    <SomProvider>
    {/* Preferências de aparência: fica acima de tudo porque o CursorDot e as
        folhas de estilo global leem dela já na primeira renderização. */}
    <PreferenciasProvider>
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

          {/* Só cobre o que ainda pode suspender por fora do layout com navbar.
              Login e Cadastro não são lazy, então isto é apenas uma rede de
              segurança — a fronteira que importa está no LayoutComNavbar. */}
          <Suspense fallback={<PaginaCarregando />}>
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
                  <Route path="/configuracoes"    element={<Configuracoes />} />

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
    </PreferenciasProvider>
    </SomProvider>
  )
}

function LayoutComNavbar() {
  return (
    <>
      <Navbar />
      <main>
        {/* A fronteira do Suspense fica AQUI, e não em volta das <Routes>.
            Com ela lá fora, uma página lazy que ainda estava baixando fazia o
            React trocar a árvore inteira pelo fallback — e como o Navbar mora
            dentro das rotas, a barra sumia junto e a tela piscava na cor de
            fundo a cada troca de aba. Assim só o conteúdo troca; a navbar
            fica parada. */}
        <Suspense fallback={<PaginaCarregando />}>
          <Outlet />
        </Suspense>
      </main>
    </>
  )
}

function PaginaCarregando() {
  return (
    <div className="pagina">
      <div className="dashboard-carregando">
        <div className="spinner" />
      </div>
    </div>
  )
}

import { Outlet } from 'react-router-dom'
