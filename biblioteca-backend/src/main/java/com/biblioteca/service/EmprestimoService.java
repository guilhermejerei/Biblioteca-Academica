package com.biblioteca.service;

import com.biblioteca.dto.EmprestimoRequest;
import com.biblioteca.dto.EmprestimoResponse;
import com.biblioteca.exception.EstoqueInsuficienteException;
import com.biblioteca.exception.NegocioException;
import com.biblioteca.exception.RecursoNaoEncontradoException;
import com.biblioteca.model.Emprestimo;
import com.biblioteca.model.Livro;
import com.biblioteca.model.Usuario;
import com.biblioteca.repository.EmprestimoRepository;
import com.biblioteca.repository.LivroRepository;
import com.biblioteca.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class EmprestimoService {

    @Autowired private EmprestimoRepository emprestimoRepository;
    @Autowired private UsuarioRepository    usuarioRepository;
    @Autowired private LivroRepository      livroRepository;

    // ── Consultas ────────────────────────────────────────────────────────────

    public List<EmprestimoResponse> listarTodos() {
        return emprestimoRepository.findAll().stream()
                .map(EmprestimoResponse::de).toList();
    }

    public EmprestimoResponse buscarPorId(Long id) {
        Emprestimo e = emprestimoRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Empréstimo não encontrado: " + id));
        return EmprestimoResponse.de(e);
    }

    public List<EmprestimoResponse> buscarPorUsuario(Long usuarioId) {
        return emprestimoRepository.findByUsuarioId(usuarioId).stream()
                .map(EmprestimoResponse::de).toList();
    }

    /** Retorna empréstimos ativos calculados em tempo real (status ATIVO). */
    public List<EmprestimoResponse> buscarAtivos() {
        return emprestimoRepository.findNaoDevolvidos().stream()
                .map(EmprestimoResponse::de)
                .filter(r -> "ATIVO".equals(r.getStatus()))
                .toList();
    }

    /** Retorna empréstimos atrasados calculados em tempo real (status ATRASADO). */
    public List<EmprestimoResponse> buscarAtrasados() {
        return emprestimoRepository.findNaoDevolvidos().stream()
                .map(EmprestimoResponse::de)
                .filter(r -> "ATRASADO".equals(r.getStatus()))
                .toList();
    }

    // ── Criação de empréstimo ─────────────────────────────────────────────────

    /**
     * Realiza um novo empréstimo de forma atômica e segura contra race condition.
     *
     * Fluxo dentro de uma única transação:
     *   1. Verifica existência do usuário e do livro.
     *   2. Tenta decrementar disponivel com UPDATE condicional (disponivel > 0).
     *   3. Se nenhuma linha foi alterada → lança EstoqueInsuficienteException (409).
     *   4. Cria o empréstimo e persiste.
     */
    @Transactional
    public EmprestimoResponse realizarEmprestimo(EmprestimoRequest req) {
        Usuario usuario = usuarioRepository.findById(req.getUsuarioId())
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "Usuário não encontrado com id: " + req.getUsuarioId()));

        Livro livro = livroRepository.findById(req.getLivroId())
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "Livro não encontrado com id: " + req.getLivroId()));

        // Update atômico e condicional — evita race condition
        int linhasAfetadas = livroRepository.decrementarDisponivel(livro.getId());
        if (linhasAfetadas == 0) {
            throw new EstoqueInsuficienteException(livro.getTitulo());
        }

        LocalDate dataPrevista = (req.getDataPrevistaDevolucao() != null)
                ? req.getDataPrevistaDevolucao()
                : LocalDate.now().plusDays(14);

        Emprestimo emprestimo = new Emprestimo();
        emprestimo.setUsuario(usuario);
        emprestimo.setLivro(livro);
        emprestimo.setDataEmprestimo(LocalDate.now());
        emprestimo.setDataPrevistaDevolucao(dataPrevista);
        // Status salvo sempre como ATIVO no banco; o DTO calcula o status real
        emprestimo.setStatus(Emprestimo.Status.ATIVO);

        return EmprestimoResponse.de(emprestimoRepository.save(emprestimo));
    }

    // ── Devolução ─────────────────────────────────────────────────────────────

    /**
     * Registra a devolução de forma idempotente e atômica.
     * - Não incrementa o estoque se o empréstimo já foi devolvido.
     * - Usa UPDATE condicional no livro (disponivel < total).
     */
    @Transactional
    public EmprestimoResponse registrarDevolucao(Long emprestimoId) {
        Emprestimo emprestimo = emprestimoRepository.findById(emprestimoId)
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "Empréstimo não encontrado com id: " + emprestimoId));

        if (emprestimo.getStatus() == Emprestimo.Status.DEVOLVIDO) {
            throw new NegocioException("Este empréstimo já foi devolvido.");
        }

        emprestimo.setDataDevolucao(LocalDate.now());
        emprestimo.setStatus(Emprestimo.Status.DEVOLVIDO);
        emprestimoRepository.save(emprestimo);

        // Incremento atômico — disponivel nunca ultrapassa total
        livroRepository.incrementarDisponivel(emprestimo.getLivro().getId());

        return EmprestimoResponse.de(emprestimo);
    }

    // ── Prorrogação / Encurtamento de prazo ──────────────────────────────────

    /**
     * Altera a data prevista de devolução de um empréstimo não devolvido.
     *
     * Regras:
     *   - Empréstimo já devolvido não pode ter prazo alterado.
     *   - A nova data não pode ser anterior a hoje (impede criar atraso artificial).
     *   - A nova data não pode ser anterior à data do empréstimo.
     */
    @Transactional
    public EmprestimoResponse atualizarPrazo(Long emprestimoId, LocalDate novaData) {
        Emprestimo emprestimo = emprestimoRepository.findById(emprestimoId)
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "Empréstimo não encontrado com id: " + emprestimoId));

        if (emprestimo.getStatus() == Emprestimo.Status.DEVOLVIDO) {
            throw new NegocioException("Não é possível alterar o prazo de um empréstimo já devolvido.");
        }

        if (novaData.isBefore(emprestimo.getDataEmprestimo())) {
            throw new NegocioException(
                    "A nova data de devolução não pode ser anterior à data do empréstimo ("
                    + emprestimo.getDataEmprestimo() + ").");
        }

        // Não permite retroagir para uma data já passada — isso criaria atraso artificial
        if (novaData.isBefore(LocalDate.now())) {
            throw new NegocioException(
                    "A nova data de devolução não pode ser anterior a hoje ("
                    + LocalDate.now() + "). Para registrar atraso, aguarde o vencimento natural.");
        }

        emprestimo.setDataPrevistaDevolucao(novaData);
        return EmprestimoResponse.de(emprestimoRepository.save(emprestimo));
    }
}
