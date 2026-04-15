package com.atlascapital.portfolio.repository;

import com.atlascapital.portfolio.entity.PortfolioHoldingEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PortfolioHoldingRepository extends JpaRepository<PortfolioHoldingEntity, Long> {
}
