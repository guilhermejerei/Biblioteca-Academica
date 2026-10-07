package com.biblioteca.exception;

/**
 * Exceção de regra de negócio — resulta em HTTP 400.
 */
public class NegocioException extends RuntimeException {
    public NegocioException(String mensagem) {
        super(mensagem);
    }
}
