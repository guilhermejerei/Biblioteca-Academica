package com.biblioteca.dto;

import java.time.LocalDate;

/**
 * Payload para criação de empréstimo.
 * dataPrevistaDevolucao é opcional — o serviço usa hoje + 14 dias se nulo.
 */
public class EmprestimoRequest {
    private Long usuarioId;
    private Long livroId;
    private LocalDate dataPrevistaDevolucao;

    public Long getUsuarioId() { return usuarioId; }
    public void setUsuarioId(Long usuarioId) { this.usuarioId = usuarioId; }

    public Long getLivroId() { return livroId; }
    public void setLivroId(Long livroId) { this.livroId = livroId; }

    public LocalDate getDataPrevistaDevolucao() { return dataPrevistaDevolucao; }
    public void setDataPrevistaDevolucao(LocalDate dataPrevistaDevolucao) {
        this.dataPrevistaDevolucao = dataPrevistaDevolucao;
    }
}
