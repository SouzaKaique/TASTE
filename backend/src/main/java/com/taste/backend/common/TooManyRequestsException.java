package com.taste.backend.common;

/** Muitas tentativas em pouco tempo (HTTP 429). */
public class TooManyRequestsException extends RuntimeException {
    public TooManyRequestsException(String message) {
        super(message);
    }
}
