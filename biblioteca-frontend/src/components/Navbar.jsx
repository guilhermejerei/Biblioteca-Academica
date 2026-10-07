import { useState, useRef, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import IconeBiblioteca from '../assets/icones/IconeBiblioteca'
import './Navbar.css'

// ── Ícones SVG inline para a bottom bar ─────────────────────
const IconeDashboard = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
  </svg>
)

const IconeLivros = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
  </svg>
)

const IconeEmprestimos = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M16.5 3.75V16.5L12 14.25 7.5 16.5V3.75m9 0H18A2.25 2.25 0 0120.25 6v12A2.25 2.25 0 0118 20.25H6A2.25 2.25 0 013.75 18V6A2.25 2.25 0 016 3.75h1.5m9 0h-9" />
  </svg>
)

const IconeUsuarios = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
  </svg>
)

const IconeMaisOpcoes = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
  </svg>
)

const IconePerfil = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
)

const IconeSair = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
  </svg>
)

export default function Navbar() {
  const { usuario, logout, isBibliotecario } = useAuth()
  const navigate   = useNavigate()
  const location   = useLocation()
  const [menuUsuario,  setMenuUsuario]  = useState(false)
  const [maisAberto,   setMaisAberto]   = useState(false)
  const menuUsuarioRef = useRef(null)
  const maisRef        = useRef(null)

  const ehBibliotecario = isBibliotecario()

  // Fecha dropdowns ao clicar fora / Escape
  useEffect(() => {
    function handler(e) {
      if (menuUsuarioRef.current && !menuUsuarioRef.current.contains(e.target))
        setMenuUsuario(false)
      if (maisRef.current && !maisRef.current.contains(e.target))
        setMaisAberto(false)
    }
    function onKey(e) {
      if (e.key === 'Escape') { setMenuUsuario(false); setMaisAberto(false) }
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  // Fecha o painel "mais" quando muda de rota
  useEffect(() => { setMaisAberto(false) }, [location.pathname])

  async function handleLogout() {
    setMenuUsuario(false); setMaisAberto(false)
    await logout()
    navigate('/login')
  }

  function irParaPerfil() {
    setMenuUsuario(false); setMaisAberto(false)
    navigate('/meu-perfil')
  }

  // ── Itens da bottom bar por perfil ───────────────────────
  // Bibliotecário: Dashboard | Livros | Empréstimos | Usuários | ···
  // Aluno:         Livros | Meus Emp. | Perfil
  const itensBiblio = [
    { to: '/',            label: 'Início',      icone: IconeDashboard,  end: true },
    { to: '/livros',      label: 'Livros',      icone: IconeLivros },
    { to: '/emprestimos', label: 'Empréstimos', icone: IconeEmprestimos },
    { to: '/usuarios',    label: 'Usuários',    icone: IconeUsuarios },
  ]

  const itensAluno = [
    { to: '/livros',           label: 'Livros',      icone: IconeLivros },
    { to: '/meus-emprestimos', label: 'Empréstimos', icone: IconeEmprestimos },
    { to: '/meu-perfil',       label: 'Perfil',      icone: IconePerfil },
  ]

  const itensNav = ehBibliotecario ? itensBiblio : itensAluno

  return (
    <>
      {/* ════════════════════════════════════════════════
          NAVBAR DESKTOP — topo, esconde em mobile
          ════════════════════════════════════════════════ */}
      <nav className="navbar navbar-desktop">
        {/* Marca */}
        <div className="navbar-logo">
          <div className="navbar-logo-sigla" aria-hidden="true">
            <IconeBiblioteca size={28} />
          </div>
          <span className="navbar-logo-nome">Biblioteca</span>
        </div>

        {/* Links */}
        <ul className="navbar-links">
          {ehBibliotecario ? (
            <>
              <li><NavLink to="/" end><span className="nav-icone">{IconeDashboard}</span>Dashboard</NavLink></li>
              <li><NavLink to="/livros"><span className="nav-icone">{IconeLivros}</span>Livros</NavLink></li>
              <li><NavLink to="/autores">
                <span className="nav-icone">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/>
                  </svg>
                </span>Autores</NavLink></li>
              <li><NavLink to="/categorias">
                <span className="nav-icone">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z"/>
                  </svg>
                </span>Categorias</NavLink></li>
              <li><NavLink to="/usuarios"><span className="nav-icone">{IconeUsuarios}</span>Usuários</NavLink></li>
              <li><NavLink to="/emprestimos"><span className="nav-icone">{IconeEmprestimos}</span>Empréstimos</NavLink></li>
            </>
          ) : (
            <>
              <li><NavLink to="/livros"><span className="nav-icone">{IconeLivros}</span>Livros</NavLink></li>
              <li><NavLink to="/meus-emprestimos"><span className="nav-icone">{IconeEmprestimos}</span>Meus Empréstimos</NavLink></li>
            </>
          )}
        </ul>

        {/* Usuário + dropdown */}
        <div className="navbar-usuario" ref={menuUsuarioRef}>
          <button
            className="navbar-usuario-btn"
            onClick={() => setMenuUsuario(v => !v)}
            aria-haspopup="true"
            aria-expanded={menuUsuario}
            aria-label="Menu do usuário"
          >
            <span className="navbar-usuario-nome">{usuario?.nome?.split(' ')[0]}</span>
            <span className={`navbar-usuario-role ${ehBibliotecario ? 'role-biblio' : 'role-aluno'}`}>
              {ehBibliotecario ? 'Bibliotecário' : 'Aluno'}
            </span>
            <svg
              className={`navbar-usuario-chevron ${menuUsuario ? 'aberto' : ''}`}
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>

          {menuUsuario && (
            <div className="navbar-dropdown" role="menu">
              <button className="navbar-dropdown-item" role="menuitem" onClick={irParaPerfil}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
                Ver perfil
              </button>
              <div className="navbar-dropdown-divider" role="separator" />
              <button className="navbar-dropdown-item navbar-dropdown-sair" role="menuitem" onClick={handleLogout}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                </svg>
                Sair
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* ════════════════════════════════════════════════
          BOTTOM BAR MOBILE — fixa na base, estilo app
          ════════════════════════════════════════════════ */}
      <nav className="bottom-bar" aria-label="Navegação principal">

        {itensNav.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `bottom-bar-item ${isActive ? 'bottom-bar-item--ativo' : ''}`
            }
            aria-label={item.label}
          >
            <span className="bottom-bar-icone">{item.icone}</span>
            <span className="bottom-bar-label">{item.label}</span>
          </NavLink>
        ))}

        {/* Bibliotecário: botão "Mais" abre painel com Autores e Categorias */}
        {ehBibliotecario && (
          <div className="bottom-bar-mais-wrapper" ref={maisRef}>
            <button
              className={`bottom-bar-item ${maisAberto ? 'bottom-bar-item--ativo' : ''}`}
              onClick={() => setMaisAberto(v => !v)}
              aria-label="Mais opções"
              aria-expanded={maisAberto}
            >
              <span className="bottom-bar-icone">{IconeMaisOpcoes}</span>
              <span className="bottom-bar-label">Mais</span>
            </button>

            {maisAberto && (
              <div className="bottom-bar-mais-menu" role="menu">
                <NavLink to="/autores"    className="bottom-bar-mais-item" role="menuitem" onClick={() => setMaisAberto(false)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                  Autores
                </NavLink>
                <NavLink to="/categorias" className="bottom-bar-mais-item" role="menuitem" onClick={() => setMaisAberto(false)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                  </svg>
                  Categorias
                </NavLink>
                <div className="bottom-bar-mais-divider" />
                <button className="bottom-bar-mais-item" role="menuitem" onClick={irParaPerfil}>
                  {IconePerfil}
                  Ver perfil
                </button>
                <button className="bottom-bar-mais-item bottom-bar-mais-sair" role="menuitem" onClick={handleLogout}>
                  {IconeSair}
                  Sair
                </button>
              </div>
            )}
          </div>
        )}

        {/* Aluno: avatar / sair integrado ao item perfil — dropdown simples */}
        {!ehBibliotecario && (
          <div className="bottom-bar-mais-wrapper" ref={maisRef}>
            {/* O item "Perfil" já existe nos itensAluno acima.
                Adiciona botão de sair separado para não sobrecarregar o perfil */}
            <button
              className="bottom-bar-item bottom-bar-sair-btn"
              onClick={handleLogout}
              aria-label="Sair da conta"
            >
              <span className="bottom-bar-icone">{IconeSair}</span>
              <span className="bottom-bar-label">Sair</span>
            </button>
          </div>
        )}

      </nav>
    </>
  )
}
