package com.biblioteca.dto;

import java.util.List;

public record RelatorioSincronizacao(
        int totalProcessados,
        int capasEncontradas,
        int semCapa,
        int emRevisao,
        List<ItemIsbnInvalido> isbnsInvalidos
) {
    public record ItemIsbnInvalido(
            Long livroId,
            String titulo,
            String isbn,
            String motivo
    ) {}
}
