import { computed, Injectable, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';

import {
  DATABASE_PORTFOLIO_KEY,
  databasePortfolioKey,
  toDatabasePortfolioOption
} from '../mappers/overview-portfolio.mapper';
import { MOCK_OVERVIEW_PORTFOLIOS } from '../data/overview-portfolios';
import { OverviewPortfolioOption } from '../models/overview-portfolio';
import { PortfolioSummary } from '../../portfolio/models/portfolio';
import { PortfolioService } from '../../portfolio/services/portfolio.service';

@Injectable({
  providedIn: 'root'
})
export class WorkspacePortfolioContextService {
  private readonly portfolioService = inject(PortfolioService);
  private readonly databasePortfolioOptions = signal<readonly OverviewPortfolioOption[]>([]);

  readonly databasePortfolioLoading = signal(false);
  readonly databasePortfolioError = signal('');
  readonly selectedPortfolioKey = signal(DATABASE_PORTFOLIO_KEY);

  readonly portfolioOptions = computed<readonly OverviewPortfolioOption[]>(() => {
    return [...this.databasePortfolioOptions(), ...MOCK_OVERVIEW_PORTFOLIOS];
  });

  readonly selectedPortfolio = computed<OverviewPortfolioOption>(() => {
    const options = this.portfolioOptions();
    return options.find((option) => option.key === this.selectedPortfolioKey()) ?? options[0];
  });

  readonly selectedSummary = computed(() => this.selectedPortfolio().summary);

  readonly selectedSourceLabel = computed(() =>
    this.selectedPortfolio().source === 'database' ? 'Live database portfolio' : 'Mock portfolio'
  );

  readonly greetingName = computed(() => {
    const normalizedParts = this.selectedSummary().userName
      .split(' ')
      .map((part) => part.trim())
      .filter((part) => part.length > 0);

    if (!normalizedParts.length) {
      return 'Atlas User';
    }

    return normalizedParts.slice(0, 2).join(' ');
  });

  constructor() {
    this.loadDatabasePortfolio();
  }

  setSelectedPortfolio(portfolioKey: string): void {
    this.selectedPortfolioKey.set(portfolioKey);
    this.ensureSelectionIsValid();
  }

  retryDatabaseLoad(): void {
    this.loadDatabasePortfolio();
  }

  registerDatabasePortfolio(portfolioSummary: Parameters<typeof toDatabasePortfolioOption>[0]): string {
    const portfolioKey = this.upsertDatabasePortfolio(portfolioSummary);
    this.selectedPortfolioKey.set(portfolioKey);
    return portfolioKey;
  }

  removeDatabasePortfolio(portfolioId: number): void {
    const portfolioKey = databasePortfolioKey(portfolioId);
    this.databasePortfolioOptions.update((options) => options.filter((option) => option.key !== portfolioKey));
    this.ensureSelectionIsValid();
  }

  private loadDatabasePortfolio(): void {
    this.databasePortfolioLoading.set(true);
    this.databasePortfolioError.set('');

    this.portfolioService
      .getPortfolios()
      .pipe(finalize(() => this.databasePortfolioLoading.set(false)))
      .subscribe({
        next: (portfolioSummaries) => {
          this.databasePortfolioOptions.set(portfolioSummaries.map((summary) => toDatabasePortfolioOption(summary)));
          this.ensureSelectionIsValid();
        },
        error: () => {
          this.databasePortfolioOptions.set([]);
          this.databasePortfolioError.set('Database portfolio unavailable. Showing mock portfolios.');
          this.ensureSelectionIsValid();
        }
      });
  }

  private upsertDatabasePortfolio(portfolioSummary: PortfolioSummary): string {
    const portfolioOption = toDatabasePortfolioOption(portfolioSummary);
    this.databasePortfolioOptions.update((options) => [
      portfolioOption,
      ...options.filter((option) => option.key !== portfolioOption.key)
    ]);

    return portfolioOption.key;
  }

  private ensureSelectionIsValid(): void {
    const options = this.portfolioOptions();
    if (!options.length) {
      return;
    }

    if (options.some((option) => option.key === this.selectedPortfolioKey())) {
      return;
    }

    this.selectedPortfolioKey.set(options[0].key);
  }
}
