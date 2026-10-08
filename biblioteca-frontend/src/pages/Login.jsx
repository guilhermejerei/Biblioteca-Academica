import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import IconeBiblioteca from '../assets/icones/IconeBiblioteca'
import './Auth.css'

export default function Login() {
  const { login } = useAuth()
  const navigate   = useNavigate()
  const [valores, setValores]     = useState({ email: '', senha: '' })
  const [erro, setErro]           = useState('')
  const [carregando, setCarregando] = useState(false)

  function handleChange(e) {
    setValores({ ...valores, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')
    setCarregando(true)
    try {
      const usuario = await login(valores.email, valores.senha)
      navigate(usuario.tipo === 'BIBLIOTECARIO' ? '/' : '/livros')
    } catch (err) {
      setErro(err.response?.data?.erro || 'Não foi possível realizar o login. Verifique suas credenciais.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="auth-split">

      {/* ── Painel esquerdo — formulário ─────────────────── */}
      <div className="auth-panel">

        {/* Marca — o mesmo ícone do site, não uma sigla */}
        <div className="auth-marca">
          <span className="auth-marca-sigla">
            {/* semRotulo: o nome da marca vem logo abaixo e o leitor de tela
                não precisa ouvir "Biblioteca" duas vezes. */}
            <IconeBiblioteca size={36} semRotulo />
          </span>
          <span className="auth-marca-nome">Biblioteca</span>
        </div>

        {/* Formulário */}
        <div className="auth-form-bloco">
          <h1 className="auth-titulo-pg">Bem-vindo de volta</h1>
          <p className="auth-subtitulo-pg">Entre com suas credenciais para continuar</p>

          <form className="auth-form" onSubmit={handleSubmit}>

            {erro && (
              <div className="auth-erro" role="alert">
                <svg viewBox="0 0 20 20" fill="currentColor" className="auth-erro-icon">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                </svg>
                {erro}
              </div>
            )}

            <div className="auth-campo">
              <label htmlFor="email">E-mail</label>
              <input id="email" type="email" name="email"
                value={valores.email} onChange={handleChange}
                placeholder="seu@email.com" required autoComplete="email" />
            </div>

            <div className="auth-campo">
              <label htmlFor="senha">Senha</label>
              <input id="senha" type="password" name="senha"
                value={valores.senha} onChange={handleChange}
                placeholder="••••••••" required autoComplete="current-password" />
            </div>

            <button type="submit" className="auth-btn" disabled={carregando}>
              {carregando ? 'Entrando…' : 'Entrar'}
            </button>

          </form>
        </div>

        {/* Rodapé */}
        <p className="auth-rodape">
          Não tem uma conta?{' '}
          <Link to="/cadastro">Criar conta</Link>
        </p>
      </div>

      {/* ── Painel direito — visual ──────────────────────── */}
      <div className="auth-visual" aria-hidden="true">
        <div className="auth-visual-overlay" />
        <div className="auth-visual-content">
          <p className="auth-visual-tagline">
            O conhecimento<br />
            que conecta<br />
            <em>pessoas.</em>
          </p>
          <p className="auth-visual-desc">
            Acervo, empréstimos e devoluções<br />
            em um único lugar.
          </p>
        </div>
      </div>

    </div>
  )
}
