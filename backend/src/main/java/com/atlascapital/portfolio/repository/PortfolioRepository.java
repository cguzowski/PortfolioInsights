package com.atlascapital.portfolio.repository;

import com.atlascapital.portfolio.entity.PortfolioEntity;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PortfolioRepository extends JpaRepository<PortfolioEntity, Long> {

    @EntityGraph(attributePaths = "holdings")
    Optional<PortfolioEntity> findById(Long id);
}
