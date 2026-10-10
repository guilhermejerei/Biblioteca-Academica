import { useEffect, useState } from 'react'
import CardResumo from '../components/CardResumo'
import { listarLivros } from '../api/livros'
import { listarUsuarios } from '../api/usuarios'
import { buscarEmprestimosAtivos, buscarEmprestimosAtrasados } from '../api/emprestimos'
import { useAuth } from '../context/AuthContext'
// O .pagina e o .spinner vêm de Pagina.css, que é global (main.jsx).
import './Dashboard.css'

// SVGs dos ícones — sem nenhum emoji
const IconeLivro = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
  </svg>
)

const IconeUsuario = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
  </svg>
)

const IconeEmprestimo = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 3.75V16.5L12 14.25 7.5 16.5V3.75m9 0H18A2.25 2.25 0 0120.25 6v12A2.25 2.25 0 0118 20.25H6A2.25 2.25 0 013.75 18V6A2.25 2.25 0 016 3.75h1.5m9 0h-9" />
  </svg>
)

const IconeAtrasado = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
  </svg>
)

export default function Dashboard() {
  const { usuario } = useAuth()
  const [totalLivros,    setTotalLivros]    = useState(0)
  const [totalUsuarios,  setTotalUsuarios]  = useState(0)
  const [totalAtivos,    setTotalAtivos]    = useState(0)
  const [totalAtrasados, setTotalAtrasados] = useState(0)
  const [carregando,     setCarregando]     = useState(true)
  const [erro,           setErro]           = useState('')

  useEffect(() => {
    async function carregarDados() {
      try {
        const [livros, usuarios, ativos, atrasados] = await Promise.all([
          listarLivros(),
          listarUsuarios(),
          buscarEmprestimosAtivos(),
          buscarEmprestimosAtrasados()
        ])
        setTotalLivros(livros.length)
        setTotalUsuarios(usuarios.length)
        setTotalAtivos(ativos.length)
        setTotalAtrasados(atrasados.length)
      } catch (err) {
        console.error('Erro ao carregar dashboard:', err)
        setErro('Não foi possível carregar os dados. Verifique se o servidor está em execução.')
      } finally {
        setCarregando(false)
      }
    }
    carregarDados()
  }, [])

  if (carregando) {
    return (
      <div className="pagina">
        <div className="dashboard-carregando">
          <div className="spinner" />
        </div>
      </div>
    )
  }

  return (
    <div className="pagina">
      <div className="pagina-header">
        <div>
          <h1 className="pagina-titulo">Dashboard</h1>
          <p className="pagina-subtitulo">Visão geral do sistema</p>
        </div>
      </div>

      <p className="dashboard-saudacao">
        {(() => {
          const h = new Date().getHours()
          const periodo = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'
          return `${periodo}, ${usuario?.nome?.split(' ')[0] ?? ''}.`
        })()}
      </p>

      {erro && (
        <div className="dashboard-erro">
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
          {erro}
        </div>
      )}

      <div className="dashboard-cards">
        <CardResumo titulo="Livros cadastrados"   valor={totalLivros}    icone={IconeLivro} />
        <CardResumo titulo="Usuários cadastrados"  valor={totalUsuarios}  icone={IconeUsuario}   cor="card-verde" />
        <CardResumo titulo="Empréstimos ativos"    valor={totalAtivos}    icone={IconeEmprestimo} cor="card-amarelo" />
        <CardResumo titulo="Empréstimos atrasados" valor={totalAtrasados} icone={IconeAtrasado}   cor="card-vermelho" />
      </div>
    </div>
  )
}
