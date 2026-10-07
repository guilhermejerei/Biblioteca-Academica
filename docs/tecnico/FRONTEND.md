# Documentação Técnica — Frontend

## Estrutura de Arquivos

```
biblioteca-frontend/
│
├── public/                         ← Arquivos estáticos servidos na raiz
│   ├── favicon.ico                 ← Ícone clássico (32×32)
│   ├── favicon.svg                 ← Ícone vetorial (qualquer tamanho)
│   ├── apple-touch-icon.png        ← Ícone para iOS (180×180)
│   ├── icone-192.png               ← PWA — ícone pequeno
│   ├── icone-512.png               ← PWA — ícone grande
│   ├── icone.svg                   ← PWA — ícone maskable
│   └── manifest.json               ← Manifesto PWA
│
├── src/
│   ├── api/                        ← Funções de chamada HTTP (uma por recurso)
│   │   ├── config.js               ← Instância Axios com interceptors de auth e 401
│   │   ├── autores.js
│   │   ├── categorias.js
│   │   ├── emprestimos.js
│   │   ├── livros.js               ← Inclui todas as operações de capa
│   │   └── usuarios.js
│   │
│   ├── context/                    ← Estado global via React Context
│   │   ├── AuthContext.jsx         ← Usuário logado, token, login/logout
│   │   ├── DialogoContext.jsx      ← Substitui alert() e confirm() nativos
│   │   ├── DialogoContext.css
│   │   ├── SincronizacaoContext.jsx ← Estado da sincronização de capas + toast global
│   │   └── SincronizacaoContext.css
│   │
│   ├── components/                 ← Componentes reutilizáveis
│   │   ├── CapaLivro.jsx           ← Imagem real ou capa CSS determinística por hash
│   │   ├── CapaLivro.css
│   │   ├── CardResumo.jsx          ← Cards de estatística do dashboard
│   │   ├── CardResumo.css
│   │   ├── Formulario.jsx          ← Formulário genérico (input, select, readonly)
│   │   ├── Formulario.css
│   │   ├── GrainyBackground.jsx    ← Fundo animado das telas de login/cadastro
│   │   ├── GrainyBackground.css
│   │   ├── Modal.jsx               ← Container modal genérico (usado em poucos lugares)
│   │   ├── Modal.css
│   │   ├── Navbar.jsx              ← Barra de nav desktop + bottom bar mobile
│   │   ├── Navbar.css
│   │   ├── RotaProtegida.jsx       ← HOC que redireciona para /login se não autenticado
│   │   ├── Tabela.jsx              ← Tabela genérica com overflow horizontal
│   │   └── Tabela.css
│   │
│   ├── pages/                      ← Páginas (uma por rota)
│   │   ├── Auth.css                ← Estilos de Login e Cadastro
│   │   ├── Autores.jsx             ← Lista com busca + drawer de edição
│   │   ├── Cadastro.jsx            ← Formulário de registro público
│   │   ├── Categorias.jsx          ← Lista com busca + drawer de edição
│   │   ├── Dashboard.jsx           ← Visão geral com cards de resumo
│   │   ├── Dashboard.css
│   │   ├── Emprestimos.jsx         ← Tabela de empréstimos com filtros
│   │   ├── Emprestimos.css
│   │   ├── ListaComBusca.css       ← Estilos compartilhados: Autores, Categorias, Usuários
│   │   ├── Livros.jsx              ← Grid de cards + drawer de gestão (bibliotecário)
│   │   │                              Grade de cards para aluno com filtros
│   │   ├── Livros.css
│   │   ├── Login.jsx               ← Formulário de login
│   │   ├── MeuPerfil.jsx           ← Dados do usuário logado
│   │   ├── MeuPerfil.css
│   │   ├── MeusEmprestimos.jsx     ← Empréstimos do usuário logado
│   │   ├── Pagina.css              ← Estilos base compartilhados entre todas as páginas
│   │   └── Usuarios.jsx            ← Lista com busca + drawer de edição
│   │
│   ├── App.jsx                     ← Roteamento, providers, layout com Navbar
│   ├── index.css                   ← Reset, variáveis CSS globais, focus-visible
│   └── main.jsx                    ← Ponto de entrada React (ReactDOM.createRoot)
│
├── index.html                      ← Template HTML com favicons, manifest e fontes
├── vite.config.js                  ← Configuração do Vite (porta 5173, plugin React)
├── package.json
├── .env                            ← NÃO commitado — variáveis locais
└── .env.example                    ← Modelo público das variáveis necessárias
```

