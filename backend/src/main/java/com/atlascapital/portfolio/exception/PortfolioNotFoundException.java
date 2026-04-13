package com.atlascapital.portfolio.exception;

public class PortfolioNotFoundException extends RuntimeException {

    public PortfolioNotFoundException(Long id) {
        super("Portfolio with id " + id + " was not found.");
    }
}
