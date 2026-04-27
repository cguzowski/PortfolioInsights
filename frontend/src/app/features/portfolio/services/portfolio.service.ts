import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ATLAS_API_CONFIG, apiResourceUrl } from '../../../core/config/api.config';
import { PortfolioCreatePayload, PortfolioHolding, PortfolioHoldingPayload, PortfolioSummary } from '../models/portfolio';

@Injectable({
  providedIn: 'root'
})
export class PortfolioService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ATLAS_API_CONFIG);
  private readonly portfolioUrl = apiResourceUrl(this.apiConfig, 'portfolio');
  private readonly portfolioCollectionUrl = apiResourceUrl(this.apiConfig, 'portfolioCollection');
  private readonly portfolioHoldingsUrl = apiResourceUrl(this.apiConfig, 'portfolioHoldings');

  getPortfolio(): Observable<PortfolioSummary> {
    return this.http.get<PortfolioSummary>(this.portfolioUrl);
  }

  getPortfolios(userId?: number): Observable<PortfolioSummary[]> {
    const options = userId === undefined ? {} : { params: { userId } };
    return this.http.get<PortfolioSummary[]>(this.portfolioCollectionUrl, options);
  }

  createPortfolio(payload: PortfolioCreatePayload): Observable<PortfolioSummary> {
    return this.http.post<PortfolioSummary>(this.portfolioUrl, payload);
  }

  updatePortfolio(portfolioId: number, payload: PortfolioCreatePayload): Observable<PortfolioSummary> {
    return this.http.put<PortfolioSummary>(`${this.portfolioUrl}/${portfolioId}`, payload);
  }

  deletePortfolio(portfolioId: number, userId?: number): Observable<void> {
    const options = userId === undefined ? {} : { params: { userId } };
    return this.http.delete<void>(`${this.portfolioUrl}/${portfolioId}`, options);
  }

  createHolding(payload: PortfolioHoldingPayload): Observable<PortfolioHolding> {
    return this.http.post<PortfolioHolding>(this.portfolioHoldingsUrl, payload);
  }

  updateHolding(id: number, payload: PortfolioHoldingPayload): Observable<PortfolioHolding> {
    return this.http.put<PortfolioHolding>(`${this.portfolioHoldingsUrl}/${id}`, payload);
  }

  deleteHolding(id: number): Observable<void> {
    return this.http.delete<void>(`${this.portfolioHoldingsUrl}/${id}`);
  }
}
