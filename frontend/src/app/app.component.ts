import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, EMPTY, finalize, switchMap, tap } from 'rxjs';

import { ReportService } from './services/report.service';
import { RiskInputComponent } from './components/risk-input/risk-input.component';
import { MetricCardComponent } from './components/metric-card/metric-card.component';
import { RiskFactors, Stats } from './models/report.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, RiskInputComponent, MetricCardComponent],
  templateUrl: './app.component.html',
})
export class AppComponent {
  menteeName = '';
  investment = 10000;
  monthlyReturn = 2500;
  successProb = 80;
  riskFactors: RiskFactors = { market: 1, team: 1, technical: 1, external: 1 };
  loading = false;
  aiAnalysis = '';
  errorMessage = '';
  savedReportId: number | null = null;

  constructor(private reportService: ReportService) {}

  get stats(): Stats {
    const inv = this.investment || 1;
    const ret = this.monthlyReturn || 0;
    const prob = this.successProb || 0;

    const payback = (inv / Math.max(1, ret)).toFixed(1);
    const annualROI = (((ret * 12 - inv) / inv) * 100).toFixed(0);
    const expectedValue =
      ret * 12 * (prob / 100) - inv * (1 - prob / 100);

    const factorAvg =
      Object.values(this.riskFactors).reduce((a, b) => a + b, 0) / 4;

    const riskLevel =
      prob >= 85 && factorAvg <= 2
        ? 'Baixo'
        : prob >= 65 && factorAvg <= 3.5
        ? 'Moderado'
        : 'Alto';

    return { payback, annualROI, expectedValue, riskLevel, factorAvg };
  }

  get currentYear(): number {
    return new Date().getFullYear();
  }

  updateRiskFactor(key: keyof RiskFactors, value: number): void {
    this.riskFactors = { ...this.riskFactors, [key]: value };
  }

  handleAnalyze(): void {
    if (!this.menteeName || this.loading) return;

    this.loading = true;
    this.errorMessage = '';
    this.savedReportId = null;
    const currentStats = this.stats;

    const analyzePayload = {
      mentee_name: this.menteeName,
      investment: this.investment,
      monthly_return: this.monthlyReturn,
      success_prob: this.successProb,
      risk_factors: this.riskFactors,
      stats: {
        payback: currentStats.payback,
        annual_roi: currentStats.annualROI,
      },
    };

    this.reportService
      .analyze(analyzePayload)
      .pipe(
        tap((res) => {
          this.aiAnalysis = res.analysis;
        }),
        switchMap((res) =>
          this.reportService.saveReport({
            mentee_name: this.menteeName,
            investment: this.investment,
            monthly_return: this.monthlyReturn,
            success_prob: this.successProb,
            risk_factors: this.riskFactors,
            stats: currentStats,
            ai_analysis: res.analysis,
          })
        ),
        tap((saved: any) => {
          if (saved?.id) this.savedReportId = saved.id;
        }),
        catchError((err: HttpErrorResponse) => {
          if (err.status === 0) {
            this.errorMessage = 'Não foi possível conectar ao servidor. Verifique se o backend está em execução em localhost:8000.';
          } else if (err.status === 422) {
            const messages = Object.values(err.error?.errors ?? {}).flat();
            this.errorMessage = messages.length
              ? (messages as string[]).join(' ')
              : 'Dados inválidos. Verifique os campos preenchidos.';
          } else if (err.status === 502) {
            this.errorMessage = err.error?.error ?? 'Erro ao contactar a API de IA. Verifique a chave GEMINI_API_KEY no backend.';
          } else {
            this.errorMessage = `Erro inesperado (${err.status}). Tente novamente.`;
          }
          return EMPTY;
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe();
  }

  printReport(): void {
    window.print();
  }

  get riskColor(): string {
    return this.stats.riskLevel === 'Baixo'
      ? 'text-emerald-500'
      : this.stats.riskLevel === 'Moderado'
      ? 'text-amber-500'
      : 'text-rose-500';
  }

  get expectedValuePositive(): boolean {
    return this.stats.expectedValue > 0;
  }

  formatCurrency(value: number): string {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  }
}
