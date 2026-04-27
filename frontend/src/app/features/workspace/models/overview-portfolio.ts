import { PortfolioSummary } from '../../portfolio/models/portfolio';

export type PortfolioSourceType = 'database' | 'mock';

export interface HoldingClassification {
  sector: string;
  geography: string;
  currency: string;
}

export interface OverviewPortfolioOption {
  key: string;
  label: string;
  source: PortfolioSourceType;
  summary: PortfolioSummary;
  classifications: Readonly<Record<string, HoldingClassification>>;
}
