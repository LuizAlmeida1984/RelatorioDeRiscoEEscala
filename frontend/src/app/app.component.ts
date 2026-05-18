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
  generatingPdf = false;
  showPdfNote = false;
  pdfDate = '';
  aiAnalysis = '';
  errorMessage = '';
  savedReportId: number | null = null;

  constructor(private reportService: ReportService) {}

  get stats(): Stats {
    const inv = this.investment || 1;
    const ret = this.monthlyReturn || 0;
    const prob = this.successProb || 0;

    const dominantRisk = Math.max(...Object.values(this.riskFactors));

    const sustainabilityFactor =
      dominantRisk >= 4
        ? 0.6
        : dominantRisk >= 3
        ? 0.75
        : dominantRisk >= 2
        ? 0.9
        : 1;

    const adjustedMonthlyReturn = ret * (prob / 100);

    const payback = (
      inv / Math.max(1, adjustedMonthlyReturn * sustainabilityFactor)
    ).toFixed(1);

    const baseROI = (((ret * 12) - inv) / inv) * 100;
    const annualROI = (baseROI * (prob / 100) * sustainabilityFactor).toFixed(0);

    const operationalExposure = inv * (dominantRisk / 5);
    const expectedValue = (ret * 12 * (prob / 100)) - operationalExposure;

    const riskLevel =
      dominantRisk >= 4 || prob < 50
        ? 'Alto'
        : dominantRisk >= 3 || prob < 75
        ? 'Moderado'
        : 'Baixo';

    return { payback, annualROI, expectedValue, riskLevel, dominantRisk, sustainabilityFactor, operationalExposure };
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
        expected_value: currentStats.expectedValue,
        risk_level: currentStats.riskLevel,
        dominant_risk: currentStats.dominantRisk,
        sustainability_factor: currentStats.sustainabilityFactor,
        operational_exposure: currentStats.operationalExposure,
      },
    };

    this.reportService
      .analyze(analyzePayload)
      .pipe(
        tap((res) => {
          this.aiAnalysis = (res.analysis || '').replace(/[#*]+\s?/g, '').replace(/^\s*-{2,}\s*$/gm, '').trim();
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

  async generatePdf(): Promise<void> {
    if (this.generatingPdf) return;
    this.generatingPdf = true;
    const now = new Date();
    this.pdfDate = `${String(now.getDate()).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}/${now.getFullYear()}`;

    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentW = pageW - margin * 2;
      let y = 22;

      const checkPage = (needed = 10) => {
        if (y + needed > pageH - 18) { doc.addPage(); y = 22; }
      };

      // ── CABEÇALHO CENTRALIZADO ─────────────────────────
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('ANÁLISE ESTRATÉGICA', pageW / 2, y, { align: 'center' });
      y += 6;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(30, 41, 59);
      doc.text('RELATÓRIO DE RISCO E ESCALA', pageW / 2, y, { align: 'center' });
      y += 9;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(15, 23, 42);
      doc.text(this.menteeName, pageW / 2, y, { align: 'center' });
      y += 7;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(148, 163, 184);
      doc.text(this.pdfDate, pageW / 2, y, { align: 'center' });
      y += 12;

      // ── DADOS DE ENTRADA (2 colunas) ───────────────────
      const c1 = margin;
      const c2 = pageW / 2;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('INVESTIMENTO TOTAL', c1, y);
      doc.text('RETORNO MENSAL PLANEJADO', c2, y);
      y += 5;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(30, 41, 59);
      doc.text(`R$ ${this.formatCurrency(this.investment)}`, c1, y);
      doc.setTextColor(16, 185, 129);
      doc.text(`R$ ${this.formatCurrency(this.monthlyReturn)}`, c2, y);
      y += 10;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('CONFIANÇA NA EXECUÇÃO', c1, y);
      doc.text('MATRIZ DE RISCO (1–5)', c2, y);
      y += 5;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(99, 102, 241);
      doc.text(`${this.successProb}%`, c1, y);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`Mercado: ${this.riskFactors.market}   Capital Humano: ${this.riskFactors.team}`, c2, y);
      y += 5;
      doc.text(`Técnica: ${this.riskFactors.technical}   Ext. Brasil: ${this.riskFactors.external}`, c2, y);
      y += 12;

      // ── MÉTRICAS (3 colunas) ───────────────────────────
      const third = contentW / 3;
      const mc = [margin, margin + third, margin + third * 2];

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('PAYBACK (MESES)', mc[0], y);
      doc.text('ROI ANUAL', mc[1], y);
      doc.text('STATUS DE RISCO', mc[2], y);
      y += 6;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(30, 41, 59);
      doc.text(this.stats.payback, mc[0], y);
      doc.setTextColor(16, 185, 129);
      doc.text(`${this.stats.annualROI}%`, mc[1], y);
      const rc = this.stats.riskLevel === 'Baixo' ? [16, 185, 129]
               : this.stats.riskLevel === 'Moderado' ? [245, 158, 11]
               : [239, 68, 68];
      doc.setTextColor(rc[0], rc[1], rc[2]);
      doc.text(this.stats.riskLevel, mc[2], y);
      y += 14;

      // ── VALOR ESPERADO ─────────────────────────────────
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('VALOR ESPERADO DO CENÁRIO (EV)', margin, y);
      y += 10;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(15, 23, 42);
      doc.text(`R$ ${this.formatCurrency(this.stats.expectedValue)}`, margin, y);
      y += 7;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('Projeção estatística ajustada pela probabilidade de sucesso e matriz de risco.', margin, y);
      y += 12;

      // ── PARECER DA IA ──────────────────────────────────
      if (this.aiAnalysis) {
        checkPage(20);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text('PARECER DE ALOCAÇÃO ESTRATÉGICA', margin, y);
        y += 7;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(71, 85, 105);

        const paragraphs = this.aiAnalysis.split('\n');
        for (const para of paragraphs) {
          if (!para.trim()) { y += 3; continue; }
          const lines = doc.splitTextToSize(para.trim(), contentW);
          checkPage(lines.length * 5 + 3);
          doc.text(lines, margin, y);
          y += lines.length * 5 + 2;
        }
      }

      // ── AVISO LEGAL ────────────────────────────────────
      checkPage(20);
      y += 4;
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(margin, y, pageW - margin, y);
      y += 6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      const disclaimer = 'Esta análise foi gerada com apoio de Inteligência Artificial e possui caráter auxiliar. As informações apresentadas não substituem a avaliação de um especialista e não devem ser consideradas como verdade absoluta ou utilizadas isoladamente para tomada de decisão.';
      const disclaimerLines = doc.splitTextToSize(disclaimer, contentW);
      doc.text(disclaimerLines, margin, y);
      y += disclaimerLines.length * 4 + 6;

      // ── RODAPÉ EM TODAS AS PÁGINAS ─────────────────────
      const total = (doc.internal as any).getNumberOfPages();
      for (let i = 1; i <= total; i++) {
        doc.setPage(i);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `Documento Confidencial de Gestão  ©  ${this.currentYear} Mentoria Ascensão`,
          margin, pageH - 10
        );
        if (total > 1) {
          doc.text(`${i} / ${total}`, pageW - margin, pageH - 10, { align: 'right' });
        }
      }

      const filename = `relatorio-${(this.menteeName || 'roi').replace(/\s+/g, '-').toLowerCase()}.pdf`;
      doc.save(filename);
    } finally {
      this.generatingPdf = false;
    }
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
