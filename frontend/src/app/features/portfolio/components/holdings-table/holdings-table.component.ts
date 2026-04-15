import { CurrencyPipe, DecimalPipe, NgClass, PercentPipe } from '@angular/common';
import { Component, input, output } from '@angular/core';

import { PortfolioHolding } from '../../models/portfolio';

@Component({
  selector: 'app-holdings-table',
  standalone: true,
  imports: [CurrencyPipe, DecimalPipe, PercentPipe, NgClass],
  templateUrl: './holdings-table.component.html',
  styleUrl: './holdings-table.component.css'
})
export class HoldingsTableComponent {
  readonly holdings = input.required<PortfolioHolding[]>();
  readonly baseCurrency = input.required<string>();
  readonly saving = input(false);

  readonly edited = output<PortfolioHolding>();
  readonly deleted = output<number>();
}
