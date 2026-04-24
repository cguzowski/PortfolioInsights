package com.atlascapital.portfolio.controller;

import com.atlascapital.portfolio.dto.PortfolioCreateRequest;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/portfolio")
public class PortfolioController {

    private final PortfolioService portfolioService;

    public PortfolioController(PortfolioService portfolioService) {
        this.portfolioService = portfolioService;
    }

    @GetMapping
    public PortfolioSummaryResponse getPortfolio(@RequestParam(required = false) Long userId,
                                                 @RequestParam(required = false) Long portfolioId) {
        return portfolioService.getPortfolio(userId, portfolioId);
    }

    @GetMapping("/all")
    public List<PortfolioSummaryResponse> getPortfolios(@RequestParam(required = false) Long userId) {
        return portfolioService.getPortfolios(userId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PortfolioSummaryResponse createPortfolio(@Valid @RequestBody PortfolioCreateRequest request) {
        return portfolioService.createPortfolio(request);
    }

    @PutMapping("/{portfolioId}")
    public PortfolioSummaryResponse updatePortfolio(@PathVariable Long portfolioId,
                                                    @Valid @RequestBody PortfolioCreateRequest request) {
        return portfolioService.updatePortfolio(portfolioId, request);
    }

    @DeleteMapping("/{portfolioId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletePortfolio(@PathVariable Long portfolioId,
                                @RequestParam(required = false) Long userId) {
        portfolioService.deletePortfolio(userId, portfolioId);
    }

    @PostMapping("/holdings")
    @ResponseStatus(HttpStatus.CREATED)
    public PortfolioHoldingResponse createHolding(@RequestParam(required = false) Long userId,
                                                  @RequestParam(required = false) Long portfolioId,
                                                  @Valid @RequestBody PortfolioHoldingRequest request) {
        return portfolioService.createHolding(userId, portfolioId, request);
    }

    @PutMapping("/holdings/{id}")
    public PortfolioHoldingResponse updateHolding(@RequestParam(required = false) Long userId,
                                                  @RequestParam(required = false) Long portfolioId,
                                                  @PathVariable Long id,
                                                  @Valid @RequestBody PortfolioHoldingRequest request) {
        return portfolioService.updateHolding(userId, portfolioId, id, request);
    }

    @DeleteMapping("/holdings/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteHolding(@RequestParam(required = false) Long userId,
                              @RequestParam(required = false) Long portfolioId,
                              @PathVariable Long id) {
        portfolioService.deleteHolding(userId, portfolioId, id);
    }
}
