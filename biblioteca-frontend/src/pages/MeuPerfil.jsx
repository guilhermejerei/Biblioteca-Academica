import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { buscarEmprestimosPorUsuario } from '../api/emprestimos'
import CapaLivro from '../components/CapaLivro'
import './Pagina.css'
import './MeuPerfil.css'

export default function MeuPerfil() {
  const { usuario } = useAuth()
  const [emprestimos, setEmprestimos] = useState([])
  const [carregando,  setCarregando]  = useState(true)

  useEffect(() => {
    if (!usuario?.id) return
    buscarEmprestimosPorUsuario(usuario.id)
      .then(setEmprestimos)
      .catch(() => {})
      .finally(() => setCarregando(false))
  }, [usuario])

  const ativos    = emprestimos.filter(e => e.status === 'ATIVO')
  const atrasados = emprestimos.filter(e => e.status === 'ATRASADO')
  const devolvidos = emprestimos.filter(e => e.status === 'DEVOLVIDO')

  const iniciais = usuario?.nome
    ? usuario.nome.trim().split(/\s+/).slice(0, 2).map(p => p[0].toUpperCase()).join('')
    : '?'

  return (
    <div className="pagina perfil-pagina">

      {/* ── Cabeçalho do perfil ─────────────────────────── */}
      <div className="perfil-hero">
        <div className="perfil-avatar-grande">{iniciais}</div>

        <div className="perfil-hero-info">
          <h1 className="perfil-hero-nome">{usuario?.nome}</h1>
          <span className={`perfil-badge ${usuario?.tipo === 'BIBLIOTECARIO' ? 'badge-biblio' : 'badge-aluno'}`}>
            {usuario?.tipo === 'BIBLIOTECARIO' ? 'Bibliotecário' : 'Aluno'}
          </span>

          <div className="perfil-hero-dados">
            <div className="perfil-hero-dado">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              {usuario?.email}
            </div>
            {usuario?.telefone && (
              <div className="perfil-hero-dado">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
                {usuario.telefone}
              </div>
            )}
          </div>
        </div>

        {/* Estatísticas rápidas */}
        <div className="perfil-stats">
          <div className="perfil-stat">
            <span className="perfil-stat-valor">{emprestimos.length}</span>
            <span className="perfil-stat-label">Total</span>
          </div>
          <div className="perfil-stat">
            <span className="perfil-stat-valor">{ativos.length + atrasados.length}</span>
            <span className="perfil-stat-label">Em aberto</span>
          </div>
          <div className="perfil-stat perfil-stat--alerta" style={{ display: atrasados.length > 0 ? '' : 'none' }}>
            <span className="perfil-stat-valor">{atrasados.length}</span>
            <span className="perfil-stat-label">Atrasados</span>
          </div>
          <div className="perfil-stat">
            <span className="perfil-stat-valor">{devolvidos.length}</span>
            <span className="perfil-stat-label">Devolvidos</span>
          </div>
        </div>
      </div>

      {/* ── Empréstimos ativos ──────────────────────────── */}
      {!carregando && (ativos.length > 0 || atrasados.length > 0) && (
        <section className="perfil-secao">
          <h2 className="perfil-secao-titulo">Em meu poder</h2>
          <div className="perfil-livros-grid">
            {[...atrasados, ...ativos].map(e => (
              <div
                key={e.id}
                className={`perfil-livro-card ${e.status === 'ATRASADO' ? 'perfil-livro-card--atrasado' : ''}`}
              >
                <div className="perfil-livro-capa">
                  <CapaLivro isbn={e.livro?.isbn} titulo={e.livro?.titulo ?? ''} tamanho="M" />
                </div>
                <div className="perfil-livro-info">
                  <p className="perfil-livro-titulo">{e.livro?.titulo}</p>
                  <p className="perfil-livro-prazo">
                    {e.status === 'ATRASADO'
                      ? <span className="perfil-prazo-atrasado">⚠ Atrasado</span>
                      : <>Devolução: <strong>{e.dataPrevistaDevolucao}</strong></>
                    }
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Histórico de leituras ───────────────────────── */}
      {!carregando && devolvidos.length > 0 && (
        <section className="perfil-secao">
          <h2 className="perfil-secao-titulo">
            Histórico
            <span className="perfil-secao-count">{devolvidos.length} livro{devolvidos.length !== 1 ? 's' : ''}</span>
          </h2>
          <div className="perfil-historico-lista">
            {devolvidos.map(e => (
              <div key={e.id} className="perfil-historico-item">
                <div className="perfil-historico-capa">
                  <CapaLivro isbn={e.livro?.isbn} titulo={e.livro?.titulo ?? ''} tamanho="S" />
                </div>
                <div className="perfil-historico-info">
                  <p className="perfil-historico-titulo">{e.livro?.titulo}</p>
                  <p className="perfil-historico-data">
                    Devolvido em {e.dataDevolucao ?? '—'}
                  </p>
                </div>
                <span className="badge badge-devolvido perfil-historico-badge">Devolvido</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Estado vazio */}
      {!carregando && emprestimos.length === 0 && (
        <div className="perfil-vazio">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0118 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
          <p>Você ainda não realizou nenhum empréstimo.</p>
        </div>
      )}

    </div>
  )
}
