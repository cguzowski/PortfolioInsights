import { Allocation, PortfolioHolding } from '../../portfolio/models/portfolio';
import { buildClassifications } from '../mappers/overview-portfolio.mapper';
import { HoldingClassification, OverviewPortfolioOption } from '../models/overview-portfolio';

export type { HoldingClassification, OverviewPortfolioOption, PortfolioSourceType } from '../models/overview-portfolio';
export {
  DATABASE_PORTFOLIO_KEY,
  DEFAULT_HOLDING_CLASSIFICATIONS,
  databasePortfolioKey,
  toDatabasePortfolioOption
} from '../mappers/overview-portfolio.mapper';

interface MockHoldingSeed extends HoldingClassification {
  ticker: string;
  name: string;
  assetClass: string;
  quantity: number;
  averageCost: number;
  currentPrice: number;
  changePercent: number;
}

interface MockPortfolioSeed {
  key: string;
  label: string;
  portfolioId: number;
  userId: number;
  userName: string;
  portfolioName: string;
  baseCurrency: string;
  cashBalance: number;
  riskProfile: string;
  holdings: readonly MockHoldingSeed[];
}

const mockPortfolioSeeds: readonly MockPortfolioSeed[] = [
  {
    key: 'mock-income-shield',
    label: 'Income Shield (Mock)',
    portfolioId: 7101,
    userId: 501,
    userName: 'Atlas User',
    portfolioName: 'Income Shield Portfolio',
    baseCurrency: 'USD',
    cashBalance: 96500,
    riskProfile: 'Conservative',
    holdings: [
      {
        ticker: 'JNJ',
        name: 'Johnson & Johnson',
        assetClass: 'Equity',
        quantity: 120,
        averageCost: 150.8,
        currentPrice: 157.4,
        changePercent: 0.32,
        sector: 'Healthcare',
        geography: 'United States',
        currency: 'USD'
      },
      {
        ticker: 'KO',
        name: 'Coca-Cola Co.',
        assetClass: 'Equity',
        quantity: 275,
        averageCost: 59.1,
        currentPrice: 63.4,
        changePercent: 0.21,
        sector: 'Consumer Staples',
        geography: 'United States',
        currency: 'USD'
      },
      {
        ticker: 'SCHD',
        name: 'Schwab U.S. Dividend Equity ETF',
        assetClass: 'ETF',
        quantity: 360,
        averageCost: 72.5,
        currentPrice: 78.6,
        changePercent: 0.18,
        sector: 'Dividend Equity',
        geography: 'United States',
        currency: 'USD'
      },
      {
        ticker: 'LQD',
        name: 'iShares iBoxx $ Investment Grade Corporate Bond ETF',
        assetClass: 'Bond',
        quantity: 405,
        averageCost: 104.3,
        currentPrice: 108.2,
        changePercent: -0.08,
        sector: 'Corporate Bonds',
        geography: 'United States',
        currency: 'USD'
      },
      {
        ticker: 'VNQ',
        name: 'Vanguard Real Estate ETF',
        assetClass: 'REIT',
        quantity: 170,
        averageCost: 84.5,
        currentPrice: 92.1,
        changePercent: 0.11,
        sector: 'Real Estate',
        geography: 'United States',
        currency: 'USD'
      }
    ]
  },
  {
    key: 'mock-global-growth',
    label: 'Global Growth Sprint (Mock)',
    portfolioId: 7102,
    userId: 501,
    userName: 'Atlas User',
    portfolioName: 'Global Growth Sprint',
    baseCurrency: 'USD',
    cashBalance: 51200,
    riskProfile: 'Aggressive',
    holdings: [
      {
        ticker: 'NVDA',
        name: 'NVIDIA Corp.',
        assetClass: 'Equity',
        quantity: 95,
        averageCost: 844.8,
        currentPrice: 941.6,
        changePercent: 1.42,
        sector: 'Semiconductors',
        geography: 'United States',
        currency: 'USD'
      },
      {
        ticker: 'ASML',
        name: 'ASML Holding N.V.',
        assetClass: 'Equity',
        quantity: 54,
        averageCost: 895.4,
        currentPrice: 1031.2,
        changePercent: 0.86,
        sector: 'Semiconductors',
        geography: 'Netherlands',
        currency: 'EUR'
      },
      {
        ticker: 'TSM',
        name: 'Taiwan Semiconductor Manufacturing Co.',
        assetClass: 'Equity',
        quantity: 180,
        averageCost: 127.1,
        currentPrice: 149.7,
        changePercent: 0.91,
        sector: 'Semiconductors',
        geography: 'Taiwan',
        currency: 'TWD'
      },
      {
        ticker: 'MELI',
        name: 'MercadoLibre Inc.',
        assetClass: 'Equity',
        quantity: 22,
        averageCost: 1394.2,
        currentPrice: 1668.5,
        changePercent: 1.03,
        sector: 'E-Commerce',
        geography: 'Latin America',
        currency: 'USD'
      },
      {
        ticker: 'BTC',
        name: 'Bitcoin Position',
        assetClass: 'Alternative',
        quantity: 1.8,
        averageCost: 52250,
        currentPrice: 64880,
        changePercent: 2.35,
        sector: 'Digital Asset',
        geography: 'Global',
        currency: 'USD'
      }
    ]
  }
];

