# Documentação

Toda a documentação do projeto. O código fica em `biblioteca-backend/` e
`biblioteca-frontend/` — nada aqui precisa ser compilado.

---

## Onde está o quê

| Pasta | Contém |
|---|---|
| [`arquitetura/`](arquitetura/) | Como o sistema é construído e por quê |
| [`banco/`](banco/) | Esquema, migrações, dados de exemplo e backups do MySQL |

---

## Arquitetura

| Documento | Assunto |
|---|---|
| [ARQUITETURA.md](arquitetura/ARQUITETURA.md) | Visão geral: stack, fluxo de requisição, autenticação, CORS |
| [BACKEND.md](arquitetura/BACKEND.md) | Pacotes, regras de negócio e todos os endpoints da API |
| [FRONTEND.md](arquitetura/FRONTEND.md) | Componentes, sistema de design e roteamento |
| [capas.md](arquitetura/capas.md) | Fluxo completo do sistema de capas: busca, validação, armazenamento e frontend |

---

## Banco de dados

O esquema é declarado em `banco/instalar/01-esquema.sql`. As migrações são scripts
SQL aplicados manualmente — não há Flyway ou Liquibase.

### Instalação do zero

```cmd
mysql -u root -p < docs/banco/instalar/01-esquema.sql
mysql -u root -p < docs/banco/instalar/02-base.sql
mysql -u root -p < docs/banco/instalar/03-acervo.sql
```

### Aplicar uma migração

```cmd
mysql -u root -p --default-character-set=utf8mb4 biblioteca < docs/banco/migracoes/V6__indices_performance.sql
```

### Histórico de migrações

| Arquivo | O que faz |
|---|---|
| [V1__adicionar_quantidade_total.sql](banco/migracoes/V1__adicionar_quantidade_total.sql) | Campo de total de exemplares |
| [V2__adicionar_campos_capa.sql](banco/migracoes/V2__adicionar_campos_capa.sql) | Campos de capa e status |
| [V3__categorias_hierarquicas_e_multicategoria.sql](banco/migracoes/V3__categorias_hierarquicas_e_multicategoria.sql) | Áreas, subcategorias e livro por categoria |
| [V4__classificar_categorias.sql](banco/migracoes/V4__classificar_categorias.sql) | Taxonomia de 10 áreas e 47 subcategorias |
| [V5__completar_categorias.sql](banco/migracoes/V5__completar_categorias.sql) | Categorias adicionais por livro |
| [V6__indices_performance.sql](banco/migracoes/V6__indices_performance.sql) | Índices de performance nas queries mais frequentes |

As migrações não são destrutivas: cada arquivo guarda como desfazer. O caminho seguro
de rollback é restaurar um dump de [`banco/backups/`](banco/backups/) e reaplicar
as migrações em ordem.

### Dados e backups

- [`banco/dados/dados-iniciais.sql`](banco/dados/dados-iniciais.sql) — acervo de exemplo para subir do zero
- [`banco/backups/`](banco/backups/) — dumps com data no nome
