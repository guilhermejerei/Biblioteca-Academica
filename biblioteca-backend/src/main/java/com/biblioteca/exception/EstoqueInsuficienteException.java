package com.biblioteca.exception;

/**
 * Lançada quando não há exemplares disponíveis para empréstimo.
 * Resulta em HTTP 409 (Conflict).
 */
public class EstoqueInsuficienteException extends RuntimeException {
    public EstoqueInsuficienteException(String titulo) {
        super("Não há exemplares disponíveis para o livro \"" + titulo + "\". Tente novamente mais tarde.");
    }
}
