package com.taste.backend.place;

/** O servico externo de lugares (OpenStreetMap) nao respondeu. */
public class PlaceServiceUnavailableException extends RuntimeException {
    public PlaceServiceUnavailableException() {
        super("A busca de restaurantes está indisponível no momento. Tente novamente em instantes.");
    }
}
