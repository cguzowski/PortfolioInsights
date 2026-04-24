package com.atlascapital.portfolio;

import com.atlascapital.portfolio.service.PortfolioService;
import com.atlascapital.portfolio.dto.PortfolioCreateRequest;
import com.atlascapital.portfolio.dto.PortfolioHoldingRequest;
import com.atlascapital.portfolio.dto.PortfolioHoldingResponse;
import com.atlascapital.portfolio.dto.PortfolioSummaryResponse;
import com.atlascapital.portfolio.repository.PortfolioHoldingRepository;
import com.atlascapital.portfolio.repository.PortfolioRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class PortfolioServiceIntegrationTests {

    @Autowired
    private PortfolioService portfolioService;

    @Autowired
    private PortfolioHoldingRepository portfolioHoldingRepository;

    @Autowired
    private PortfolioRepository portfolioRepository;

    @Test
    void shouldLoadSeededPortfolioFromDatabase() {
        PortfolioSummaryResponse portfolio = portfolioService.getPortfolio(501L, null);

        assertThat(portfolio.portfolioId()).isEqualTo(1001L);
        assertThat(portfolio.userId()).isEqualTo(501L);
        assertThat(portfolio.userName()).isEqualTo("Sophia Bennett");
        assertThat(portfolio.holdings()).hasSize(5);
        assertThat(portfolio.totalValue()).isPositive();
    }

    @Test
    void shouldPersistHoldingCrudOperations() {
        PortfolioHoldingRequest createRequest = new PortfolioHoldingRequest(
                "TSLA",
                "Tesla Inc.",
                "Equity",
                BigDecimal.valueOf(18),
                BigDecimal.valueOf(165.25),
                BigDecimal.valueOf(172.40),
                BigDecimal.valueOf(1.85)
        );

        PortfolioHoldingResponse created = portfolioService.createHolding(501L, 1001L, createRequest);

        assertThat(created.id()).isNotNull();
        assertThat(portfolioHoldingRepository.findById(created.id())).isPresent();

        PortfolioHoldingRequest updateRequest = new PortfolioHoldingRequest(
                "TSLA",
                "Tesla Motors",
                "Equity",
                BigDecimal.valueOf(20),
                BigDecimal.valueOf(165.25),
                BigDecimal.valueOf(174.10),
                BigDecimal.valueOf(2.10)
        );

        PortfolioHoldingResponse updated = portfolioService.updateHolding(501L, 1001L, created.id(), updateRequest);

        assertThat(updated.name()).isEqualTo("Tesla Motors");
        assertThat(updated.quantity()).isEqualByComparingTo("20.00");

        portfolioService.deleteHolding(501L, 1001L, created.id());

        assertThat(portfolioHoldingRepository.findById(created.id())).isEmpty();
    }

    @Test
    void shouldCreatePortfolioWithHoldingsForUser() {
        PortfolioCreateRequest request = new PortfolioCreateRequest(
                501L,
                "Generated Income Portfolio",
                "USD",
                "Moderate",
                BigDecimal.valueOf(2500),
                List.of(
                        new PortfolioHoldingRequest(
                                "SCHD",
                                "Schwab U.S. Dividend Equity ETF",
                                "ETF",
                                BigDecimal.valueOf(50),
                                BigDecimal.valueOf(76.25),
                                BigDecimal.valueOf(79.10),
                                BigDecimal.valueOf(0.35)
                        ),
                        new PortfolioHoldingRequest(
                                "BND",
                                "Vanguard Total Bond Market ETF",
                                "Bond",
                                BigDecimal.valueOf(90),
                                BigDecimal.valueOf(72.10),
                                BigDecimal.valueOf(73.20),
                                BigDecimal.valueOf(-0.08)
                        )
                )
        );

        PortfolioSummaryResponse created = portfolioService.createPortfolio(request);
        List<PortfolioSummaryResponse> userPortfolios = portfolioService.getPortfolios(501L);

        assertThat(created.portfolioId()).isNotNull();
        assertThat(created.userId()).isEqualTo(501L);
        assertThat(created.portfolioName()).isEqualTo("Generated Income Portfolio");
        assertThat(created.cashBalance()).isEqualByComparingTo("2500.00");
        assertThat(created.holdings()).hasSize(2);
        assertThat(userPortfolios)
                .extracting(PortfolioSummaryResponse::portfolioId)
                .contains(created.portfolioId());
        assertThat(userPortfolios)
                .extracting(PortfolioSummaryResponse::portfolioName)
                .contains("Generated Income Portfolio");
    }

    @Test
    void shouldReplaceHoldingsWhenUpdatingPortfolioAndDeletePortfolio() {
        PortfolioCreateRequest createRequest = new PortfolioCreateRequest(
                501L,
                "Editable Portfolio",
                "USD",
                "Growth",
                BigDecimal.valueOf(1000),
                List.of(
                        new PortfolioHoldingRequest(
                                "AAPL",
                                "Apple Inc.",
                                "Equity",
                                BigDecimal.valueOf(10),
                                BigDecimal.valueOf(170),
                                BigDecimal.valueOf(190),
                                BigDecimal.valueOf(1.2)
                        ),
                        new PortfolioHoldingRequest(
                                "MSFT",
                                "Microsoft Corp.",
                                "Equity",
                                BigDecimal.valueOf(5),
                                BigDecimal.valueOf(400),
                                BigDecimal.valueOf(420),
                                BigDecimal.valueOf(0.8)
                        )
                )
        );
        PortfolioSummaryResponse created = portfolioService.createPortfolio(createRequest);
        Long removedHoldingId = created.holdings().get(0).id();

        PortfolioCreateRequest updateRequest = new PortfolioCreateRequest(
                501L,
                "Updated Portfolio",
                "USD",
                "Balanced",
                BigDecimal.valueOf(2500),
                List.of(
                        new PortfolioHoldingRequest(
                                "SCHD",
                                "Schwab U.S. Dividend Equity ETF",
                                "ETF",
                                BigDecimal.valueOf(35),
                                BigDecimal.valueOf(75.50),
                                BigDecimal.valueOf(79.20),
                                BigDecimal.valueOf(0.25)
                        )
                )
        );

        PortfolioSummaryResponse updated = portfolioService.updatePortfolio(created.portfolioId(), updateRequest);

        assertThat(updated.portfolioId()).isEqualTo(created.portfolioId());
        assertThat(updated.portfolioName()).isEqualTo("Updated Portfolio");
        assertThat(updated.riskProfile()).isEqualTo("Balanced");
        assertThat(updated.cashBalance()).isEqualByComparingTo("2500.00");
        assertThat(updated.holdings()).hasSize(1);
        assertThat(updated.holdings().get(0).ticker()).isEqualTo("SCHD");
        assertThat(portfolioHoldingRepository.findById(removedHoldingId)).isEmpty();

        portfolioService.deletePortfolio(501L, created.portfolioId());

        assertThat(portfolioRepository.findById(created.portfolioId())).isEmpty();
    }
}