export const MOCK_OVERVIEW_PORTFOLIOS: readonly OverviewPortfolioOption[] = mockPortfolioSeeds.map((seed) =>
  buildMockPortfolio(seed)
);

function buildMockPortfolio(seed: MockPortfolioSeed): OverviewPortfolioOption {
  const holdings = seed.holdings.map((holding, index) => {
    const marketValue = roundCurrency(holding.quantity * holding.currentPrice);
    const totalCost = roundCurrency(holding.quantity * holding.averageCost);
    const weight = 0;
    return {
      id: seed.portfolioId * 100 + index + 1,
      ticker: holding.ticker,
      name: holding.name,
      assetClass: holding.assetClass,
      quantity: holding.quantity,
      averageCost: holding.averageCost,
      currentPrice: holding.currentPrice,
      changePercent: holding.changePercent,
      marketValue,
      weight,
      __totalCost: totalCost
    };
  });

  const holdingsValue = holdings.reduce((sum, holding) => sum + holding.marketValue, 0);
  const normalizedHoldings = holdings.map((holding) => ({
    id: holding.id,
    ticker: holding.ticker,
    name: holding.name,
    assetClass: holding.assetClass,
    quantity: holding.quantity,
    averageCost: holding.averageCost,
    currentPrice: holding.currentPrice,
    changePercent: holding.changePercent,
    marketValue: holding.marketValue,
    weight: holdingsValue > 0 ? roundPercent((holding.marketValue / holdingsValue) * 100) : 0
  }));

  const totalCost = holdings.reduce((sum, holding) => sum + holding.__totalCost, 0);
  const totalValue = roundCurrency(holdingsValue + seed.cashBalance);
  const totalPnl = roundCurrency(holdingsValue - totalCost);
  const dailyPnl = roundCurrency(
    normalizedHoldings.reduce(
      (sum, holding) => sum + holding.marketValue * (holding.changePercent / 100),
      0
    )
  );
  const totalPnlPercent = totalCost > 0 ? roundPercent((totalPnl / totalCost) * 100) : 0;
  const dailyPnlPercent = holdingsValue > 0 ? roundPercent((dailyPnl / holdingsValue) * 100) : 0;

  return {
    key: seed.key,
    label: seed.label,
    source: 'mock',
    summary: {
      portfolioId: seed.portfolioId,
      userId: seed.userId,
      userName: seed.userName,
      portfolioName: seed.portfolioName,
      baseCurrency: seed.baseCurrency,
      totalValue,
      totalCost: roundCurrency(totalCost),
      dailyPnl,
      dailyPnlPercent,
      totalPnl,
      totalPnlPercent,
      cashBalance: seed.cashBalance,
      riskProfile: seed.riskProfile,
      lastUpdated: new Date().toISOString(),
      allocations: buildAssetClassAllocations(normalizedHoldings),
      holdings: normalizedHoldings
    },
    classifications: buildClassifications(seed.holdings)
  };
}

function buildAssetClassAllocations(holdings: readonly PortfolioHolding[]): Allocation[] {
  const totals = new Map<string, number>();
  const holdingsTotal = holdings.reduce((sum, holding) => sum + holding.marketValue, 0);

  for (const holding of holdings) {
    totals.set(holding.assetClass, (totals.get(holding.assetClass) ?? 0) + holding.marketValue);
  }

  return [...totals.entries()]
    .map(([assetClass, value]) => ({
      assetClass,
      percentage: holdingsTotal > 0 ? roundPercent((value / holdingsTotal) * 100) : 0
    }))
    .sort((a, b) => b.percentage - a.percentage);
}

function roundCurrency(value: number): number {
  return roundTo(value, 2);
}

function roundPercent(value: number): number {
  return roundTo(value, 2);
}

function roundTo(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}
