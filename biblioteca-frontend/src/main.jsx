import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
// Pagina.css é global de propósito: é onde moram .pagina, .spinner e os
// botões compartilhados (.btn-primario, .btn-secundario, .btn-editar,
// .btn-excluir, .erro-msg). Com ele importado página a página, qualquer
// página que esquecesse a linha aparecia sem margem nenhuma — e como o Vite
// só injeta a folha quando ela é carregada, o defeito aparecia no primeiro
// acesso a essa página e sumia depois de navegar por outra.
import './pages/Pagina.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
