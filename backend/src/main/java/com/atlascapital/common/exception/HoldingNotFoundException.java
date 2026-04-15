package com.atlascapital.common.exception;

public class HoldingNotFoundException extends RuntimeException {

    public HoldingNotFoundException(Long id) {
        super("Holding with id " + id + " was not found.");
    }
}
