package com.atlascapital.portfolio.repository;

import com.atlascapital.portfolio.entity.PortfolioEntity;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PortfolioRepository extends JpaRepository<PortfolioEntity, Long> {

    @EntityGraph(attributePaths = {"user", "holdings"})
    Optional<PortfolioEntity> findById(Long id);

    @EntityGraph(attributePaths = {"user", "holdings"})
    Optional<PortfolioEntity> findByIdAndUser_Id(Long id, Long userId);

    @EntityGraph(attributePaths = {"user", "holdings"})
    Optional<PortfolioEntity> findFirstByUser_IdOrderByIdAsc(Long userId);

    @EntityGraph(attributePaths = {"user", "holdings"})
    Optional<PortfolioEntity> findFirstByOrderByIdAsc();
}
