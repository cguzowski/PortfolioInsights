INSERT INTO portfolio (id, user_id, portfolio_name, base_currency, risk_profile, cash_balance)
VALUES (1001, 501, 'Global Multi-Asset Portfolio', 'USD', 'Moderate', 128450.35);

INSERT INTO portfolio_holding (id, portfolio_id, ticker, security_name, asset_class, quantity, average_cost, current_price, change_percent)
VALUES
    (101, 1001, 'AAPL', 'Apple Inc.', 'Equity', 145.0000, 172.1500, 198.4200, 1.2400),
    (102, 1001, 'MSFT', 'Microsoft Corp.', 'Equity', 92.0000, 388.7600, 421.8800, 0.7600),
    (103, 1001, 'VTI', 'Vanguard Total Stock Market ETF', 'ETF', 210.0000, 243.1000, 271.3400, 0.3800),
    (104, 1001, 'BND', 'Vanguard Total Bond Market ETF', 'Bond', 530.0000, 71.4200, 73.1100, -0.1200),
    (105, 1001, 'GLD', 'SPDR Gold Shares', 'Alternative', 85.0000, 189.5500, 214.6700, 0.5700);

ALTER TABLE portfolio ALTER COLUMN id RESTART WITH 1002;
ALTER TABLE portfolio_holding ALTER COLUMN id RESTART WITH 106;
