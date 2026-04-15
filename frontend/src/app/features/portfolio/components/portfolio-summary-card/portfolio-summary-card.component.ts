import { NgClass } from '@angular/common';
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-portfolio-summary-card',
  standalone: true,
  imports: [NgClass],
  templateUrl: './portfolio-summary-card.component.html',
  styleUrl: './portfolio-summary-card.component.css'
})
export class PortfolioSummaryCardComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string | null>();
  readonly subtitle = input.required<string | null>();
  readonly tone = input<'neutral' | 'positive' | 'negative'>('neutral');
}
