import { CurrencyPipe, DatePipe, PercentPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { finalize, map } from 'rxjs';

import { DEFAULT_FEATURE_PAGE, findFeaturePageById } from '../../data/workspace-pages';
import { HoldingClassification, OverviewPortfolioOption } from '../../data/overview-portfolios';
import { WorkspaceFeatureCard, WorkspacePage } from '../../models/workspace-page';
import { WorkspacePortfolioContextService } from '../../services/workspace-portfolio-context.service';
import {
  PortfolioCreatePayload,
  PortfolioHolding,
  PortfolioHoldingPayload,
  PortfolioSummary
} from '../../../portfolio/models/portfolio';
import { PortfolioService } from '../../../portfolio/services/portfolio.service';
import { AiCopilotService } from '../../../../shared/ai-copilot/services/ai-copilot.service';

type AllocationView = 'asset' | 'sector' | 'assetClass' | 'geography' | 'currency';
type PortfolioManagerTab = 'manual' | 'generator';
type DraftRowField =
  | 'ticker'
  | 'name'
  | 'assetClass'
  | 'sector'
  | 'quantity'
  | 'averageCost'
  | 'currentPrice'
  | 'changePercent';
type GeneratorStrategy = 'random' | 'balanced' | 'growth' | 'income' | 'defensive' | 'inflation';

interface AllocationTab {
  id: AllocationView;
  label: string;
}

interface AllocationSlice {
  label: string;
  value: number;
  percentage: number;
  color: string;
}

interface PortfolioManagerTabOption {
  id: PortfolioManagerTab;
  label: string;
  hint: string;
}

interface DraftHoldingRow {
  id: number;
  ticker: string;
  name: string;
  assetClass: string;
  sector: string;
  quantity: number;
  averageCost: number;
  currentPrice: number;
  changePercent: number;
}

interface GeneratorStrategyOption {
  id: GeneratorStrategy;
  label: string;
}

interface GeneratorAsset {
  ticker: string;
  name: string;
  assetClass: string;
  sector: string;
  basePrice: number;
  strategies: readonly GeneratorStrategy[];
}

const OVERVIEW_PAGE_ID = 'portfolio-overview-dashboard';
const PORTFOLIO_MANAGER_PAGE_ID = 'portfolio-input-generator';
const NEW_PORTFOLIO_KEY = 'new-portfolio';

const ASSET_CLASSES: readonly string[] = ['Equity', 'ETF', 'Bond', 'REIT', 'Commodity', 'Alternative', 'Cash'];
const RISK_PROFILES: readonly string[] = ['Conservative', 'Moderate', 'Balanced', 'Growth', 'Aggressive'];

const ALLOCATION_TABS: readonly AllocationTab[] = [
  { id: 'asset', label: 'By Asset' },
  { id: 'sector', label: 'By Sector' },
  { id: 'assetClass', label: 'By Asset Class' },
  { id: 'geography', label: 'By Geography' },
  { id: 'currency', label: 'By Currency' }
];

const PIE_COLORS: readonly string[] = [
  '#2c6a57',
  '#4b7f67',
  '#689578',
  '#82a869',
  '#be8d5f',
  '#8a7aa1',
  '#5e89ad',
  '#6f6262'
];

const PORTFOLIO_MANAGER_TABS: readonly PortfolioManagerTabOption[] = [
  { id: 'manual', label: 'Manual Input', hint: 'Create, edit, upload, and review rows' },
  { id: 'generator', label: 'Generator', hint: 'Populate rows from filtered rules' }
];

const GENERATOR_STRATEGIES: readonly GeneratorStrategyOption[] = [
  { id: 'random', label: 'Random' },
  { id: 'balanced', label: 'Balanced' },
  { id: 'growth', label: 'Aggressive Growth' },
  { id: 'income', label: 'Passive Income' },
  { id: 'defensive', label: 'Preserve Capital' },
  { id: 'inflation', label: 'Beat Inflation' }
];

const GENERATOR_ASSETS: readonly GeneratorAsset[] = [
  {
    ticker: 'AAPL',
    name: 'Apple Inc.',
    assetClass: 'Equity',
    sector: 'Technology',
    basePrice: 185,
    strategies: ['balanced', 'growth']
  },
  {
    ticker: 'MSFT',
    name: 'Microsoft Corp.',
    assetClass: 'Equity',
    sector: 'Technology',
    basePrice: 420,
    strategies: ['balanced', 'growth']
  },
  {
    ticker: 'NVDA',
    name: 'NVIDIA Corp.',
    assetClass: 'Equity',
    sector: 'Semiconductors',
    basePrice: 940,
    strategies: ['growth']
  },
  {
    ticker: 'TSM',
    name: 'Taiwan Semiconductor Manufacturing Co.',
    assetClass: 'Equity',
    sector: 'Semiconductors',
    basePrice: 150,
    strategies: ['growth']
  },
  {
    ticker: 'JNJ',
    name: 'Johnson & Johnson',
    assetClass: 'Equity',
    sector: 'Healthcare',
    basePrice: 157,
    strategies: ['balanced', 'defensive', 'income']
  },
  {
    ticker: 'PFE',
    name: 'Pfizer Inc.',
    assetClass: 'Equity',
    sector: 'Healthcare',
    basePrice: 28,
    strategies: ['defensive', 'income']
  },
  {
    ticker: 'KO',
    name: 'Coca-Cola Co.',
    assetClass: 'Equity',
    sector: 'Consumer Staples',
    basePrice: 63,
    strategies: ['defensive', 'income']
  },
  {
    ticker: 'PG',
    name: 'Procter & Gamble Co.',
    assetClass: 'Equity',
    sector: 'Consumer Staples',
    basePrice: 165,
    strategies: ['defensive', 'income']
  },
  {
    ticker: 'XOM',
    name: 'Exxon Mobil Corp.',
    assetClass: 'Equity',
    sector: 'Energy',
    basePrice: 118,
    strategies: ['income', 'inflation']
  },
  {
    ticker: 'COP',
    name: 'ConocoPhillips',
    assetClass: 'Equity',
    sector: 'Energy',
    basePrice: 125,
    strategies: ['growth', 'inflation']
  },
  {
    ticker: 'SCHD',
    name: 'Schwab U.S. Dividend Equity ETF',
    assetClass: 'ETF',
    sector: 'Dividend Equity',
    basePrice: 79,
    strategies: ['income', 'defensive']
  },
  {
    ticker: 'VTI',
    name: 'Vanguard Total Stock Market ETF',
    assetClass: 'ETF',
    sector: 'Broad Market Equity',
    basePrice: 258,
    strategies: ['balanced']
  },
  {
    ticker: 'BND',
    name: 'Vanguard Total Bond Market ETF',
    assetClass: 'Bond',
    sector: 'Fixed Income',
    basePrice: 73,
    strategies: ['balanced', 'defensive']
  },
  {
    ticker: 'LQD',
    name: 'iShares Investment Grade Corporate Bond ETF',
    assetClass: 'Bond',
    sector: 'Fixed Income',
    basePrice: 108,
    strategies: ['income', 'defensive']
  },
  {
    ticker: 'VNQ',
    name: 'Vanguard Real Estate ETF',
    assetClass: 'REIT',
    sector: 'Real Estate',
    basePrice: 92,
    strategies: ['income', 'inflation']
  },
  {
    ticker: 'GLD',
    name: 'SPDR Gold Shares',
    assetClass: 'Commodity',
    sector: 'Commodities',
    basePrice: 218,
    strategies: ['defensive', 'inflation']
  },
  {
    ticker: 'DBC',
    name: 'Invesco DB Commodity Index Tracking Fund',
    assetClass: 'Commodity',
    sector: 'Commodities',
    basePrice: 23,
    strategies: ['inflation']
  },
  {
    ticker: 'BTC',
    name: 'Bitcoin Position',
    assetClass: 'Alternative',
    sector: 'Digital Asset',
    basePrice: 64880,
    strategies: ['growth', 'inflation']
  }
];

const GENERATOR_SECTORS: readonly string[] = [...new Set(GENERATOR_ASSETS.map((asset) => asset.sector))].sort();

@Component({
  selector: 'app-workspace-feature-page',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, FormsModule, PercentPipe],
  templateUrl: './workspace-feature.page.html',
  styleUrl: './workspace-feature.page.css'
})
export class WorkspaceFeaturePageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly aiCopilot = inject(AiCopilotService);
  private readonly portfolioService = inject(PortfolioService);
  protected readonly portfolioContext = inject(WorkspacePortfolioContextService);

  private readonly pageId = toSignal(
    this.route.data.pipe(map((routeData) => String(routeData['pageId'] ?? DEFAULT_FEATURE_PAGE.id))),
    {
      initialValue: DEFAULT_FEATURE_PAGE.id
    }
  );

  protected readonly page = computed<WorkspacePage>(() => {
    return findFeaturePageById(this.pageId()) ?? DEFAULT_FEATURE_PAGE;
  });

  protected readonly isOverviewPage = computed(() => this.page().id === OVERVIEW_PAGE_ID);
  protected readonly isPortfolioManagerPage = computed(() => this.page().id === PORTFOLIO_MANAGER_PAGE_ID);
  protected readonly allocationTabs = ALLOCATION_TABS;
  protected readonly assetClasses = ASSET_CLASSES;
  protected readonly riskProfiles = RISK_PROFILES;
  protected readonly portfolioManagerTabs = PORTFOLIO_MANAGER_TABS;
  protected readonly generatorStrategies = GENERATOR_STRATEGIES;
  protected readonly generatorSectors = GENERATOR_SECTORS;
  protected readonly newPortfolioKey = NEW_PORTFOLIO_KEY;
  protected readonly selectedAllocationView = signal<AllocationView>('assetClass');
  protected readonly selectedManagerTab = signal<PortfolioManagerTab>('manual');
  protected readonly selectedManagedPortfolioKey = signal(NEW_PORTFOLIO_KEY);
  protected readonly selectedManagedPortfolioOption = computed<OverviewPortfolioOption | null>(() => {
    const selectedKey = this.selectedManagedPortfolioKey();
    return this.portfolioContext.portfolioOptions().find((option) => option.key === selectedKey) ?? null;
  });
  protected readonly isManagedDatabasePortfolio = computed(
    () => this.selectedManagedPortfolioOption()?.source === 'database'
  );
  protected readonly portfolioSaveActionLabel = computed(() =>
    this.isManagedDatabasePortfolio() ? 'Update Portfolio' : 'Submit Portfolio'
  );
  protected readonly portfolioSavingLabel = computed(() =>
    this.isManagedDatabasePortfolio() ? 'Updating...' : 'Submitting...'
  );
  protected readonly draftPortfolioName = signal('New Portfolio Draft');
  protected readonly draftBaseCurrency = signal('USD');
  protected readonly draftCashBalance = signal(0);
  protected readonly draftRiskProfile = signal('Moderate');
  protected readonly draftRows = signal<readonly DraftHoldingRow[]>([]);
  protected readonly uploadStatus = signal('');
  protected readonly managerStatus = signal('');
  protected readonly portfolioSaving = signal(false);
  protected readonly portfolioDeleting = signal(false);
  protected readonly generatorStrategy = signal<GeneratorStrategy>('random');
  protected readonly generatorAssetCount = signal(8);
  protected readonly generatorPortfolioValue = signal(100000);
  protected readonly selectedGeneratorSectors = signal<readonly string[]>([]);
  protected readonly selectedOverviewSummary = computed(() => this.portfolioContext.selectedSummary());
  protected readonly selectedOverviewSourceLabel = computed(() => this.portfolioContext.selectedSourceLabel());
  protected readonly draftRowsTotal = computed(() =>
    roundCurrency(this.draftRows().reduce((sum, row) => sum + this.marketValue(row), 0))
  );

  protected readonly selectedAllocationLabel = computed(() => {
    return ALLOCATION_TABS.find((tab) => tab.id === this.selectedAllocationView())?.label ?? 'By Asset Class';
  });

  protected readonly overviewAllocationCard = computed<WorkspaceFeatureCard | null>(() => {
    if (!this.isOverviewPage()) {
      return null;
    }

    return this.page().cards.find((card) => card.title === 'Allocation Breakdown') ?? null;
  });

  protected readonly overviewSupportingCards = computed<readonly WorkspaceFeatureCard[]>(() => {
    if (!this.isOverviewPage()) {
      return this.page().cards;
    }

    return this.page().cards.filter((card) => card.title !== 'Allocation Breakdown');
  });

  protected readonly allocationSlices = computed<readonly AllocationSlice[]>(() => {
    if (!this.isOverviewPage()) {
      return [];
    }

    const selectedPortfolio = this.portfolioContext.selectedPortfolio();
    const holdings = selectedPortfolio.summary.holdings;
    const holdingsTotal = holdings.reduce((sum, holding) => sum + holding.marketValue, 0);

    if (holdingsTotal <= 0) {
      return [];
    }

    const groupedValues = new Map<string, number>();

    for (const holding of holdings) {
      const label = this.resolveAllocationLabel(
        this.selectedAllocationView(),
        holding,
        selectedPortfolio.classifications,
        selectedPortfolio.summary.baseCurrency
      );
      groupedValues.set(label, (groupedValues.get(label) ?? 0) + holding.marketValue);
    }

    return [...groupedValues.entries()]
      .map(([label, value], index) => ({
        label,
        value: roundTo(value, 2),
        percentage: roundTo((value / holdingsTotal) * 100, 2),
        color: PIE_COLORS[index % PIE_COLORS.length]
      }))
      .sort((left, right) => right.value - left.value);
  });

  protected readonly allocationPieGradient = computed(() => {
    const slices = this.allocationSlices();

    if (!slices.length) {
      return 'conic-gradient(#d7ddd4 0% 100%)';
    }

    const totalValue = slices.reduce((sum, slice) => sum + slice.value, 0);
    let currentStop = 0;
    const segments = slices.map((slice) => {
      const slicePercent = totalValue > 0 ? (slice.value / totalValue) * 100 : 0;
      const start = currentStop;
      currentStop += slicePercent;
      return `${slice.color} ${start.toFixed(2)}% ${currentStop.toFixed(2)}%`;
    });

    return `conic-gradient(${segments.join(', ')})`;
  });

  protected openChatPrompt(prompt: string): void {
    this.aiCopilot.openWithPrompt(prompt);
  }

  protected selectAllocationView(view: AllocationView): void {
    this.selectedAllocationView.set(view);
  }

  protected selectManagerTab(tab: PortfolioManagerTab): void {
    this.selectedManagerTab.set(tab);
  }

  protected selectManagedPortfolio(portfolioKey: string): void {
    this.selectedManagedPortfolioKey.set(portfolioKey);
    this.uploadStatus.set('');
    this.managerStatus.set('');

    if (portfolioKey === NEW_PORTFOLIO_KEY) {
      this.resetDraftPortfolio();
      return;
    }

    const selectedOption = this.portfolioContext.portfolioOptions().find((option) => option.key === portfolioKey);
    if (selectedOption) {
      this.loadManagedPortfolio(selectedOption);
    }
  }

  protected addDraftRow(): void {
    this.draftRows.update((rows) => [...rows, this.createEmptyDraftRow()]);
    this.managerStatus.set('');
  }

  protected duplicateDraftRow(row: DraftHoldingRow): void {
    this.draftRows.update((rows) => [
      ...rows,
      {
        ...row,
        id: this.nextDraftRowId(),
        ticker: row.ticker ? `${row.ticker}2` : '',
        name: row.name ? `${row.name} Copy` : ''
      }
    ]);
    this.managerStatus.set('');
  }

  protected deleteDraftRow(rowId: number): void {
    this.draftRows.update((rows) => rows.filter((row) => row.id !== rowId));
    this.managerStatus.set('');
  }

  protected clearDraftRows(): void {
    this.draftRows.set([]);
    this.uploadStatus.set('');
    this.managerStatus.set('Draft rows cleared.');
  }

  protected updateDraftRow(rowId: number, field: DraftRowField, value: string | number): void {
    this.draftRows.update((rows) =>
      rows.map((row) => {
        if (row.id !== rowId) {
          return row;
        }

        if (field === 'quantity' || field === 'averageCost' || field === 'currentPrice' || field === 'changePercent') {
          return { ...row, [field]: this.toFiniteNumber(value) };
        }

        if (field === 'ticker') {
          return { ...row, ticker: String(value).trim().toUpperCase() };
        }

        return { ...row, [field]: String(value) };
      })
    );
    this.managerStatus.set('');
  }

  protected marketValue(row: DraftHoldingRow): number {
    return roundCurrency(row.quantity * row.currentPrice);
  }

  protected rowWeight(row: DraftHoldingRow): number {
    const total = this.draftRowsTotal();
    return total > 0 ? this.marketValue(row) / total : 0;
  }

  protected handlePortfolioFileUpload(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const rows = this.parseUploadedRows(String(reader.result ?? ''), file.name);
        if (!rows.length) {
          this.uploadStatus.set('No valid holdings were found in that file.');
          return;
        }

        this.draftRows.set(rows);
        this.selectedManagerTab.set('manual');
        this.uploadStatus.set(`${rows.length} rows loaded from ${file.name}.`);
        this.managerStatus.set('');
      } catch (error) {
        this.uploadStatus.set(error instanceof Error ? error.message : 'Unable to parse that portfolio file.');
      } finally {
        if (input) {
          input.value = '';
        }
      }
    };
    reader.readAsText(file);
  }

  protected toggleGeneratorSector(sector: string, event: Event): void {
    const checked = (event.target as HTMLInputElement | null)?.checked ?? false;
    this.selectedGeneratorSectors.update((selectedSectors) => {
      if (checked) {
        return selectedSectors.includes(sector) ? selectedSectors : [...selectedSectors, sector];
      }

      return selectedSectors.filter((selectedSector) => selectedSector !== sector);
    });
  }

  protected setGeneratorAssetCount(value: string | number): void {
    this.generatorAssetCount.set(clamp(Math.round(this.toFiniteNumber(value)), 1, 30));
  }

  protected setGeneratorPortfolioValue(value: string | number): void {
    this.generatorPortfolioValue.set(clamp(this.toFiniteNumber(value), 1000, 10000000));
  }

  protected setGeneratorStrategy(strategy: GeneratorStrategy): void {
    this.generatorStrategy.set(strategy);
  }

  protected generatePortfolioRows(): void {
    const selectedSectors = this.selectedGeneratorSectors();
    const sectorCandidates = selectedSectors.length
      ? GENERATOR_ASSETS.filter((asset) => selectedSectors.includes(asset.sector))
      : GENERATOR_ASSETS;
    const strategy = this.generatorStrategy();
    const strategyCandidates =
      strategy === 'random'
        ? sectorCandidates
        : sectorCandidates.filter((asset) => asset.strategies.includes(strategy));
    const candidates = strategyCandidates.length ? strategyCandidates : sectorCandidates;
    const assetCount = Math.min(this.generatorAssetCount(), candidates.length);
    const totalValue = clamp(this.generatorPortfolioValue(), 1000, 10000000);
    const selectedAssets = this.pickRandomAssets(candidates, assetCount);
    const weights = this.randomWeights(selectedAssets.length);

    const generatedRows = selectedAssets.map((asset, index) => {
      const allocatedValue = totalValue * weights[index];
      const currentPrice = roundCurrency(asset.basePrice * this.randomBetween(0.92, 1.08));
      const averageCost = roundCurrency(currentPrice * this.randomBetween(0.9, 1.06));

      return {
        id: this.nextDraftRowId(),
        ticker: asset.ticker,
        name: asset.name,
        assetClass: asset.assetClass,
        sector: asset.sector,
        quantity: roundTo(allocatedValue / currentPrice, 4),
        averageCost,
        currentPrice,
        changePercent: roundTo(this.randomBetween(-2.4, 2.4), 2)
      };
    });

    this.draftRows.set(generatedRows);
    this.selectedManagerTab.set('manual');
    this.uploadStatus.set('');
    this.managerStatus.set(
      `Generated ${generatedRows.length} editable rows for ${this.draftPortfolioName()} using safe limits.`
    );
  }

  protected savePortfolio(): void {
    const validRows = this.draftRows().filter((row) => row.ticker && row.name && row.quantity > 0 && row.currentPrice > 0);

    if (!validRows.length) {
      this.managerStatus.set('Add at least one valid row before saving a portfolio.');
      return;
    }

    const selectedOption = this.selectedManagedPortfolioOption();
    const payload = this.toPortfolioCreatePayload(validRows);

    if (selectedOption?.source === 'database') {
      this.updateManagedPortfolio(selectedOption, validRows, payload);
      return;
    }

    this.createManagedPortfolio(validRows, payload);
  }

  protected deleteManagedPortfolio(): void {
    const selectedOption = this.selectedManagedPortfolioOption();

    if (!selectedOption || selectedOption.source !== 'database') {
      this.managerStatus.set('Select a database portfolio before deleting.');
      return;
    }

    if (!window.confirm(this.buildDeleteConfirmation(selectedOption))) {
      this.managerStatus.set('Portfolio delete canceled.');
      return;
    }

    this.portfolioDeleting.set(true);
    this.managerStatus.set('');

    this.portfolioService
      .deletePortfolio(selectedOption.summary.portfolioId, selectedOption.summary.userId)
      .pipe(finalize(() => this.portfolioDeleting.set(false)))
      .subscribe({
        next: () => {
          const deletedPortfolioName = selectedOption.summary.portfolioName;
          this.portfolioContext.removeDatabasePortfolio(selectedOption.summary.portfolioId);
          this.selectedManagedPortfolioKey.set(NEW_PORTFOLIO_KEY);
          this.resetDraftPortfolio();
          this.managerStatus.set(`${deletedPortfolioName} deleted from the database.`);
        },
        error: () => {
          this.managerStatus.set('Unable to delete portfolio. Confirm the API is running and the portfolio still exists.');
        }
      });
  }

  private createManagedPortfolio(
    validRows: readonly DraftHoldingRow[],
    payload: PortfolioCreatePayload
  ): void {
    this.draftRows.set(validRows);
    this.portfolioSaving.set(true);
    this.managerStatus.set('');

    this.portfolioService
      .createPortfolio(payload)
      .pipe(finalize(() => this.portfolioSaving.set(false)))
      .subscribe({
        next: (createdPortfolio) => {
          const createdPortfolioKey = this.portfolioContext.registerDatabasePortfolio(createdPortfolio);
          this.selectedManagedPortfolioKey.set(createdPortfolioKey);
          this.syncDraftWithPortfolioSummary(createdPortfolio);
          this.managerStatus.set(
            `${createdPortfolio.portfolioName} created in the database with ${createdPortfolio.holdings.length} positions.`
          );
        },
        error: () => {
          this.managerStatus.set('Unable to create portfolio. Confirm the API is running and the selected user exists.');
        }
      });
  }

  private updateManagedPortfolio(
    selectedOption: OverviewPortfolioOption,
    validRows: readonly DraftHoldingRow[],
    payload: PortfolioCreatePayload
  ): void {
    if (!window.confirm(this.buildUpdateConfirmation(selectedOption, validRows))) {
      this.managerStatus.set('Portfolio update canceled.');
      return;
    }

    this.draftRows.set(validRows);
    this.portfolioSaving.set(true);
    this.managerStatus.set('');

    this.portfolioService
      .updatePortfolio(selectedOption.summary.portfolioId, payload)
      .pipe(finalize(() => this.portfolioSaving.set(false)))
      .subscribe({
        next: (updatedPortfolio) => {
          const updatedPortfolioKey = this.portfolioContext.registerDatabasePortfolio(updatedPortfolio);
          this.selectedManagedPortfolioKey.set(updatedPortfolioKey);
          this.syncDraftWithPortfolioSummary(updatedPortfolio);
          this.managerStatus.set(
            `${updatedPortfolio.portfolioName} updated in the database with ${updatedPortfolio.holdings.length} positions.`
          );
        },
        error: () => {
          this.managerStatus.set('Unable to update portfolio. Confirm the API is running and the portfolio still exists.');
        }
      });
  }

  protected asPercent(value: number): number {
    return value / 100;
  }

  protected toFiniteInput(value: string | number): number {
    return this.toFiniteNumber(value);
  }

  private nextDraftRowId(): number {
    this.draftRowId += 1;
    return this.draftRowId;
  }

  private draftRowId = 1000;

  private loadManagedPortfolio(option: OverviewPortfolioOption): void {
    this.syncDraftWithPortfolioSummary(option.summary, option.classifications);
    this.managerStatus.set(`${option.summary.portfolioName} loaded for editing.`);
  }

  private resetDraftPortfolio(): void {
    this.draftPortfolioName.set('New Portfolio Draft');
    this.draftBaseCurrency.set('USD');
    this.draftCashBalance.set(0);
    this.draftRiskProfile.set('Moderate');
    this.draftRows.set([]);
  }

  private syncDraftWithPortfolioSummary(
    portfolio: PortfolioSummary,
    classifications: Readonly<Record<string, HoldingClassification>> = {}
  ): void {
    this.draftPortfolioName.set(portfolio.portfolioName);
    this.draftBaseCurrency.set(portfolio.baseCurrency);
    this.draftCashBalance.set(portfolio.cashBalance);
    this.draftRiskProfile.set(portfolio.riskProfile);
    this.draftRows.set(
      portfolio.holdings.map((holding) => ({
        id: this.nextDraftRowId(),
        ticker: holding.ticker,
        name: holding.name,
        assetClass: holding.assetClass,
        sector: classifications[holding.ticker]?.sector ?? 'Unclassified',
        quantity: holding.quantity,
        averageCost: holding.averageCost,
        currentPrice: holding.currentPrice,
        changePercent: holding.changePercent
      }))
    );
  }

  private buildUpdateConfirmation(option: OverviewPortfolioOption, rows: readonly DraftHoldingRow[]): string {
    return [
      `Update portfolio "${option.summary.portfolioName}"?`,
      '',
      `This will replace the saved database portfolio with ${rows.length} current rows.`,
      `Portfolio name: ${this.draftPortfolioName().trim() || 'Untitled Portfolio'}`,
      `Cash balance: ${this.draftCashBalance().toLocaleString(undefined, {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2
      })} ${this.draftBaseCurrency().trim().toUpperCase() || 'USD'}`,
      '',
      'This change will be saved to the database.'
    ].join('\n');
  }

  private buildDeleteConfirmation(option: OverviewPortfolioOption): string {
    return [
      `Delete portfolio "${option.summary.portfolioName}"?`,
      '',
      `This will permanently delete ${option.summary.holdings.length} saved positions from the database.`,
      'This change cannot be undone.'
    ].join('\n');
  }

  private createEmptyDraftRow(): DraftHoldingRow {
    return {
      id: this.nextDraftRowId(),
      ticker: '',
      name: '',
      assetClass: 'Equity',
      sector: 'Unclassified',
      quantity: 0,
      averageCost: 0,
      currentPrice: 0,
      changePercent: 0
    };
  }

  private toPortfolioCreatePayload(rows: readonly DraftHoldingRow[]): PortfolioCreatePayload {
    return {
      userId: this.resolveManagedUserId(),
      portfolioName: this.draftPortfolioName().trim() || 'Untitled Portfolio',
      baseCurrency: (this.draftBaseCurrency().trim().toUpperCase() || 'USD').slice(0, 3),
      riskProfile: this.draftRiskProfile().trim() || 'Moderate',
      cashBalance: Math.max(0, this.draftCashBalance()),
      holdings: rows.map((row) => this.toHoldingPayload(row))
    };
  }

  private toHoldingPayload(row: DraftHoldingRow): PortfolioHoldingPayload {
    return {
      ticker: row.ticker.trim().toUpperCase(),
      name: row.name.trim(),
      assetClass: row.assetClass.trim() || 'Equity',
      quantity: row.quantity,
      averageCost: row.averageCost,
      currentPrice: row.currentPrice,
      changePercent: row.changePercent
    };
  }

  private resolveManagedUserId(): number {
    const selectedPortfolioKey = this.selectedManagedPortfolioKey();
    if (selectedPortfolioKey !== NEW_PORTFOLIO_KEY) {
      const selectedOption = this.portfolioContext.portfolioOptions().find((option) => option.key === selectedPortfolioKey);
      if (selectedOption) {
        return selectedOption.summary.userId;
      }
    }

    return this.portfolioContext.selectedSummary().userId;
  }

  private parseUploadedRows(fileContent: string, fileName: string): readonly DraftHoldingRow[] {
    const normalizedFileName = fileName.toLowerCase();

    if (normalizedFileName.endsWith('.json')) {
      const parsed = JSON.parse(fileContent) as unknown;
      const records = Array.isArray(parsed)
        ? parsed
        : isRecord(parsed) && Array.isArray(parsed['holdings'])
          ? parsed['holdings']
          : [];
      return this.recordsToDraftRows(records);
    }

    if (normalizedFileName.endsWith('.xml')) {
      return this.parseXmlRows(fileContent);
    }

    return this.parseCsvRows(fileContent);
  }

  private parseCsvRows(fileContent: string): readonly DraftHoldingRow[] {
    const lines = fileContent
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length < 2) {
      return [];
    }

    const headers = parseCsvLine(lines[0]).map((header) => normalizeRecordKey(header));
    const records = lines.slice(1).map((line) => {
      const values = parseCsvLine(line);
      const record: Record<string, unknown> = {};
      headers.forEach((header, index) => {
        record[header] = values[index] ?? '';
      });
      return record;
    });

    return this.recordsToDraftRows(records);
  }

  private parseXmlRows(fileContent: string): readonly DraftHoldingRow[] {
    const document = new DOMParser().parseFromString(fileContent, 'application/xml');
    if (document.querySelector('parsererror')) {
      throw new Error('Unable to parse XML portfolio file.');
    }

    const holdingNodes = Array.from(document.querySelectorAll('holding, position, row'));
    const records = holdingNodes.map((node) => {
      const record: Record<string, unknown> = {};
      for (const key of [
        'ticker',
        'symbol',
        'name',
        'assetClass',
        'asset_class',
        'sector',
        'quantity',
        'averageCost',
        'average_cost',
        'cost',
        'currentPrice',
        'current_price',
        'price',
        'changePercent',
        'change_percent',
        'marketValue',
        'market_value',
        'value'
      ]) {
        record[normalizeRecordKey(key)] = node.getAttribute(key) ?? node.querySelector(key)?.textContent ?? '';
      }
      return record;
    });

    return this.recordsToDraftRows(records);
  }

  private recordsToDraftRows(records: readonly unknown[]): readonly DraftHoldingRow[] {
    return records
      .filter(isRecord)
      .map((record) => this.normalizeRecord(record))
      .map((record) => this.recordToDraftRow(record))
      .filter((row): row is DraftHoldingRow => row !== null);
  }

  private normalizeRecord(record: Record<string, unknown>): Record<string, unknown> {
    const normalizedRecord: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(record)) {
      normalizedRecord[normalizeRecordKey(key)] = value;
    }

    return normalizedRecord;
  }

  private recordToDraftRow(record: Record<string, unknown>): DraftHoldingRow | null {
    const ticker = this.readRecordString(record, ['ticker', 'symbol']).toUpperCase();
    if (!ticker) {
      return null;
    }

    const currentPrice = this.readRecordNumber(record, ['currentprice', 'price']);
    const marketValue = this.readRecordNumber(record, ['marketvalue', 'value']);
    const quantity =
      this.readRecordNumber(record, ['quantity', 'shares', 'units']) ||
      (marketValue > 0 && currentPrice > 0 ? roundTo(marketValue / currentPrice, 4) : 0);

    return {
      id: this.nextDraftRowId(),
      ticker,
      name: this.readRecordString(record, ['name', 'positionname', 'description']) || ticker,
      assetClass: this.readRecordString(record, ['assetclass', 'class']) || 'Equity',
      sector: this.readRecordString(record, ['sector', 'industry']) || 'Unclassified',
      quantity,
      averageCost: this.readRecordNumber(record, ['averagecost', 'cost', 'avgcost']) || currentPrice,
      currentPrice,
      changePercent: this.readRecordNumber(record, ['changepercent', 'dailychange', 'change'])
    };
  }

  private readRecordString(record: Record<string, unknown>, keys: readonly string[]): string {
    for (const key of keys) {
      const value = record[normalizeRecordKey(key)];
      if (value !== undefined && value !== null && String(value).trim()) {
        return String(value).trim();
      }
    }

    return '';
  }

  private readRecordNumber(record: Record<string, unknown>, keys: readonly string[]): number {
    const rawValue = this.readRecordString(record, keys);
    return this.toFiniteNumber(rawValue);
  }

  private toFiniteNumber(value: string | number): number {
    const normalizedValue = typeof value === 'string' ? value.replace(/[$,%\s]/g, '') : value;
    const numericValue = Number(normalizedValue);
    return Number.isFinite(numericValue) ? numericValue : 0;
  }

  private pickRandomAssets(candidates: readonly GeneratorAsset[], count: number): readonly GeneratorAsset[] {
    const shuffledCandidates = [...candidates].sort(() => Math.random() - 0.5);
    return shuffledCandidates.slice(0, count);
  }

  private randomWeights(count: number): readonly number[] {
    const rawWeights = Array.from({ length: count }, () => Math.random() + 0.35);
    const totalWeight = rawWeights.reduce((sum, weight) => sum + weight, 0);
    return rawWeights.map((weight) => weight / totalWeight);
  }

  private randomBetween(minimum: number, maximum: number): number {
    return minimum + Math.random() * (maximum - minimum);
  }

  private resolveAllocationLabel(
    selectedView: AllocationView,
    holding: PortfolioHolding,
    classifications: Readonly<Record<string, HoldingClassification>>,
    baseCurrency: string
  ): string {
    if (selectedView === 'asset') {
      return holding.ticker;
    }

    if (selectedView === 'assetClass') {
      return holding.assetClass;
    }

    const holdingClassification = classifications[holding.ticker];

    if (selectedView === 'sector') {
      return holdingClassification?.sector ?? 'Unclassified';
    }

    if (selectedView === 'geography') {
      return holdingClassification?.geography ?? 'Global';
    }

    return holdingClassification?.currency ?? baseCurrency;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeRecordKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let currentValue = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const nextCharacter = line[index + 1];

    if (character === '"' && nextCharacter === '"') {
      currentValue += '"';
      index += 1;
      continue;
    }

    if (character === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (character === ',' && !inQuotes) {
      values.push(currentValue.trim());
      currentValue = '';
      continue;
    }

    currentValue += character;
  }

  values.push(currentValue.trim());
  return values;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

function roundCurrency(value: number): number {
  return roundTo(value, 2);
}

function roundTo(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}
