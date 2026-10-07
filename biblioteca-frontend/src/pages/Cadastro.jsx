import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { register } from '../api/auth'
import './Auth.css'

const VALORES_INICIAIS = {
  nome: '', cpf: '', email: '', telefone: '',
  senha: '', confirmarSenha: '', tipo: 'ALUNO'
}

export default function Cadastro() {
  const navigate = useNavigate()
  const [valores, setValores]       = useState(VALORES_INICIAIS)
  const [erro, setErro]             = useState('')
  const [sucesso, setSucesso]       = useState('')
  const [carregando, setCarregando] = useState(false)

  function handleChange(e) {
    setValores({ ...valores, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')
    setSucesso('')

    if (valores.senha !== valores.confirmarSenha) {
      setErro('As senhas não coincidem.')
      return
    }

    setCarregando(true)
    try {
      const { confirmarSenha, ...payload } = valores
      await register(payload)
      setSucesso('Conta criada! Redirecionando para o login…')
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      setErro(err.response?.data?.erro || 'Não foi possível criar a conta. Tente novamente.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="auth-split">

      {/* ── Painel esquerdo — formulário ─────────────────── */}
      <div className="auth-panel">

        {/* Marca */}
        <div className="auth-marca">
          <div className="auth-marca-sigla" aria-hidden="true">
            <svg viewBox="0 0 18 18" fill="none">
              <path d="M4 2h6a3.5 3.5 0 0 1 0 7H4V2Z" fill="currentColor" opacity=".9"/>
              <path d="M4 9h6.5a3.5 3.5 0 0 1 0 7H4V9Z" fill="currentColor"/>
            </svg>
          </div>
          <span className="auth-marca-nome">Biblioteca</span>
        </div>

        {/* Formulário */}
        <div className="auth-form-bloco">
          <h1 className="auth-titulo-pg">Criar conta</h1>
          <p className="auth-subtitulo-pg">Preencha os dados para se cadastrar</p>

          <form className="auth-form" onSubmit={handleSubmit}>

            {erro && (
              <div className="auth-erro" role="alert">
                <svg viewBox="0 0 20 20" fill="currentColor" className="auth-erro-icon">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                </svg>
                {erro}
              </div>
            )}

            {sucesso && (
              <div className="auth-sucesso" role="status">
                <svg viewBox="0 0 20 20" fill="currentColor" className="auth-erro-icon">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
                {sucesso}
              </div>
            )}

            <div className="auth-grid-2">
              <div className="auth-campo">
                <label htmlFor="nome">Nome completo</label>
                <input id="nome" type="text" name="nome" value={valores.nome}
                  onChange={handleChange} placeholder="Seu nome" required />
              </div>
              <div className="auth-campo">
                <label htmlFor="cpf">CPF</label>
                <input id="cpf" type="text" name="cpf" value={valores.cpf}
                  onChange={handleChange} placeholder="000.000.000-00" required />
              </div>
            </div>

            <div className="auth-campo">
              <label htmlFor="email">E-mail</label>
              <input id="email" type="email" name="email" value={valores.email}
                onChange={handleChange} placeholder="seu@email.com" required autoComplete="email" />
            </div>

            <div className="auth-campo">
              <label htmlFor="telefone">
                Telefone <span className="auth-opcional">(opcional)</span>
              </label>
              <input id="telefone" type="text" name="telefone" value={valores.telefone}
                onChange={handleChange} placeholder="(00) 00000-0000" />
            </div>

            <div className="auth-grid-2">
              <div className="auth-campo">
                <label htmlFor="senha">Senha</label>
                <input id="senha" type="password" name="senha" value={valores.senha}
                  onChange={handleChange} placeholder="Mín. 6 caracteres"
                  required autoComplete="new-password" />
              </div>
              <div className="auth-campo">
                <label htmlFor="confirmarSenha">Confirmar</label>
                <input id="confirmarSenha" type="password" name="confirmarSenha"
                  value={valores.confirmarSenha} onChange={handleChange}
                  placeholder="Repita" required autoComplete="new-password" />
              </div>
            </div>

            <div className="auth-campo">
              <label>Tipo de conta</label>
              <div className="auth-tipo-grupo">

                <label className={`auth-tipo-opcao ${valores.tipo === 'ALUNO' ? 'selecionado' : ''}`}>
                  <input type="radio" name="tipo" value="ALUNO"
                    checked={valores.tipo === 'ALUNO'} onChange={handleChange} />
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
                  </svg>
                  <div>
                    <strong>Aluno</strong>
                    <span>Visualiza e realiza empréstimos</span>
                  </div>
                </label>

                <label className={`auth-tipo-opcao ${valores.tipo === 'BIBLIOTECARIO' ? 'selecionado' : ''}`}>
                  <input type="radio" name="tipo" value="BIBLIOTECARIO"
                    checked={valores.tipo === 'BIBLIOTECARIO'} onChange={handleChange} />
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                  </svg>
                  <div>
                    <strong>Bibliotecário</strong>
                    <span>Acesso administrativo completo</span>
                  </div>
                </label>

              </div>
            </div>

            <button type="submit" className="auth-btn" disabled={carregando}>
              {carregando ? 'Criando conta…' : 'Criar conta'}
            </button>

          </form>
        </div>

        {/* Rodapé */}
        <p className="auth-rodape">
          Já tem uma conta?{' '}
          <Link to="/login">Entrar</Link>
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
