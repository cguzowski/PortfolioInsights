import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { PortfolioCreatePayload, PortfolioHolding, PortfolioHoldingPayload, PortfolioSummary } from '../models/portfolio';

@Injectable({
  providedIn: 'root'
})
export class PortfolioService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080/api/portfolio';

  getPortfolio(): Observable<PortfolioSummary> {
    return this.http.get<PortfolioSummary>(this.apiUrl);
  }

  getPortfolios(userId?: number): Observable<PortfolioSummary[]> {
    const options = userId === undefined ? {} : { params: { userId } };
    return this.http.get<PortfolioSummary[]>(`${this.apiUrl}/all`, options);
  }

  createPortfolio(payload: PortfolioCreatePayload): Observable<PortfolioSummary> {
    return this.http.post<PortfolioSummary>(this.apiUrl, payload);
  }

  updatePortfolio(portfolioId: number, payload: PortfolioCreatePayload): Observable<PortfolioSummary> {
    return this.http.put<PortfolioSummary>(`${this.apiUrl}/${portfolioId}`, payload);
  }

  deletePortfolio(portfolioId: number, userId?: number): Observable<void> {
    const options = userId === undefined ? {} : { params: { userId } };
    return this.http.delete<void>(`${this.apiUrl}/${portfolioId}`, options);
  }

  createHolding(payload: PortfolioHoldingPayload): Observable<PortfolioHolding> {
    return this.http.post<PortfolioHolding>(`${this.apiUrl}/holdings`, payload);
  }

  updateHolding(id: number, payload: PortfolioHoldingPayload): Observable<PortfolioHolding> {
    return this.http.put<PortfolioHolding>(`${this.apiUrl}/holdings/${id}`, payload);
  }

  deleteHolding(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/holdings/${id}`);
  }
}
