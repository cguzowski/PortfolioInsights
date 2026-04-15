package com.atlascapital.portfolio.repository;

import com.atlascapital.portfolio.entity.PortfolioHoldingEntity;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PortfolioHoldingRepository extends JpaRepository<PortfolioHoldingEntity, Long> {

    @EntityGraph(attributePaths = {"portfolio", "portfolio.user", "portfolio.holdings"})
    Optional<PortfolioHoldingEntity> findById(Long id);

    @EntityGraph(attributePaths = {"portfolio", "portfolio.user", "portfolio.holdings"})
    Optional<PortfolioHoldingEntity> findByIdAndPortfolio_Id(Long id, Long portfolioId);

    @EntityGraph(attributePaths = {"portfolio", "portfolio.user", "portfolio.holdings"})
    Optional<PortfolioHoldingEntity> findByIdAndPortfolio_IdAndPortfolio_User_Id(Long id, Long portfolioId, Long userId);
}
