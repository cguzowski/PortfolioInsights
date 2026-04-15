package com.atlascapital.common.exception;

public class PortfolioNotFoundException extends RuntimeException {

    public PortfolioNotFoundException(Long id) {
        super("Portfolio with id " + id + " was not found.");
    }

    public PortfolioNotFoundException(String message) {
        super(message);
    }
}
