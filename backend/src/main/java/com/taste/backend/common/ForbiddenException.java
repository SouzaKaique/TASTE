package com.taste.backend.common;

/** Usuario autenticado, mas sem permissao para a acao (HTTP 403). */
public class ForbiddenException extends RuntimeException {
    public ForbiddenException(String message) {
        super(message);
    }
}
