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
type SimulationHorizon = '1d' | '1w' | '1m' | '1y';

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

interface SimulationHorizonOption {
  id: SimulationHorizon;
  label: string;
}

interface SimulationScenario {
  id: string;
  label: string;
  horizon: SimulationHorizon;
  inflationRate: number;
  interestRate: number;
  equityShock: number;
  rateShock: number;
  oilShock: number;
  goldShock: number;
  usdShock: number;
  volatilityShock: number;
  creditShock: number;
  confidence: number;
}

interface SimulatedHolding {
  ticker: string;
  name: string;
  assetClass: string;
  beforeValue: number;
  afterValue: number;
  pnl: number;
  pnlPercent: number;
}

interface SimulationResult {
  key: string;
  portfolio: OverviewPortfolioOption;
  scenarioLabel: string;
  beforeValue: number;
  afterValue: number;
  pnl: number;
  pnlPercent: number;
  drawdownPercent: number;
  confidence: number;
  bestHolding: SimulatedHolding | null;
  worstHolding: SimulatedHolding | null;
  holdings: readonly SimulatedHolding[];
  allocationSlices: readonly AllocationSlice[];
}

const OVERVIEW_PAGE_ID = 'portfolio-overview-dashboard';
const PORTFOLIO_MANAGER_PAGE_ID = 'portfolio-input-generator';
const SIMULATIONS_PAGE_ID = 'portfolio-simulations';
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

const SIMULATION_HORIZONS: readonly SimulationHorizonOption[] = [
  { id: '1d', label: '1 Day' },
  { id: '1w', label: '1 Week' },
  { id: '1m', label: '1 Month' },
  { id: '1y', label: '1 Year' }
];

const HORIZON_FACTORS: Readonly<Record<SimulationHorizon, number>> = {
  '1d': 0.12,
  '1w': 0.26,
  '1m': 0.55,
  '1y': 1
};

const CASH_HORIZON_FACTORS: Readonly<Record<SimulationHorizon, number>> = {
  '1d': 1 / 252,
  '1w': 1 / 52,
  '1m': 1 / 12,
  '1y': 1
};

