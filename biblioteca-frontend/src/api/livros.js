import api from './config'

/**
 * A estante filtrada, no servidor.
 *
 * Devolve o objeto inteiro — a página de livros e o bloco de facetas —, e não
 * só os itens. A função listarLivros() acima é a ponte para o filtro antigo,
 * que ainda trabalha sobre o array inteiro no navegador; quando ele sair de
 * cena, esta passa a ser a única forma de buscar livros.
 *
 * @param {object} filtro
 * @param {number[]} filtro.categorias  ids de subcategoria
 * @param {number[]} filtro.areas       ids de área (uma pilha inteira)
 * @param {string}   filtro.modo        'qualquer' | 'todas'
 * @param {string}   filtro.texto
 * @param {number}   filtro.autor
 * @param {string}   filtro.epoca       faixa "inicio-fim"
 * @param {string}   filtro.disponiveis 'disponiveis' | 'indisponiveis' | ''
 * @param {number}   filtro.pagina      começa em 1
 * @param {number}   filtro.tamanho
 */
export async function buscarLivros({
  categorias = [],
  areas = [],
  modo = 'qualquer',
  texto = '',
  autor = null,
  epoca = '',
  disponiveis = '',
  pagina = 1,
  tamanho = 24,
} = {}) {
  const params = { pagina, tamanho }

  if (modo) params.modo = modo
  if (texto.trim()) params.texto = texto.trim()
  if (autor) params.autor = autor
  if (epoca) params.epoca = epoca
  if (disponiveis) params.disponiveis = disponiveis

  // A API aceita repetição e lista. Vai como lista: "cat=12,15" é o que
  // aparece na URL quando o filtro é compartilhado.
  if (categorias.length) params.cat = categorias.join(',')
  if (areas.length) params.area = areas.join(',')

  const res = await api.get('/livros', { params })
  return res.data
}

export async function listarLivros() {
  const res = await api.get('/livros')
  return res.data.itens ?? []
}

export async function buscarLivroPorId(id) {
  const res = await api.get(`/livros/${id}`)
  return res.data
}

export async function buscarLivroPorIsbn(isbn) {
  const res = await api.get(`/livros/isbn/${isbn}`)
  return res.data
}

export async function cadastrarLivro(livro) {
  const res = await api.post('/livros', livro)
  return res.data
}

export async function atualizarLivro(id, livro) {
  const res = await api.put(`/livros/${id}`, livro)
  return res.data
}

export async function excluirLivro(id) {
  await api.delete(`/livros/${id}`)
}

export async function buscarCapaNovamente(id) {
  const res = await api.post(`/livros/${id}/capa/buscar`)
  return res.data
}

export async function uploadCapaManual(id, arquivo) {
  const formData = new FormData()
  formData.append('arquivo', arquivo)
  const res = await api.post(`/livros/${id}/capa`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return res.data
}

export async function listarCapasParaRevisao() {
  const res = await api.get('/livros/capas/revisao')
  return res.data
}

export async function aprovarCapa(id) {
  const res = await api.put(`/livros/${id}/capa/aprovar`)
  return res.data
}

export async function rejeitarCapa(id) {
  const res = await api.put(`/livros/${id}/capa/rejeitar`)
  return res.data
}

export async function sincronizarCapas() {
  const res = await api.post('/livros/capas/sincronizar')
  return res.data
}