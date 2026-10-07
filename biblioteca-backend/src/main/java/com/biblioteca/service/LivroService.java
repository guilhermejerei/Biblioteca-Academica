package com.biblioteca.service;

import com.biblioteca.exception.NegocioException;
import com.biblioteca.exception.RecursoNaoEncontradoException;
import com.biblioteca.model.Autor;
import com.biblioteca.model.Categoria;
import com.biblioteca.model.Livro;
import com.biblioteca.repository.AutorRepository;
import com.biblioteca.repository.CategoriaRepository;
import com.biblioteca.repository.EmprestimoRepository;
import com.biblioteca.repository.LivroRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.LinkedHashSet;

@Service
public class LivroService {

    @Autowired private LivroRepository      livroRepository;
    @Autowired private AutorRepository      autorRepository;
    @Autowired private CategoriaRepository  categoriaRepository;
    @Autowired private EmprestimoRepository emprestimoRepository;
    @Autowired private com.biblioteca.service.capa.CapaLivroService capaLivroService;

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
     * Resolve as categorias a partir de uma coleção de IDs.
     */
    private Set<Categoria> resolverCategorias(Set<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            throw new NegocioException("O livro precisa ter ao menos uma categoria.");
        }
        Set<Categoria> categorias = new LinkedHashSet<>();
        for (Long id : ids) {
            Categoria c = categoriaRepository.findById(id)
                    .orElseThrow(() -> new RecursoNaoEncontradoException(
                            "Categoria não encontrada com id: " + id));
            categorias.add(c);
        }
        return categorias;
    }

    /**
     * Cadastra um novo livro.
     * Aceita uma lista de IDs de categorias em livro.categorias (Set com objetos de id preenchido).
     */
    @Transactional
    public Livro salvar(Livro livro) {
        Autor autor = autorRepository.findById(livro.getAutor().getId())
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "Autor não encontrado com id: " + livro.getAutor().getId()));

        livro.setAutor(autor);

        // Resolve categorias a partir dos IDs informados
        Set<Long> categoriaIds = new LinkedHashSet<>();
        if (livro.getCategorias() != null) {
            for (Categoria c : livro.getCategorias()) {
                categoriaIds.add(c.getId());
            }
        }
        livro.setCategorias(resolverCategorias(categoriaIds));

        if (livro.getQuantidadeTotal() == null) {
            livro.setQuantidadeTotal(livro.getQuantidadeDisponivel());
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

        // Resolve novas categorias
        Set<Long> novasCategoriaIds = new LinkedHashSet<>();
        if (livroAtualizado.getCategorias() != null) {
            for (Categoria c : livroAtualizado.getCategorias()) {
                novasCategoriaIds.add(c.getId());
            }
        }

        boolean mudouIdentidade =
                !livro.getTitulo().equals(livroAtualizado.getTitulo()) ||
                !livro.getAutor().getId().equals(livroAtualizado.getAutor().getId()) ||
                !novasCategoriaIds.equals(
                    livro.getCategorias().stream()
                        .map(Categoria::getId)
                        .collect(java.util.stream.Collectors.toSet())
                );

        if (mudouIdentidade && emprestados > 0) {
            throw new NegocioException(
                    "Não é possível alterar título, autor ou categorias enquanto há " +
                    emprestados + " exemplar(es) emprestado(s).");
        }

        Autor autor = autorRepository.findById(livroAtualizado.getAutor().getId())
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "Autor não encontrado com id: " + livroAtualizado.getAutor().getId()));

        livro.setTitulo(livroAtualizado.getTitulo());
        livro.setAnoPublicacao(livroAtualizado.getAnoPublicacao());
        livro.setAutor(autor);
        livro.setCategorias(resolverCategorias(novasCategoriaIds));

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

        return livroRepository.save(livro);
    }

    @Transactional
    public void excluir(Long id) {
        if (!livroRepository.existsById(id)) {
            throw new RecursoNaoEncontradoException("Livro não encontrado com id: " + id);
        }
        livroRepository.deleteById(id);
    }
}