const SIMULATION_SCENARIOS: readonly SimulationScenario[] = [
  {
    id: 'great-financial-crisis',
    label: '2008 Financial Crisis',
    horizon: '1y',
    inflationRate: 3.8,
    interestRate: 0.25,
    equityShock: -38,
    rateShock: -3.2,
    oilShock: -54,
    goldShock: 5,
    usdShock: 18,
    volatilityShock: 48,
    creditShock: -22,
    confidence: 82
  },
  {
    id: 'covid-crash',
    label: 'COVID Liquidity Shock',
    horizon: '1m',
    inflationRate: 1.5,
    interestRate: 0.25,
    equityShock: -34,
    rateShock: -1.5,
    oilShock: -62,
    goldShock: 3,
    usdShock: 9,
    volatilityShock: 65,
    creditShock: -14,
    confidence: 78
  },
  {
    id: 'dot-com-bust',
    label: 'Dot-Com Bust',
    horizon: '1y',
    inflationRate: 3.4,
    interestRate: 6.5,
    equityShock: -28,
    rateShock: -1.6,
    oilShock: -8,
    goldShock: 2,
    usdShock: 6,
    volatilityShock: 34,
    creditShock: -9,
    confidence: 76
  },
  {
    id: 'stagflation-1970s',
    label: '1970s Inflation Shock',
    horizon: '1y',
    inflationRate: 11,
    interestRate: 12,
    equityShock: -17,
    rateShock: 4,
    oilShock: 82,
    goldShock: 68,
    usdShock: -8,
    volatilityShock: 28,
    creditShock: -8,
    confidence: 72
  },
  {
    id: 'rate-hike-cycle',
    label: '2022 Rate Hike Cycle',
    horizon: '1y',
    inflationRate: 8,
    interestRate: 4.5,
    equityShock: -18,
    rateShock: 4.2,
    oilShock: 7,
    goldShock: -1,
    usdShock: 8,
    volatilityShock: 31,
    creditShock: -11,
    confidence: 80
  },
  {
    id: 'oil-shock',
    label: 'Oil Shock',
    horizon: '1m',
    inflationRate: 6.5,
    interestRate: 5.25,
    equityShock: -12,
    rateShock: 1,
    oilShock: 70,
    goldShock: 12,
    usdShock: -3,
    volatilityShock: 24,
    creditShock: -6,
    confidence: 74
  }
];

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
  protected readonly isSimulationsPage = computed(() => this.page().id === SIMULATIONS_PAGE_ID);
  protected readonly allocationTabs = ALLOCATION_TABS;
  protected readonly assetClasses = ASSET_CLASSES;
  protected readonly riskProfiles = RISK_PROFILES;
  protected readonly portfolioManagerTabs = PORTFOLIO_MANAGER_TABS;
  protected readonly generatorStrategies = GENERATOR_STRATEGIES;
  protected readonly generatorSectors = GENERATOR_SECTORS;
  protected readonly simulationScenarios = SIMULATION_SCENARIOS;
  protected readonly simulationHorizons = SIMULATION_HORIZONS;
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
  protected readonly portfolioToAddKey = signal('');
  protected readonly selectedSimulationPortfolioKeys = signal<readonly string[]>([]);
  protected readonly simulationResults = signal<readonly SimulationResult[]>([]);
  protected readonly simulationHasRun = signal(false);
  protected readonly simulationStatus = signal('');
  protected readonly selectedScenarioId = signal(SIMULATION_SCENARIOS[0].id);
  protected readonly scenarioHorizon = signal<SimulationHorizon>(SIMULATION_SCENARIOS[0].horizon);
  protected readonly scenarioInflationRate = signal(SIMULATION_SCENARIOS[0].inflationRate);
  protected readonly scenarioInterestRate = signal(SIMULATION_SCENARIOS[0].interestRate);
  protected readonly scenarioEquityShock = signal(SIMULATION_SCENARIOS[0].equityShock);
  protected readonly scenarioRateShock = signal(SIMULATION_SCENARIOS[0].rateShock);
  protected readonly scenarioOilShock = signal(SIMULATION_SCENARIOS[0].oilShock);
  protected readonly scenarioGoldShock = signal(SIMULATION_SCENARIOS[0].goldShock);
  protected readonly scenarioUsdShock = signal(SIMULATION_SCENARIOS[0].usdShock);
  protected readonly scenarioVolatilityShock = signal(SIMULATION_SCENARIOS[0].volatilityShock);
  protected readonly scenarioCreditShock = signal(SIMULATION_SCENARIOS[0].creditShock);
  protected readonly selectedOverviewSummary = computed(() => this.portfolioContext.selectedSummary());
  protected readonly selectedOverviewSourceLabel = computed(() => this.portfolioContext.selectedSourceLabel());
  protected readonly selectedSimulationPortfolios = computed<readonly OverviewPortfolioOption[]>(() => {
    const portfolioOptions = this.portfolioContext.portfolioOptions();
    return this.selectedSimulationPortfolioKeys()
      .map((portfolioKey) => portfolioOptions.find((option) => option.key === portfolioKey))
      .filter((option): option is OverviewPortfolioOption => option !== undefined);
  });
  protected readonly availableSimulationPortfolioOptions = computed<readonly OverviewPortfolioOption[]>(() => {
    const selectedKeys = new Set(this.selectedSimulationPortfolioKeys());
    return this.portfolioContext.portfolioOptions().filter((option) => !selectedKeys.has(option.key));
  });
  protected readonly selectedScenarioLabel = computed(() => {
    return (
      SIMULATION_SCENARIOS.find((scenario) => scenario.id === this.selectedScenarioId())?.label ??
      'Custom Scenario'
    );
  });
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

  protected addPortfolioToSimulation(portfolioKey: string): void {
    if (!portfolioKey) {
      return;
    }

    this.selectedSimulationPortfolioKeys.update((portfolioKeys) =>
      portfolioKeys.includes(portfolioKey) ? portfolioKeys : [...portfolioKeys, portfolioKey]
    );
    this.portfolioToAddKey.set('');
    this.simulationResults.set([]);
    this.simulationHasRun.set(false);
    this.simulationStatus.set('');
  }

  protected removePortfolioFromSimulation(portfolioKey: string): void {
    this.selectedSimulationPortfolioKeys.update((portfolioKeys) =>
      portfolioKeys.filter((selectedKey) => selectedKey !== portfolioKey)
    );
    this.simulationResults.update((results) => results.filter((result) => result.key !== portfolioKey));
    this.simulationStatus.set('');
  }

  protected selectSimulationScenario(scenarioId: string): void {
    const scenario = SIMULATION_SCENARIOS.find((candidate) => candidate.id === scenarioId) ?? SIMULATION_SCENARIOS[0];
    this.selectedScenarioId.set(scenario.id);
    this.scenarioHorizon.set(scenario.horizon);
    this.scenarioInflationRate.set(scenario.inflationRate);
    this.scenarioInterestRate.set(scenario.interestRate);
    this.scenarioEquityShock.set(scenario.equityShock);
    this.scenarioRateShock.set(scenario.rateShock);
    this.scenarioOilShock.set(scenario.oilShock);
    this.scenarioGoldShock.set(scenario.goldShock);
    this.scenarioUsdShock.set(scenario.usdShock);
    this.scenarioVolatilityShock.set(scenario.volatilityShock);
    this.scenarioCreditShock.set(scenario.creditShock);
    this.simulationStatus.set('');
  }

  protected setSimulationHorizon(value: string): void {
    if (SIMULATION_HORIZONS.some((horizon) => horizon.id === value)) {
      this.scenarioHorizon.set(value as SimulationHorizon);
    }
  }

  protected simulatePortfolios(): void {
    const portfolios = this.selectedSimulationPortfolios();

    if (!portfolios.length) {
      this.simulationStatus.set('Add at least one portfolio before running a simulation.');
      this.simulationResults.set([]);
      this.simulationHasRun.set(false);
      return;
    }

    const results = portfolios.map((portfolio) => this.buildSimulationResult(portfolio));
    this.simulationResults.set(results);
    this.simulationHasRun.set(true);
    this.simulationStatus.set(
      `${results.length} ${results.length === 1 ? 'portfolio' : 'portfolios'} simulated under ${this.selectedScenarioLabel()}.`
    );
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

  protected portfolioAllocationSlices(option: OverviewPortfolioOption): readonly AllocationSlice[] {
    return this.buildPortfolioAllocationSlices(option.summary.holdings);
  }

  protected portfolioPieGradient(option: OverviewPortfolioOption): string {
    return this.gradientForSlices(this.portfolioAllocationSlices(option));
  }

  protected simulationPieGradient(result: SimulationResult): string {
    return this.gradientForSlices(result.allocationSlices);
  }

  protected changeClass(value: number): string {
    return value >= 0 ? 'positive' : 'negative';
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

  private buildSimulationResult(portfolio: OverviewPortfolioOption): SimulationResult {
    const holdings = portfolio.summary.holdings.map((holding) => {
      const shockPercent = this.calculateHoldingShock(portfolio, holding);
      const afterValue = roundCurrency(Math.max(0, holding.marketValue * (1 + shockPercent / 100)));
      const pnl = roundCurrency(afterValue - holding.marketValue);

      return {
        ticker: holding.ticker,
        name: holding.name,
        assetClass: holding.assetClass,
        beforeValue: holding.marketValue,
        afterValue,
        pnl,
        pnlPercent: holding.marketValue > 0 ? roundTo((pnl / holding.marketValue) * 100, 2) : 0
      };
    });
    const cashAfter = roundCurrency(
      portfolio.summary.cashBalance *
        (1 + (this.scenarioInterestRate() / 100) * CASH_HORIZON_FACTORS[this.scenarioHorizon()])
    );
    const holdingsAfter = holdings.reduce((sum, holding) => sum + holding.afterValue, 0);
    const afterValue = roundCurrency(holdingsAfter + cashAfter);
    const beforeValue = portfolio.summary.totalValue;
    const pnl = roundCurrency(afterValue - beforeValue);
    const pnlPercent = beforeValue > 0 ? roundTo((pnl / beforeValue) * 100, 2) : 0;
    const sortedHoldings = [...holdings].sort((left, right) => right.pnlPercent - left.pnlPercent);
    const horizonFactor = HORIZON_FACTORS[this.scenarioHorizon()];

    return {
      key: portfolio.key,
      portfolio,
      scenarioLabel: this.selectedScenarioLabel(),
      beforeValue,
      afterValue,
      pnl,
      pnlPercent,
      drawdownPercent: roundTo(
        clamp(Math.max(0, -pnlPercent * 1.15 + this.scenarioVolatilityShock() * horizonFactor * 0.18), 0, 95),
        2
      ),
      confidence: roundTo(
        clamp(
          (SIMULATION_SCENARIOS.find((scenario) => scenario.id === this.selectedScenarioId())?.confidence ?? 68) -
            Math.abs(this.scenarioVolatilityShock()) * 0.08,
          35,
          92
        ),
        0
      ),
      bestHolding: sortedHoldings[0] ?? null,
      worstHolding: sortedHoldings[sortedHoldings.length - 1] ?? null,
      holdings,
      allocationSlices: this.buildSimulatedAllocationSlices(holdings)
    };
  }

  private calculateHoldingShock(portfolio: OverviewPortfolioOption, holding: PortfolioHolding): number {
    const classification = portfolio.classifications[holding.ticker];
    const sector = classification?.sector ?? holding.assetClass;
    const assetClass = holding.assetClass.toLowerCase();
    const normalizedSector = sector.toLowerCase();
    const inflationPressure = Math.max(0, this.scenarioInflationRate() - 3);
    let shock = 0;

    if (assetClass.includes('bond')) {
      shock = -this.scenarioRateShock() * 3.1 + this.scenarioCreditShock() * 0.45 - inflationPressure * 0.45;
    } else if (assetClass.includes('reit')) {
      shock = this.scenarioEquityShock() * 0.7 - this.scenarioRateShock() * 4 + inflationPressure * 0.2;
    } else if (assetClass.includes('commodity')) {
      shock = this.scenarioOilShock() * 0.25 + this.scenarioGoldShock() * 0.45 + inflationPressure * 0.8;
    } else if (assetClass.includes('alternative')) {
      shock =
        this.scenarioEquityShock() * 1.1 -
        this.scenarioUsdShock() * 0.65 +
        this.scenarioVolatilityShock() * 0.16;
    } else if (assetClass.includes('etf')) {
      shock = this.scenarioEquityShock() * 0.82 + this.scenarioCreditShock() * 0.08;
    } else {
      shock = this.scenarioEquityShock();
    }

    if (
      normalizedSector.includes('technology') ||
      normalizedSector.includes('semiconductor') ||
      normalizedSector.includes('e-commerce')
    ) {
      shock += this.scenarioEquityShock() * 0.22 - this.scenarioRateShock() * 1.7;
    }

    if (normalizedSector.includes('healthcare') || normalizedSector.includes('consumer staples')) {
      shock -= this.scenarioEquityShock() * 0.35;
    }

    if (normalizedSector.includes('energy')) {
      shock += this.scenarioOilShock() * 0.42 + inflationPressure * 0.3;
    }

    if (normalizedSector.includes('fixed income') || normalizedSector.includes('corporate bond')) {
      shock += this.scenarioCreditShock() * 0.35;
    }

    if (normalizedSector.includes('real estate')) {
      shock -= this.scenarioRateShock() * 1.8;
    }

    if (normalizedSector.includes('digital asset')) {
      shock += this.scenarioEquityShock() * 0.55 - this.scenarioUsdShock() * 0.55;
    }

    if (holding.ticker === 'GLD' || normalizedSector.includes('commodities')) {
      shock += this.scenarioGoldShock() * 0.5 - this.scenarioUsdShock() * 0.18;
    }

    return roundTo(clamp(shock * HORIZON_FACTORS[this.scenarioHorizon()], -90, 180), 2);
  }

  private buildPortfolioAllocationSlices(holdings: readonly PortfolioHolding[]): readonly AllocationSlice[] {
    const totals = new Map<string, number>();
    const totalValue = holdings.reduce((sum, holding) => sum + holding.marketValue, 0);

    for (const holding of holdings) {
      totals.set(holding.assetClass, (totals.get(holding.assetClass) ?? 0) + holding.marketValue);
    }

    return this.toAllocationSlices(totals, totalValue);
  }

  private buildSimulatedAllocationSlices(holdings: readonly SimulatedHolding[]): readonly AllocationSlice[] {
    const totals = new Map<string, number>();
    const totalValue = holdings.reduce((sum, holding) => sum + holding.afterValue, 0);

    for (const holding of holdings) {
      totals.set(holding.assetClass, (totals.get(holding.assetClass) ?? 0) + holding.afterValue);
    }

    return this.toAllocationSlices(totals, totalValue);
  }

  private toAllocationSlices(totals: ReadonlyMap<string, number>, totalValue: number): readonly AllocationSlice[] {
    return [...totals.entries()]
      .map(([label, value], index) => ({
        label,
        value: roundCurrency(value),
        percentage: totalValue > 0 ? roundTo((value / totalValue) * 100, 2) : 0,
        color: PIE_COLORS[index % PIE_COLORS.length]
      }))
      .sort((left, right) => right.value - left.value);
  }

  private gradientForSlices(slices: readonly AllocationSlice[]): string {
    if (!slices.length) {
      return 'conic-gradient(#d7ddd4 0% 100%)';
    }

    let currentStop = 0;
    const segments = slices.map((slice) => {
      const start = currentStop;
      currentStop += slice.percentage;
      return `${slice.color} ${start.toFixed(2)}% ${currentStop.toFixed(2)}%`;
    });

    return `conic-gradient(${segments.join(', ')})`;
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
