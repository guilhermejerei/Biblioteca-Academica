package com.biblioteca.service;

import com.biblioteca.exception.NegocioException;
import com.biblioteca.exception.RecursoNaoEncontradoException;
import com.biblioteca.model.Autor;
import com.biblioteca.model.Categoria;
import com.biblioteca.model.Livro;
import com.biblioteca.model.LivroCategoria;
import com.biblioteca.repository.AutorRepository;
import com.biblioteca.repository.CategoriaRepository;
import com.biblioteca.repository.EmprestimoRepository;
import com.biblioteca.repository.LivroRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@Service
public class LivroService {

    /**
     * Um livro tem de 1 a 4 categorias. Acima de 4 o filtro em pilhas fica
     * ilegível e o formulário perde o sentido; abaixo de 1 o livro não
     * apareceria em pilha nenhuma.
     */
    public static final int MAX_CATEGORIAS = 4;

    @Autowired private LivroRepository      livroRepository;
    @Autowired private AutorRepository      autorRepository;
    @Autowired private CategoriaRepository  categoriaRepository;
    @Autowired private EmprestimoRepository emprestimoRepository;
    @Autowired private com.biblioteca.repository.LivroCategoriaRepository livroCategoriaRepository;
    @Autowired private com.biblioteca.service.capa.CapaLivroService capaLivroService;

    /**
     * Usado só para forçar um flush no meio da edição de categorias, entre
     * rebaixar a principal antiga e promover a nova.
     */
    @PersistenceContext
    private EntityManager entityManager;

    public List<Livro> listarTodos() {
        return livroRepository.findAll();
    }

    public Optional<Livro> buscarPorId(Long id) {
        return livroRepository.findById(id);
    }

    public Optional<Livro> buscarPorIsbn(String isbn) {
        return livroRepository.findByIsbn(isbn);
    }

    /**
     * Monta as ligações livro -> categoria a partir dos ids recebidos, aplicando
     * as regras: no máximo 4, apenas subcategorias, e exatamente uma principal.
     *
     * @param categoriaIds     ids das categorias marcadas
     * @param principalId      id de qual delas é a principal
     */
    private List<LivroCategoria> resolverCategorias(Set<Long> categoriaIds, Long principalId) {
        if (categoriaIds == null || categoriaIds.isEmpty()) {
            throw new NegocioException("O livro precisa ter ao menos uma categoria.");
        }
        if (categoriaIds.size() > MAX_CATEGORIAS) {
            throw new NegocioException(
                    "O livro pode ter no máximo " + MAX_CATEGORIAS + " categorias. "
                    + "Você marcou " + categoriaIds.size() + ".");
        }
        if (principalId == null) {
            throw new NegocioException(
                    "Escolha qual das " + categoriaIds.size() + " categorias é a principal. "
                    + "A principal define a cor da lombada e a etiqueta da capa.");
        }
        if (!categoriaIds.contains(principalId)) {
            throw new NegocioException(
                    "A categoria principal precisa estar entre as categorias marcadas.");
        }

        List<LivroCategoria> ligacoes = new ArrayList<>();
        for (Long id : categoriaIds) {
            Categoria c = categoriaRepository.findById(id)
                    .orElseThrow(() -> new RecursoNaoEncontradoException(
                            "Categoria não encontrada com id: " + id));

            // Área não pode ser marcada como categoria do livro: ela é só o
            // agrupamento das pilhas. Marcar uma aqui faria o livro aparecer
            // em duas pilhas ao mesmo tempo.
            if (c.getCategoriaPai() == null) {
                throw new NegocioException(
                        "\"" + c.getNome() + "\" é uma área, não uma categoria. "
                        + "Marque uma das subcategorias dela.");
            }

            ligacoes.add(new LivroCategoria(c, id.equals(principalId)));
        }
        return ligacoes;
    }

