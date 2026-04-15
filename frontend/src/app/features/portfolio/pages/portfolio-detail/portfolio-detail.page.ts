import { CurrencyPipe, DatePipe, PercentPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { HoldingFormComponent } from '../../components/holding-form/holding-form.component';
import { HoldingsTableComponent } from '../../components/holdings-table/holdings-table.component';
import { PortfolioSummaryCardComponent } from '../../components/portfolio-summary-card/portfolio-summary-card.component';
import { PortfolioHolding, PortfolioHoldingPayload, PortfolioSummary } from '../../models/portfolio';
import { PortfolioService } from '../../services/portfolio.service';

@Component({
  selector: 'app-portfolio-detail-page',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, PercentPipe, PortfolioSummaryCardComponent, HoldingFormComponent, HoldingsTableComponent],
  templateUrl: './portfolio-detail.page.html',
  styleUrl: './portfolio-detail.page.css'
})
export class PortfolioDetailPageComponent {
  private readonly portfolioService = inject(PortfolioService);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly portfolio = signal<PortfolioSummary | null>(null);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly editingId = signal<number | null>(null);
  protected readonly totalInvested = computed(() => this.portfolio()?.totalCost ?? 0);
  protected readonly totalExposure = computed(
    () => (this.portfolio()?.totalValue ?? 0) - (this.portfolio()?.cashBalance ?? 0)
  );

  protected readonly holdingForm = this.formBuilder.nonNullable.group({
    ticker: ['', [Validators.required, Validators.maxLength(10)]],
    name: ['', [Validators.required, Validators.maxLength(80)]],
    assetClass: ['Equity', Validators.required],
    quantity: [0, [Validators.required, Validators.min(0.0001)]],
    averageCost: [0, [Validators.required, Validators.min(0)]],
    currentPrice: [0, [Validators.required, Validators.min(0)]],
    changePercent: [0, [Validators.required, Validators.min(-100), Validators.max(100)]]
  });

  constructor() {
    this.loadPortfolio();
  }

  protected submitHolding(): void {
    if (this.holdingForm.invalid) {
      this.holdingForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.errorMessage.set('');

    const payload = this.toPayload();
    const request$ = this.editingId()
      ? this.portfolioService.updateHolding(this.editingId()!, payload)
      : this.portfolioService.createHolding(payload);

    request$
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.resetForm();
          this.loadPortfolio();
        },
        error: () => this.errorMessage.set('Unable to save holding. Confirm the API is running on port 8080.')
      });
  }

  protected editHolding(holding: PortfolioHolding): void {
    this.editingId.set(holding.id);
    this.holdingForm.setValue({
      ticker: holding.ticker,
      name: holding.name,
      assetClass: holding.assetClass,
      quantity: holding.quantity,
      averageCost: holding.averageCost,
      currentPrice: holding.currentPrice,
      changePercent: holding.changePercent
    });
  }

  protected deleteHolding(id: number): void {
    this.saving.set(true);
    this.errorMessage.set('');

    this.portfolioService
      .deleteHolding(id)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          if (this.editingId() === id) {
            this.resetForm();
          }
          this.loadPortfolio();
        },
        error: () => this.errorMessage.set('Unable to delete holding. Confirm the API is running on port 8080.')
      });
  }

  protected resetForm(): void {
    this.editingId.set(null);
    this.holdingForm.reset({
      ticker: '',
      name: '',
      assetClass: 'Equity',
      quantity: 0,
      averageCost: 0,
      currentPrice: 0,
      changePercent: 0
    });
  }

  protected metricTone(value: number): 'neutral' | 'positive' | 'negative' {
    if (value > 0) {
      return 'positive';
    }

    if (value < 0) {
      return 'negative';
    }

    return 'neutral';
  }

  private loadPortfolio(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.portfolioService
      .getPortfolio()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (portfolio) => this.portfolio.set(portfolio),
        error: () =>
          this.errorMessage.set(
            'Unable to load portfolio data. Start the Spring Boot API at http://localhost:8080.'
          )
      });
  }

  private toPayload(): PortfolioHoldingPayload {
    const raw = this.holdingForm.getRawValue();

    return {
      ticker: raw.ticker.trim().toUpperCase(),
      name: raw.name.trim(),
      assetClass: raw.assetClass,
      quantity: Number(raw.quantity),
      averageCost: Number(raw.averageCost),
      currentPrice: Number(raw.currentPrice),
      changePercent: Number(raw.changePercent)
    };
  }
}
