package com.biblioteca.service;

import com.biblioteca.exception.NegocioException;
import com.biblioteca.model.Autor;
import com.biblioteca.model.Categoria;
import com.biblioteca.model.Livro;
import com.biblioteca.model.LivroCategoria;
import com.biblioteca.repository.AutorRepository;
import com.biblioteca.repository.CategoriaRepository;
import com.biblioteca.repository.EmprestimoRepository;
import com.biblioteca.repository.LivroRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
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
    @Mock private com.biblioteca.repository.LivroCategoriaRepository livroCategoriaRepository;
    @Mock private com.biblioteca.service.capa.CapaLivroService capaLivroService;
    /** O flush no meio da edição de categorias precisa existir mesmo em teste. */
    @Mock private jakarta.persistence.EntityManager entityManager;
    @InjectMocks private LivroService  service;

    private Autor autor;
    private Categoria area;
    private Categoria categoria;
    private Categoria categoria2;
    private Livro livroExistente;

    @BeforeEach
    void setUp() {
        autor = new Autor();
        autor.setId(1L);
        autor.setNome("Autor Teste");

        area = new Categoria();
        area.setId(100L);
        area.setNome("Literatura");
        area.setOrdemExibicao(1);
        area.setCor("#8C2B2B");

        categoria = subcategoria(1L, "Ficção Científica", area);
        categoria2 = subcategoria(2L, "Fantasia", area);
    }

    private Categoria subcategoria(Long id, String nome, Categoria pai) {
        Categoria c = new Categoria();
        c.setId(id);
        c.setNome(nome);
        c.setCategoriaPai(pai);
        return c;
    }

    private List<LivroCategoria> ligacoes(Categoria... pares) {
        List<LivroCategoria> lista = new ArrayList<>();
        for (int i = 0; i < pares.length; i++) {
            lista.add(new LivroCategoria(pares[i], i == 0)); // a primeira é a principal
        }
        return lista;
    }

    private Livro livroExistente() {
        Livro l = new Livro();
        l.setId(10L);
        l.setTitulo("Java Efetivo");
        l.setIsbn("978-0-13-468599-1");
        l.setQuantidadeTotal(3);
        l.setQuantidadeDisponivel(1); // 2 emprestados
        l.setAutor(autor);
        l.setLivroCategorias(ligacoes(categoria));
        return l;
    }

    // ═══════════════════════════════════════════════════════════
    // Estoque (comportamento que já existia)
    // ═══════════════════════════════════════════════════════════

    @Nested
    @DisplayName("Ajuste de exemplares")
    class Estoque {

        @Test
        @DisplayName("Reduzir total abaixo dos emprestados é recusado")
        void reduzirTotalAbaixoEmprestados_lancaExcecao() {
            Livro novosDados = livroAtualizado(1);

            when(livroRepository.findById(10L)).thenReturn(Optional.of(livroExistente()));
            when(autorRepository.findById(1L)).thenReturn(Optional.of(autor));
            when(categoriaRepository.findById(1L)).thenReturn(Optional.of(categoria));

            when(emprestimoRepository.countEmprestimosAtivos(10L)).thenReturn(2L);

            // o total novo (1) é menor que os emprestados (2)
            assertThatThrownBy(() -> service.atualizar(10L, novosDados))
                    .isInstanceOf(NegocioException.class)
                    .hasMessageContaining("2 exemplar(es) ainda estão emprestados");

            verify(livroRepository, never()).save(any());
        }

        @Test
        @DisplayName("Aumentar o total preserva os empréstimos ativos")
        void aumentarTotal_recalculaDisponivel() {
            when(livroRepository.findById(10L)).thenReturn(Optional.of(livroExistente()));
            when(autorRepository.findById(1L)).thenReturn(Optional.of(autor));
            when(categoriaRepository.findById(1L)).thenReturn(Optional.of(categoria));
            when(livroCategoriaRepository.listarDoLivro(anyLong())).thenReturn(List.of());
            when(emprestimoRepository.countEmprestimosAtivos(10L)).thenReturn(2L);


            Livro resultado = service.atualizar(10L, livroAtualizado(5));

            assertThat(resultado.getQuantidadeTotal()).isEqualTo(5);
            assertThat(resultado.getQuantidadeDisponivel()).isEqualTo(3);
        }

        @Test
        @DisplayName("Reduzir o total até o número emprestado é permitido")
        void reduzirTotalAteEmprestados_permitido() {
            when(livroRepository.findById(10L)).thenReturn(Optional.of(livroExistente()));
            when(autorRepository.findById(1L)).thenReturn(Optional.of(autor));
            when(categoriaRepository.findById(1L)).thenReturn(Optional.of(categoria));
            when(livroCategoriaRepository.listarDoLivro(anyLong())).thenReturn(List.of());
            when(emprestimoRepository.countEmprestimosAtivos(10L)).thenReturn(2L);


            Livro resultado = service.atualizar(10L, livroAtualizado(2));

            assertThat(resultado.getQuantidadeTotal()).isEqualTo(2);
            assertThat(resultado.getQuantidadeDisponivel()).isZero();
        }
    }

    // ═══════════════════════════════════════════════════════════
    // Regras das categorias
    // ═══════════════════════════════════════════════════════════

    @Nested
    @DisplayName("Limite de categorias")
    class Limite {

        @Test
        @DisplayName("Cinco categorias são recusadas, com o número no mensaje")
        void cincoCategorias_recusadas() {
            Categoria c3 = subcategoria(3L, "Terror", area);
            Categoria c4 = subcategoria(4L, "Mistério", area);
            Categoria c5 = subcategoria(5L, "Aventura", area);

            when(autorRepository.findById(1L)).thenReturn(Optional.of(autor));

            assertThatThrownBy(() -> service.salvar(
                    livroNovo(ligacoes(categoria, categoria2, c3, c4, c5))))
                    .isInstanceOf(NegocioException.class)
                    .hasMessageContaining("no máximo 4 categorias")
                    .hasMessageContaining("Você marcou 5");

            verify(livroRepository, never()).save(any());
        }

        @Test
        @DisplayName("Quatro categorias são aceitas")
        void quatroCategorias_aceitas() {
            Categoria c3 = subcategoria(3L, "Terror", area);
            Categoria c4 = subcategoria(4L, "Mistério", area);

            when(autorRepository.findById(1L)).thenReturn(Optional.of(autor));
            when(categoriaRepository.findById(anyLong())).thenAnswer(inv -> {
                long id = inv.getArgument(0);
                return Optional.of(List.of(categoria, categoria2, c3, c4).stream()
                        .filter(c -> c.getId().equals(id)).findFirst().orElse(null));
            });
            when(livroRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            Livro salvo = service.salvar(livroNovo(ligacoes(categoria, categoria2, c3, c4)));

            assertThat(salvo.getLivroCategorias()).hasSize(4);
            assertThat(salvo.getLivroCategorias().stream().filter(LivroCategoria::isPrincipal)).hasSize(1);
        }

        @Test
        @DisplayName("Nenhuma categoria é recusada")
        void nenhumaCategoria_recusada() {
            when(autorRepository.findById(1L)).thenReturn(Optional.of(autor));

            assertThatThrownBy(() -> service.salvar(livroNovo(List.of())))
                    .isInstanceOf(NegocioException.class)
                    .hasMessageContaining("ao menos uma categoria");
        }
    }

    @Nested
    @DisplayName("Categoria principal")
    class Principal {

        @Test
        @DisplayName("Sem principal marcada, é recusado")
        void semPrincipal_recusado() {
            when(autorRepository.findById(1L)).thenReturn(Optional.of(autor));

            // duas categorias, nenhuma marcada como principal
            List<LivroCategoria> semPrincipal = new ArrayList<>();
            semPrincipal.add(new LivroCategoria(categoria, false));
            semPrincipal.add(new LivroCategoria(categoria2, false));

            assertThatThrownBy(() -> service.salvar(livroNovo(semPrincipal)))
                    .isInstanceOf(NegocioException.class)
                    .hasMessageContaining("Escolha qual das 2 categorias é a principal");
        }

        @Test
        @DisplayName("Principal apontando para categoria vazia é tratada como sem principal")
        void principalSemCategoria_recusado() {
            when(autorRepository.findById(1L)).thenReturn(Optional.of(autor));

            // vínculo marcado como principal, mas sem categoria preenchida:
            // o id não entra na seleção, então é como se nada tivesse sido marcado
            List<LivroCategoria> ligacoes = new ArrayList<>();
            ligacoes.add(new LivroCategoria(categoria, false));
            ligacoes.add(new LivroCategoria(null, true));

            assertThatThrownBy(() -> service.salvar(livroNovo(ligacoes)))
                    .isInstanceOf(NegocioException.class)
                    .hasMessageContaining("Escolha qual das 1 categorias é a principal");
        }

        @Test
        @DisplayName("Uma principal é escolhida mesmo quando a ordem manda outra")
        void principalEscolhida_noSegundo() {
            when(autorRepository.findById(1L)).thenReturn(Optional.of(autor));
            when(categoriaRepository.findById(anyLong())).thenAnswer(inv -> {
                long id = inv.getArgument(0);
                return Optional.of(categoria.getId().equals(id) ? categoria : categoria2);
            });
            when(livroRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            List<LivroCategoria> ligacoes = new ArrayList<>();
            ligacoes.add(new LivroCategoria(categoria, false));   // secundária
            ligacoes.add(new LivroCategoria(categoria2, true));  // principal

            Livro salvo = service.salvar(livroNovo(ligacoes));

            assertThat(salvo.getCategoriaPrincipal()).isNotNull();
            assertThat(salvo.getCategoriaPrincipal().getId()).isEqualTo(2L);
        }

        @Test
        @DisplayName("Marcar uma área é recusado, com o nome da área na mensagem")
        void marcarArea_recusado() {
            when(autorRepository.findById(1L)).thenReturn(Optional.of(autor));
            when(categoriaRepository.findById(1L)).thenReturn(Optional.of(categoria));

            when(categoriaRepository.findById(100L)).thenReturn(Optional.of(area));

            assertThatThrownBy(() -> service.salvar(livroNovo(ligacoes(categoria, area))))
                    .isInstanceOf(NegocioException.class)
                    .hasMessageContaining("\"Literatura\" é uma área, não uma categoria");
        }
    }

    @Nested
    @DisplayName("ISBN")
    class Isbn {

        @Test
        @DisplayName("Trocar o ISBN é recusado")
        void trocarIsbn_recusado() {
            Livro novos = livroAtualizado(3);
            novos.setIsbn("978-00-000000-0");

            when(livroRepository.findById(10L)).thenReturn(Optional.of(livroExistente()));

            assertThatThrownBy(() -> service.atualizar(10L, novos))
                    .isInstanceOf(NegocioException.class)
                    .hasMessageContaining("ISBN não pode ser alterado");
        }
    }

    @Nested
    @DisplayName("Cadastro")
    class Cadastro {

        @Test
        @DisplayName("Editar reaproveita a ligação existente em vez de duplicar a chave composta")
        void editar_reaproveitaLigacaoExistente() {
            // o livro 10 já tem a categoria 1 como principal
            LivroCategoria cat1 = new LivroCategoria(categoria, true);
            when(livroRepository.findById(10L)).thenReturn(Optional.of(livroExistente()));
            when(livroCategoriaRepository.listarDoLivro(10L)).thenReturn(List.of(cat1));
            when(autorRepository.findById(1L)).thenReturn(Optional.of(autor));
            when(categoriaRepository.findById(anyLong())).thenAnswer(inv ->
                    Optional.of(inv.<Long>getArgument(0).equals(2L) ? categoria2 : categoria));
            when(emprestimoRepository.countEmprestimosAtivos(10L)).thenReturn(0L);

            Livro novos = livroAtualizado(3);
            List<LivroCategoria> desejadas = new ArrayList<>();
            desejadas.add(new LivroCategoria(categoria, false));  // a 1 fica, perde a principal
            desejadas.add(new LivroCategoria(categoria2, true));  // a 2 assume
            novos.setLivroCategorias(desejadas);

            Livro atualizado = service.atualizar(10L, novos);

            List<LivroCategoria> finais = atualizado.getLivroCategorias();
            assertThat(finais).hasSize(2);
            // a linha da categoria 1 é a mesma instância, só com a marcação trocada
            assertThat(finais.get(0)).isSameAs(cat1);
            assertThat(finais.get(0).isPrincipal()).isFalse();
            assertThat(finais.get(1).getCategoria().getId()).isEqualTo(2L);
            assertThat(finais.get(1).isPrincipal()).isTrue();
        }

        @Test
        @DisplayName("Livro novo nasce com tudo disponível, mesmo sem vir o disponível")
        void semQuantidadeDisponivel_preencheComOTotal() {
            // o formulário manda só o total; quantidade_disponivel é NOT NULL
            when(autorRepository.findById(1L)).thenReturn(Optional.of(autor));
            when(categoriaRepository.findById(1L)).thenReturn(Optional.of(categoria));

            when(livroRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            Livro novo = livroNovo(ligacoes(categoria));
            novo.setQuantidadeTotal(4);
            novo.setQuantidadeDisponivel(null);

            Livro salvo = service.salvar(novo);

            assertThat(salvo.getQuantidadeTotal()).isEqualTo(4);
            assertThat(salvo.getQuantidadeDisponivel())
                    .as("livro recém-criado não tem empréstimo, então está tudo disponível")
                    .isEqualTo(4);
        }
    }

    // ═══════════════════════════════════════════════════════════
    // Fábricas
    // ═══════════════════════════════════════════════════════════

    private Livro livroAtualizado(int novoTotal) {
        Livro l = new Livro();
        l.setTitulo("Java Efetivo");
        l.setIsbn("978-0-13-468599-1");
        l.setQuantidadeTotal(novoTotal);
        l.setQuantidadeDisponivel(novoTotal);
        l.setAutor(autor);
        l.setLivroCategorias(ligacoes(categoria));
        return l;
    }

    private Livro livroNovo(List<LivroCategoria> ligacoes) {
        Livro l = new Livro();
        l.setTitulo("Livro Novo");
        l.setIsbn("978-00-111111-1");
        l.setAnoPublicacao(2024);
        l.setQuantidadeTotal(1);
        l.setQuantidadeDisponivel(1);
        l.setAutor(autor);
        l.setLivroCategorias(new ArrayList<>(ligacoes));
        return l;
    }
}
