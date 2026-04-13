package com.atlascapital.portfolio.controller;

import com.atlascapital.portfolio.dto.PortfolioHoldingRequest;
import com.atlascapital.portfolio.dto.PortfolioHoldingResponse;
import com.atlascapital.portfolio.dto.PortfolioSummaryResponse;
import com.atlascapital.portfolio.service.PortfolioService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/portfolio")
public class PortfolioController {

    private final PortfolioService portfolioService;

    public PortfolioController(PortfolioService portfolioService) {
        this.portfolioService = portfolioService;
    }

    @GetMapping
    public PortfolioSummaryResponse getPortfolio() {
        return portfolioService.getPortfolio();
    }

    @PostMapping("/holdings")
    @ResponseStatus(HttpStatus.CREATED)
    public PortfolioHoldingResponse createHolding(@Valid @RequestBody PortfolioHoldingRequest request) {
        return portfolioService.createHolding(request);
    }

    @PutMapping("/holdings/{id}")
    public PortfolioHoldingResponse updateHolding(@PathVariable Long id,
                                                  @Valid @RequestBody PortfolioHoldingRequest request) {
        return portfolioService.updateHolding(id, request);
    }

    @DeleteMapping("/holdings/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteHolding(@PathVariable Long id) {
        portfolioService.deleteHolding(id);
    }
}
