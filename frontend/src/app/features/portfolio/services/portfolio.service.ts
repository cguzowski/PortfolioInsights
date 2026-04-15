import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { PortfolioHolding, PortfolioHoldingPayload, PortfolioSummary } from '../models/portfolio';

@Injectable({
  providedIn: 'root'
})
export class PortfolioService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080/api/portfolio';

  getPortfolio(): Observable<PortfolioSummary> {
    return this.http.get<PortfolioSummary>(this.apiUrl);
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