    /** Lê os ids de categoria e o da principal do objeto que veio do cliente. */
    private Set<Long> idsCategorias(Livro livro) {
        Set<Long> ids = new LinkedHashSet<>();
        if (livro != null && livro.getLivroCategorias() != null) {
            for (LivroCategoria lc : livro.getLivroCategorias()) {
                if (lc != null && lc.getCategoria() != null && lc.getCategoria().getId() != null) {
                    ids.add(lc.getCategoria().getId());
                }
            }
        }
        return ids;
    }

    private Long idPrincipalRecebido(Livro livro) {
        if (livro == null || livro.getLivroCategorias() == null) return null;
        for (LivroCategoria lc : livro.getLivroCategorias()) {
            if (lc != null && lc.isPrincipal() && lc.getCategoria() != null) {
                return lc.getCategoria().getId();
            }
        }
        return null;
    }

    /**
     * Cadastra um novo livro.
     * Aceita as categorias em livro.livroCategorias, cada uma com {id} e a
     * que for principal com principal = true.
     */
    @Transactional
    public Livro salvar(Livro livro) {
        Autor autor = autorRepository.findById(livro.getAutor().getId())
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "Autor não encontrado com id: " + livro.getAutor().getId()));

        livro.setAutor(autor);
        livro.setLivroCategorias(resolverCategorias(
                idsCategorias(livro), idPrincipalRecebido(livro)));

        if (livro.getQuantidadeTotal() == null) {
            livro.setQuantidadeTotal(livro.getQuantidadeDisponivel());
        }

        // Um livro recém-criado não tem empréstimo, então tudo está
        // disponível. O formulário manda só o total, e quantidade_disponivel
        // é NOT NULL no banco: sem esta linha o INSERT estourava com
        // "not-null property references a null or transient value".
        if (livro.getQuantidadeDisponivel() == null) {
            livro.setQuantidadeDisponivel(livro.getQuantidadeTotal());
        }

        // liga o lado da variável ao lado do livro, senão o orphanRemoval
        // não sabe a quem pertence a linha
        for (LivroCategoria lc : livro.getLivroCategorias()) {
            lc.setLivroInterno(livro);
        }

        Livro salvo = livroRepository.save(livro);
        capaLivroService.buscarCapaAssincrono(salvo.getId());
        return salvo;
    }

    /**
     * Atualiza um livro existente.
     */
    @Transactional
    public Livro atualizar(Long id, Livro livroAtualizado) {
        Livro livro = livroRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "Livro não encontrado com id: " + id));

        if (!livro.getIsbn().equals(livroAtualizado.getIsbn())) {
            throw new NegocioException(
                    "O ISBN não pode ser alterado. Ele identifica o exemplar físico. " +
                    "Se o ISBN mudou, cadastre um novo título.");
        }

        long emprestados = emprestimoRepository.countEmprestimosAtivos(id);
        Set<Long> novasCategoriaIds = idsCategorias(livroAtualizado);
        Long novaPrincipalId = idPrincipalRecebido(livroAtualizado);

        boolean mudouIdentidade =
                !livro.getTitulo().equals(livroAtualizado.getTitulo()) ||
                !livro.getAutor().getId().equals(livroAtualizado.getAutor().getId()) ||
                !mesmasCategorias(livro, novasCategoriaIds) ||
                !mesmaPrincipal(livro, novaPrincipalId);

        if (mudouIdentidade && emprestados > 0) {
            throw new NegocioException(
                    "Não é possível alterar título, autor ou categorias enquanto há " +
                    emprestados + " exemplar(es) emprestado(s).");
        }

        Autor autor = autorRepository.findById(livroAtualizado.getAutor().getId())
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "Autor não encontrado com id: " + livroAtualizado.getAutor().getId()));

        List<LivroCategoria> ligacoes = resolverCategorias(novasCategoriaIds, novaPrincipalId);

        livro.setTitulo(livroAtualizado.getTitulo());
        livro.setAnoPublicacao(livroAtualizado.getAnoPublicacao());
        livro.setAutor(autor);

        reaproveitaCategorias(livro, ligacoes);

        int novoTotal = (livroAtualizado.getQuantidadeTotal() != null)
                ? livroAtualizado.getQuantidadeTotal()
                : livro.getQuantidadeTotal();

        if (novoTotal < emprestados) {
            throw new NegocioException(
                    "Não é possível reduzir o total para " + novoTotal + " exemplar(es): "
                    + emprestados + " exemplar(es) ainda estão emprestados.");
        }

        livro.setQuantidadeTotal(novoTotal);
        livro.setQuantidadeDisponivel((int)(novoTotal - emprestados));

        // Sem save() de propósito. O livro foi carregado por findById, então já
        // está gerenciado e as alterações vão sozinhas no commit. Chamar save()
        // aqui dispararia um merge, que cascateia para as ligações e tenta
        // carregá-las por id. No cadastro, onde o livro ainda é novo, o save()
        // é necessário e funciona.
        return livro;
    }

    /**
     * Troca as categorias do livro pelas desejadas, reaproveitando as linhas
     * que já existem.
     *
     * Duas fases, e a ordem é o que importa. O índice UNIQUE
     * (livro_id, principal_norm) proíbe duas principais no mesmo livro, e o
     * Hibernate emite as operações na ordem que lhe conviene: promover a nova
     * principal antes de rebaixar a antiga estourava com
     * "duplicate entry". Então primeiro todas são rebaixadas e o flush as
     * grava; só depois a nova principal é marcada.
     */
    private void reaproveitaCategorias(Livro livro, List<LivroCategoria> desejadas) {
        Map<Long, LivroCategoria> existentes = new LinkedHashMap<>();
        for (LivroCategoria atual : livroCategoriaRepository.listarDoLivro(livro.getId())) {
            existentes.put(atual.getCategoria().getId(), atual);
        }

        // Fase 1 — rebaixa todas e grava. Se alguma já estava como secundária,
        // o dirty checking nem gera UPDATE, e o método continua barato.
        for (LivroCategoria atual : existentes.values()) {
            if (atual.isPrincipal()) {
                atual.setPrincipal(false);
            }
        }
        entityManager.flush();

        // Fase 2 — monta o conjunto final reaproveitando as linhas existentes
        // (criar cópia de uma linha já na sessão dá DuplicateKeyException, já
        // que as duas têm a mesma chave composta) e promove a principal.
        List<LivroCategoria> resultado = new ArrayList<>();
        for (LivroCategoria desejada : desejadas) {
            Long idCategoria = desejada.getCategoria().getId();
            LivroCategoria atual = existentes.get(idCategoria);
            if (atual != null) {
                atual.setPrincipal(desejada.isPrincipal());
                resultado.add(atual);
            } else {
                desejada.setLivroInterno(livro);
                resultado.add(desejada);
            }
        }

        livro.getLivroCategorias().clear();
        livro.getLivroCategorias().addAll(resultado);
    }

    private boolean mesmasCategorias(Livro livro, Set<Long> novas) {
        Set<Long> atuais = new LinkedHashSet<>();
        for (LivroCategoria lc : livro.getLivroCategorias()) {
            if (lc.getCategoria() != null && lc.getCategoria().getId() != null) {
                atuais.add(lc.getCategoria().getId());
            }
        }
        return atuais.equals(novas);
    }

    private boolean mesmaPrincipal(Livro livro, Long novaPrincipalId) {
        Long atual = livro.getCategoriaPrincipal() == null
                ? null : livro.getCategoriaPrincipal().getId();
        return java.util.Objects.equals(atual, novaPrincipalId);
    }

    @Transactional
    public void excluir(Long id) {
        if (!livroRepository.existsById(id)) {
            throw new RecursoNaoEncontradoException("Livro não encontrado com id: " + id);
        }
        livroRepository.deleteById(id);
    }
}