## Sistema de Design (Variáveis CSS)

Todas as cores, fontes e sombras são definidas como variáveis CSS em `src/index.css`:

```css
:root {
  --vinho:         #8C2B2B;   /* botões primários, destaques */
  --laranja:       #c35a2b;   /* hover, foco, laranja quente */
  --marrom:        #6B4A3A;   /* filtros ativos, ícones */
  --marrom-escuro: #2E211B;   /* texto principal */
  --marrom-apoio:  #5A463C;   /* texto secundário */

  --areia:         #D9C3A8;   /* placeholder */
  --off-white:     #F4EFE8;   /* fundo de campos, linhas de tabela */
  --bege:          #E8DDD2;   /* bordas */
  --bege-medio:    #CDB9A8;   /* bordas mais fortes */
  --fundo:         #FAF7F3;   /* fundo geral da aplicação */

  --serif: 'Newsreader', Georgia, serif;    /* títulos */
  --sans:  'DM Sans', system-ui, sans-serif; /* interface */

  --foco-ring:  0 0 0 3px rgba(195,90,43,0.18);  /* ring de foco uniforme */
  --foco-borda: var(--laranja);
}
```

## Padrão de Componentes

### Layout com Drawer (Autores, Categorias, Usuários, Livros)

```
┌─────────────────────────────────────┬─────────────┐
│                                     │             │
│   bib-main                          │  bib-drawer │
│   (conteúdo principal com grid)     │  (painel    │
│                                     │   lateral)  │
└─────────────────────────────────────┴─────────────┘
```

A classe `bib-layout` aplica `display: flex`. Quando `bib-drawer` está presente, ele fica grudado à direita. Em tablets e mobile, vira overlay com backdrop escuro.

### Contexto de Diálogo

Substitui os diálogos nativos (`alert`, `confirm`) por modais estilizados:

```jsx
const { alertar, confirmar } = useDialogo()

// Exibe mensagem de sucesso/erro/aviso
await alertar('Salvo com sucesso!', 'sucesso')

// Exibe confirmação — retorna true/false
const ok = await confirmar('Excluir este autor?', 'Excluir autor')
if (ok) { ... }
```

### Contexto de Sincronização

Gerencia o estado global da sincronização de capas e exibe um toast flutuante:

```jsx
const { sincronizar, status } = useSincronizacao()
// status: 'idle' | 'rodando' | 'concluido' | 'erro'

await sincronizar() // dispara a sincronização e atualiza o toast automaticamente
```

### Componente CapaLivro

Recebe o objeto `livro` completo (ou props avulsas) e decide o que renderizar:

```
urlCapa preenchida e sem erro de carregamento?
  → <img> com a imagem real do backend
Caso contrário:
  → div com gradiente CSS determinístico baseado em hash do título
    (12 paletas predefinidas, selecionada por: Math.abs(hash) % 12)

Sempre sobre a imagem:
  → pseudo-elemento de dobra da lombada (esquerda)
  → pseudo-elemento de corte de páginas (direita)
```

## Roteamento

```
/ (raiz)           → Dashboard      (só BIBLIOTECARIO)
/livros            → Livros         (qualquer autenticado)
/autores           → Autores        (só BIBLIOTECARIO)
/categorias        → Categorias     (só BIBLIOTECARIO)
/usuarios          → Usuarios       (só BIBLIOTECARIO)
/emprestimos       → Emprestimos    (só BIBLIOTECARIO)
/meus-emprestimos  → MeusEmprestimos (qualquer autenticado)
/meu-perfil        → MeuPerfil      (qualquer autenticado)
/login             → Login          (público)
/cadastro          → Cadastro       (público)
```

`RotaProtegida` redireciona para `/login` se não há token.
`RotaBibliotecario` redireciona para `/livros` se o usuário é ALUNO.

## Variáveis de Ambiente

| Variável | Descrição | Padrão |
|---|---|---|
| `VITE_API_URL` | URL base da API do backend | `http://localhost:8080/api` |
