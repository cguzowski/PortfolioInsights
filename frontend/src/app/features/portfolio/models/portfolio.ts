export interface PortfolioHolding {
  id: number;
  ticker: string;
  name: string;
  assetClass: string;
  quantity: number;
  averageCost: number;
  currentPrice: number;
  changePercent: number;
  marketValue: number;
  weight: number;
}

export interface Allocation {
  assetClass: string;
  percentage: number;
}

export interface PortfolioSummary {
  portfolioId: number;
  userId: number;
  userName: string;
  portfolioName: string;
  baseCurrency: string;
  totalValue: number;
  totalCost: number;
  dailyPnl: number;
  dailyPnlPercent: number;
  totalPnl: number;
  totalPnlPercent: number;
  cashBalance: number;
  riskProfile: string;
  lastUpdated: string;
  allocations: Allocation[];
  holdings: PortfolioHolding[];
}

export interface PortfolioHoldingPayload {
  ticker: string;
  name: string;
  assetClass: string;
  quantity: number;
  averageCost: number;
  currentPrice: number;
  changePercent: number;
}
