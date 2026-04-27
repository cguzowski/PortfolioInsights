import { PortfolioHolding, PortfolioSummary } from '../../portfolio/models/portfolio';
import { HoldingClassification, OverviewPortfolioOption } from '../models/overview-portfolio';

export const DATABASE_PORTFOLIO_KEY = 'database-portfolio';

export const DEFAULT_HOLDING_CLASSIFICATIONS: Readonly<Record<string, HoldingClassification>> = {
  AAPL: { sector: 'Technology', geography: 'United States', currency: 'USD' },
  MSFT: { sector: 'Technology', geography: 'United States', currency: 'USD' },
  VTI: { sector: 'Broad Market Equity', geography: 'United States', currency: 'USD' },
  BND: { sector: 'Fixed Income', geography: 'United States', currency: 'USD' },
  GLD: { sector: 'Commodities', geography: 'Global', currency: 'USD' },
  JNJ: { sector: 'Healthcare', geography: 'United States', currency: 'USD' },
  KO: { sector: 'Consumer Staples', geography: 'United States', currency: 'USD' },
  SCHD: { sector: 'Dividend Equity', geography: 'United States', currency: 'USD' },
  LQD: { sector: 'Corporate Bonds', geography: 'United States', currency: 'USD' },
  VNQ: { sector: 'Real Estate', geography: 'United States', currency: 'USD' },
  NVDA: { sector: 'Semiconductors', geography: 'United States', currency: 'USD' },
  ASML: { sector: 'Semiconductors', geography: 'Netherlands', currency: 'EUR' },
  TSM: { sector: 'Semiconductors', geography: 'Taiwan', currency: 'TWD' },
  MELI: { sector: 'E-Commerce', geography: 'Latin America', currency: 'USD' },
  BTC: { sector: 'Digital Asset', geography: 'Global', currency: 'USD' }
};

type ClassifiableHolding = Pick<PortfolioHolding, 'ticker'> & Partial<HoldingClassification>;

export function databasePortfolioKey(portfolioId: number): string {
  return `${DATABASE_PORTFOLIO_KEY}-${portfolioId}`;
}

export function toDatabasePortfolioOption(summary: PortfolioSummary): OverviewPortfolioOption {
  return {
    key: databasePortfolioKey(summary.portfolioId),
    label: `${summary.portfolioName} (Database)`,
    source: 'database',
    summary,
    classifications: buildClassifications(summary.holdings)
  };
}

export function buildClassifications(
  holdings: readonly ClassifiableHolding[]
): Readonly<Record<string, HoldingClassification>> {
  const classifications: Record<string, HoldingClassification> = {};

  for (const holding of holdings) {
    const knownClassification = DEFAULT_HOLDING_CLASSIFICATIONS[holding.ticker];
    if (knownClassification) {
      classifications[holding.ticker] = knownClassification;
      continue;
    }

    if (hasEmbeddedClassification(holding)) {
      classifications[holding.ticker] = {
        sector: holding.sector,
        geography: holding.geography,
        currency: holding.currency
      };
      continue;
    }

    classifications[holding.ticker] = {
      sector: 'Unclassified',
      geography: 'Global',
      currency: 'USD'
    };
  }

  return classifications;
}

function hasEmbeddedClassification(holding: ClassifiableHolding): holding is ClassifiableHolding & HoldingClassification {
  return Boolean(holding.sector && holding.geography && holding.currency);
}
