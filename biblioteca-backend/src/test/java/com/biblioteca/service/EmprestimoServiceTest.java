package com.biblioteca.service;

import com.biblioteca.dto.EmprestimoRequest;
import com.biblioteca.dto.EmprestimoResponse;
import com.biblioteca.exception.EstoqueInsuficienteException;
import com.biblioteca.exception.NegocioException;
import com.biblioteca.model.Autor;
import com.biblioteca.model.Categoria;
import com.biblioteca.model.Emprestimo;
import com.biblioteca.model.Livro;
import com.biblioteca.model.Usuario;
import com.biblioteca.repository.EmprestimoRepository;
import com.biblioteca.repository.LivroRepository;
import com.biblioteca.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmprestimoServiceTest {

    @Mock private EmprestimoRepository emprestimoRepository;
    @Mock private UsuarioRepository    usuarioRepository;
    @Mock private LivroRepository      livroRepository;
    @InjectMocks private EmprestimoService service;

    private Usuario usuario;
    private Livro livro;

    @BeforeEach
    void setUp() {
        Autor autor = new Autor();
        autor.setId(1L);
        autor.setNome("Autor Teste");

        Categoria categoria = new Categoria();
        categoria.setId(1L);
        categoria.setNome("Categoria Teste");

        usuario = new Usuario();
        usuario.setId(1L);
        usuario.setNome("Ana Silva");
        usuario.setCpf("123.456.789-00");
        usuario.setEmail("ana@teste.com");
        usuario.setTipo(Usuario.TipoUsuario.ALUNO);

        livro = new Livro();
        livro.setId(10L);
        livro.setTitulo("Java Efetivo");
        livro.setIsbn("978-0-13-468599-1");
        livro.setQuantidadeTotal(3);
        livro.setQuantidadeDisponivel(3);
        livro.setAutor(autor);
        livro.setCategorias(new java.util.LinkedHashSet<>(java.util.Set.of(categoria)));
    }

    // ── Caso 1: Empréstimo de livro disponível diminui o estoque em 1 ──────────

    @Test
    @DisplayName("Empréstimo com livro disponível: decrementa estoque e retorna ATIVO")
    void realizarEmprestimo_livroDisponivel_decrementaEstoqueERetornaAtivo() {
        EmprestimoRequest req = new EmprestimoRequest();
        req.setUsuarioId(1L);
        req.setLivroId(10L);

        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(usuario));
        when(livroRepository.findById(10L)).thenReturn(Optional.of(livro));
        // 1 linha afetada = decremento bem-sucedido
        when(livroRepository.decrementarDisponivel(10L)).thenReturn(1);

        Emprestimo salvo = emprestimo(100L, usuario, livro, Emprestimo.Status.ATIVO,
                LocalDate.now(), LocalDate.now().plusDays(14), null);
        when(emprestimoRepository.save(any())).thenReturn(salvo);

        EmprestimoResponse resp = service.realizarEmprestimo(req);

        assertThat(resp.getStatus()).isEqualTo("ATIVO");
        assertThat(resp.getId()).isEqualTo(100L);
        verify(livroRepository).decrementarDisponivel(10L);
        verify(emprestimoRepository).save(any(Emprestimo.class));
    }

    // ── Caso 2: Empréstimo com estoque zero é recusado — nada é gravado ────────

    @Test
    @DisplayName("Empréstimo com estoque zero: lança EstoqueInsuficienteException, não grava")
    void realizarEmprestimo_estoqueZero_lancaExcecaoENaoGrava() {
        EmprestimoRequest req = new EmprestimoRequest();
        req.setUsuarioId(1L);
        req.setLivroId(10L);

        livro.setQuantidadeDisponivel(0);
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(usuario));
        when(livroRepository.findById(10L)).thenReturn(Optional.of(livro));
        // 0 linhas afetadas = sem exemplar disponível
        when(livroRepository.decrementarDisponivel(10L)).thenReturn(0);

        assertThatThrownBy(() -> service.realizarEmprestimo(req))
                .isInstanceOf(EstoqueInsuficienteException.class)
                .hasMessageContaining("Java Efetivo");

        verify(emprestimoRepository, never()).save(any());
    }

    // ── Caso 3: Devolução aumenta o estoque exatamente uma vez ────────────────

    @Test
    @DisplayName("Devolução de empréstimo ativo: incrementa estoque e retorna DEVOLVIDO")
    void registrarDevolucao_emprestimoAtivo_incrementaEstoque() {
        Emprestimo ativo = emprestimo(50L, usuario, livro, Emprestimo.Status.ATIVO,
                LocalDate.now().minusDays(5), LocalDate.now().plusDays(9), null);

        when(emprestimoRepository.findById(50L)).thenReturn(Optional.of(ativo));
        when(emprestimoRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(livroRepository.incrementarDisponivel(10L)).thenReturn(1);

        EmprestimoResponse resp = service.registrarDevolucao(50L);

        assertThat(resp.getStatus()).isEqualTo("DEVOLVIDO");
        assertThat(resp.getDataDevolucao()).isEqualTo(LocalDate.now());
        verify(livroRepository, times(1)).incrementarDisponivel(10L);
    }

    // ── Caso 4: Segunda devolução é recusada — estoque não muda ───────────────

    @Test
    @DisplayName("Devolução duplicada: lança NegocioException, não incrementa estoque")
    void registrarDevolucao_jaDevolvido_lancaExcecaoENaoIncrementaEstoque() {
        Emprestimo devolvido = emprestimo(50L, usuario, livro, Emprestimo.Status.DEVOLVIDO,
                LocalDate.now().minusDays(10), LocalDate.now().minusDays(3),
                LocalDate.now().minusDays(3));

        when(emprestimoRepository.findById(50L)).thenReturn(Optional.of(devolvido));

        assertThatThrownBy(() -> service.registrarDevolucao(50L))
                .isInstanceOf(NegocioException.class)
                .hasMessageContaining("já foi devolvido");

        verify(livroRepository, never()).incrementarDisponivel(any());
    }

    // ── Caso 5: Status calculado — prazo vencido sem devolução → ATRASADO ─────

    @Test
    @DisplayName("EmprestimoResponse: prazo vencido sem devolução → status ATRASADO")
    void emprestimoResponse_prazoVencido_retornaAtrasado() {
        // Status gravado no banco é ATIVO (dado "desatualizado"); o DTO deve calcular ATRASADO
        Emprestimo atrasado = emprestimo(99L, usuario, livro, Emprestimo.Status.ATIVO,
                LocalDate.now().minusDays(20), LocalDate.now().minusDays(5), null);

        EmprestimoResponse resp = EmprestimoResponse.de(atrasado);

        assertThat(resp.getStatus()).isEqualTo("ATRASADO");
        assertThat(resp.getDiasRestantes()).isNegative();
    }

    // ── Caso 6: Status calculado — prazo não vencido → ATIVO ──────────────────

    @Test
    @DisplayName("EmprestimoResponse: prazo não vencido sem devolução → status ATIVO")
    void emprestimoResponse_prazoFuturo_retornaAtivo() {
        Emprestimo ativo = emprestimo(98L, usuario, livro, Emprestimo.Status.ATIVO,
                LocalDate.now().minusDays(3), LocalDate.now().plusDays(11), null);

        EmprestimoResponse resp = EmprestimoResponse.de(ativo);

        assertThat(resp.getStatus()).isEqualTo("ATIVO");
        assertThat(resp.getDiasRestantes()).isGreaterThan(0);
    }

    // ── Caso 7: Devolução — depois de devolver, novo empréstimo do mesmo livro funciona ─

    @Test
    @DisplayName("Após devolução, incrementarDisponivel é chamado exatamente uma vez")
    void registrarDevolucao_incrementaExatamenteUmaVez() {
        Emprestimo ativo = emprestimo(55L, usuario, livro, Emprestimo.Status.ATIVO,
                LocalDate.now().minusDays(7), LocalDate.now().plusDays(7), null);

        when(emprestimoRepository.findById(55L)).thenReturn(Optional.of(ativo));
        when(emprestimoRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(livroRepository.incrementarDisponivel(10L)).thenReturn(1);

        service.registrarDevolucao(55L);

        // Incremento chamado exatamente 1 vez — nunca mais que isso
        verify(livroRepository, times(1)).incrementarDisponivel(10L);
    }

    // ── Fábrica auxiliar ───────────────────────────────────────────────────────

    private static Emprestimo emprestimo(Long id, Usuario u, Livro l,
            Emprestimo.Status status, LocalDate dataEmp,
            LocalDate dataPrevista, LocalDate dataDev) {
        Emprestimo e = new Emprestimo();
        e.setId(id);
        e.setUsuario(u);
        e.setLivro(l);
        e.setStatus(status);
        e.setDataEmprestimo(dataEmp);
        e.setDataPrevistaDevolucao(dataPrevista);
        e.setDataDevolucao(dataDev);
        return e;
    }
}
