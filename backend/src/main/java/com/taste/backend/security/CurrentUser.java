package com.taste.backend.security;

/**
 * Principal minimo colocado no SecurityContext apos validar o JWT.
 * Evita a necessidade de um UserDetailsService completo, ja que a
 * autenticacao e sempre feita via token (sem login por formulario).
 */
public record CurrentUser(Long userId, String email) {
}
