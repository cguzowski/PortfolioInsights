package com.atlascapital.portfolio.model;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "portfolio")
public class PortfolioEntity {

    @Id
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "portfolio_name", nullable = false, length = 120)
    private String portfolioName;

    @Column(name = "base_currency", nullable = false, length = 3)
    private String baseCurrency;

    @Column(name = "risk_profile", nullable = false, length = 30)
    private String riskProfile;

    @Column(name = "cash_balance", nullable = false, precision = 18, scale = 2)
    private BigDecimal cashBalance;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @OneToMany(mappedBy = "portfolio", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<PortfolioHoldingEntity> holdings = new ArrayList<>();

    public Long getId() {
        return id;
    }

    public Long getUserId() {
        return userId;
    }

    public String getPortfolioName() {
        return portfolioName;
    }

    public String getBaseCurrency() {
        return baseCurrency;
    }

    public String getRiskProfile() {
        return riskProfile;
    }

    public BigDecimal getCashBalance() {
        return cashBalance;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }

    public List<PortfolioHoldingEntity> getHoldings() {
        return holdings;
    }

    public void addHolding(PortfolioHoldingEntity holding) {
        holdings.add(holding);
        holding.setPortfolio(this);
    }

    public void removeHolding(PortfolioHoldingEntity holding) {
        holdings.remove(holding);
        holding.setPortfolio(null);
    }
}
