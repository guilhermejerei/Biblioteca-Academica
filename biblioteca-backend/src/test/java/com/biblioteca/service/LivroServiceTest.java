package com.biblioteca.service;

import com.biblioteca.exception.NegocioException;
import com.biblioteca.model.Autor;
import com.biblioteca.model.Categoria;
import com.biblioteca.model.Livro;
import com.biblioteca.repository.AutorRepository;
import com.biblioteca.repository.CategoriaRepository;
import com.biblioteca.repository.EmprestimoRepository;
import com.biblioteca.repository.LivroRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LivroServiceTest {

    @Mock private LivroRepository      livroRepository;
    @Mock private AutorRepository      autorRepository;
    @Mock private CategoriaRepository  categoriaRepository;
    @Mock private EmprestimoRepository emprestimoRepository;
    @InjectMocks private LivroService  service;

    private Autor autor;
    private Categoria categoria;
    private Livro livroExistente;

    @BeforeEach
    void setUp() {
        autor = new Autor();
        autor.setId(1L);
        autor.setNome("Autor Teste");

        categoria = new Categoria();
        categoria.setId(1L);
        categoria.setNome("Categoria Teste");

        livroExistente = new Livro();
        livroExistente.setId(10L);
        livroExistente.setTitulo("Java Efetivo");
        livroExistente.setIsbn("978-0-13-468599-1");
        livroExistente.setQuantidadeTotal(3);
        livroExistente.setQuantidadeDisponivel(1); // 2 emprestados
        livroExistente.setAutor(autor);
        livroExistente.setCategorias(new java.util.LinkedHashSet<>(java.util.Set.of(categoria)));
    }

    // ── Caso 1: Redução de total abaixo dos emprestados é recusada ─────────────

    @Test
    @DisplayName("Atualizar livro: reduzir total abaixo dos emprestados lança NegocioException")
    void atualizar_reduzirTotalAbaixoEmprestados_lancaExcecao() {
        Livro novosDados = livroAtualizado(1); // tenta setar total=1, mas há 2 emprestados

        when(livroRepository.findById(10L)).thenReturn(Optional.of(livroExistente));
        when(autorRepository.findById(1L)).thenReturn(Optional.of(autor));
        when(categoriaRepository.findById(1L)).thenReturn(Optional.of(categoria));
        when(emprestimoRepository.countEmprestimosAtivos(10L)).thenReturn(2L);

        assertThatThrownBy(() -> service.atualizar(10L, novosDados))
                .isInstanceOf(NegocioException.class)
                .hasMessageContaining("2 exemplar(es) ainda estão emprestados");

        verify(livroRepository, never()).save(any());
    }

    // ── Caso 2: Aumento do total preserva empréstimos ativos ──────────────────

    @Test
    @DisplayName("Atualizar livro: aumentar total recalcula disponivel preservando ativos")
    void atualizar_aumentarTotal_recalculaDisponivelCorreto() {
        // total atual=3, ativos=2, disponivel=1 → novo total=5, esperado disponivel=3
        Livro novosDados = livroAtualizado(5);

        when(livroRepository.findById(10L)).thenReturn(Optional.of(livroExistente));
        when(autorRepository.findById(1L)).thenReturn(Optional.of(autor));
        when(categoriaRepository.findById(1L)).thenReturn(Optional.of(categoria));
        when(emprestimoRepository.countEmprestimosAtivos(10L)).thenReturn(2L);
        when(livroRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Livro resultado = service.atualizar(10L, novosDados);

        assertThat(resultado.getQuantidadeTotal()).isEqualTo(5);
        assertThat(resultado.getQuantidadeDisponivel()).isEqualTo(3); // 5 - 2 ativos
    }

    // ── Caso 3: Redução igual ao número emprestado é permitida ────────────────

    @Test
    @DisplayName("Atualizar livro: reduzir total exatamente até o emprestado é permitido")
    void atualizar_reduzirTotalParaIgualAosEmprestados_permitido() {
        // total=3, ativos=2, disponivel=1 → novo total=2 (igual aos emprestados, disponivel=0)
        Livro novosDados = livroAtualizado(2);

        when(livroRepository.findById(10L)).thenReturn(Optional.of(livroExistente));
        when(autorRepository.findById(1L)).thenReturn(Optional.of(autor));
        when(categoriaRepository.findById(1L)).thenReturn(Optional.of(categoria));
        when(emprestimoRepository.countEmprestimosAtivos(10L)).thenReturn(2L);
        when(livroRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Livro resultado = service.atualizar(10L, novosDados);

        assertThat(resultado.getQuantidadeTotal()).isEqualTo(2);
        assertThat(resultado.getQuantidadeDisponivel()).isEqualTo(0);
    }

    // ── Fábrica auxiliar ───────────────────────────────────────────────────────

    private Livro livroAtualizado(int novoTotal) {
        Livro l = new Livro();
        l.setTitulo("Java Efetivo");
        l.setIsbn("978-0-13-468599-1");
        l.setQuantidadeTotal(novoTotal);
        l.setQuantidadeDisponivel(novoTotal);
        l.setAutor(autor);
        l.setCategorias(new java.util.LinkedHashSet<>(java.util.Set.of(categoria)));
        return l;
    }
}
