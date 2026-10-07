package com.biblioteca.dto;

import java.time.LocalDate;

/**
 * Payload para prorrogar (ou encurtar) o prazo de devolução.
 */
public class ProrrogacaoRequest {
    private LocalDate novaDataPrevista;

    public LocalDate getNovaDataPrevista() { return novaDataPrevista; }
    public void setNovaDataPrevista(LocalDate novaDataPrevista) {
        this.novaDataPrevista = novaDataPrevista;
    }
}
