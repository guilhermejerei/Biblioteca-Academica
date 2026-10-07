package com.biblioteca.exception;

/**
 * Lançada quando um recurso não é encontrado pelo ID.
 * Resulta em HTTP 404.
 */
public class RecursoNaoEncontradoException extends RuntimeException {
    public RecursoNaoEncontradoException(String mensagem) {
        super(mensagem);
    }
}
