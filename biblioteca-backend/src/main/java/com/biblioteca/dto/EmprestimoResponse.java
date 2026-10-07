package com.biblioteca.dto;

import com.biblioteca.model.Emprestimo;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

/**
 * DTO de saída para empréstimos.
 * O status é calculado em tempo real a partir das datas,
 * sem depender do valor gravado no banco (que pode ficar desatualizado).
 *
 * Regra de cálculo de status:
 *   - Se dataDevolucao não é nula → DEVOLVIDO
 *   - Se dataPrevistaDevolucao >= hoje  → ATIVO
 *   - Se dataPrevistaDevolucao < hoje   → ATRASADO
 *
 * diasRestantes:
 *   - null quando DEVOLVIDO
 *   - positivo quando ATIVO (dias até o prazo)
 *   - negativo quando ATRASADO (dias de atraso, sinalizado)
 */
public class EmprestimoResponse {

    private Long id;
    private UsuarioResumo usuario;
    private LivroResumo livro;
    private LocalDate dataEmprestimo;
    private LocalDate dataPrevistaDevolucao;
    private LocalDate dataDevolucao;
    private String status;
    private Long diasRestantes;

    // ── Subclasses resumo ──────────────────────────────────────
    public static class UsuarioResumo {
        private Long id;
        private String nome;
        private String cpf;
        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getNome() { return nome; }
        public void setNome(String nome) { this.nome = nome; }
        public String getCpf() { return cpf; }
        public void setCpf(String cpf) { this.cpf = cpf; }
    }

    public static class LivroResumo {
        private Long id;
        private String titulo;
        private String isbn;
        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getTitulo() { return titulo; }
        public void setTitulo(String titulo) { this.titulo = titulo; }
        public String getIsbn() { return isbn; }
        public void setIsbn(String isbn) { this.isbn = isbn; }
    }

    // ── Factory method ─────────────────────────────────────────
    public static EmprestimoResponse de(Emprestimo e) {
        EmprestimoResponse dto = new EmprestimoResponse();
        dto.setId(e.getId());
        dto.setDataEmprestimo(e.getDataEmprestimo());
        dto.setDataPrevistaDevolucao(e.getDataPrevistaDevolucao());
        dto.setDataDevolucao(e.getDataDevolucao());

        // Usuário resumido
        UsuarioResumo ur = new UsuarioResumo();
        ur.setId(e.getUsuario().getId());
        ur.setNome(e.getUsuario().getNome());
        ur.setCpf(e.getUsuario().getCpf());
        dto.setUsuario(ur);

        // Livro resumido
        LivroResumo lr = new LivroResumo();
        lr.setId(e.getLivro().getId());
        lr.setTitulo(e.getLivro().getTitulo());
        lr.setIsbn(e.getLivro().getIsbn());
        dto.setLivro(lr);

        // Status calculado em tempo real
        LocalDate hoje = LocalDate.now();
        if (e.getDataDevolucao() != null) {
            dto.setStatus("DEVOLVIDO");
            dto.setDiasRestantes(null);
        } else if (!e.getDataPrevistaDevolucao().isBefore(hoje)) {
            dto.setStatus("ATIVO");
            dto.setDiasRestantes(ChronoUnit.DAYS.between(hoje, e.getDataPrevistaDevolucao()));
        } else {
            dto.setStatus("ATRASADO");
            // Negativo = dias de atraso
            dto.setDiasRestantes(ChronoUnit.DAYS.between(hoje, e.getDataPrevistaDevolucao()));
        }

        return dto;
    }

    // ── Getters / Setters ──────────────────────────────────────
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public UsuarioResumo getUsuario() { return usuario; }
    public void setUsuario(UsuarioResumo usuario) { this.usuario = usuario; }

    public LivroResumo getLivro() { return livro; }
    public void setLivro(LivroResumo livro) { this.livro = livro; }

    public LocalDate getDataEmprestimo() { return dataEmprestimo; }
    public void setDataEmprestimo(LocalDate dataEmprestimo) { this.dataEmprestimo = dataEmprestimo; }

    public LocalDate getDataPrevistaDevolucao() { return dataPrevistaDevolucao; }
    public void setDataPrevistaDevolucao(LocalDate dataPrevistaDevolucao) {
        this.dataPrevistaDevolucao = dataPrevistaDevolucao;
    }

    public LocalDate getDataDevolucao() { return dataDevolucao; }
    public void setDataDevolucao(LocalDate dataDevolucao) { this.dataDevolucao = dataDevolucao; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Long getDiasRestantes() { return diasRestantes; }
    public void setDiasRestantes(Long diasRestantes) { this.diasRestantes = diasRestantes; }
}
