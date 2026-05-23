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

  constructor(private reportService: ReportService) {
    console.log(
      '%c' +
      '@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@\n' +
      '@@@@@@                                                              @@@@@@\n' +
      '@@@@@@   @@@    @@@@@@@@   @                                        @@@@@@\n' +
      '@@@@@@    @     @          @      Programa IEL Mentoria             @@@@@@\n' +
      '@@@@@@    @     @@@@@@     @      Roda da Vida Empreendedora        @@@@@@\n' +
      '@@@@@@    @     @          @      Instituto Euvaldo Lodi            @@@@@@\n' +
      '@@@@@@   @@@    @@@@@@@@   @@@@@@@@  na Indústria                   @@@@@@\n' +
      '@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@',
      'color: #1a3b8c; font-family: monospace; font-size: 11px; font-weight: bold;'
    );
  }

  get dominantRisk(): number {
    return Math.max(...Object.values(this.riskFactors));
  }

  get stats(): Stats {
    const inv = this.investment || 1;
    const ret = this.monthlyReturn || 0;
    const prob = this.successProb / 100;
    const risk = this.dominantRisk;

    const sustainabilityFactor = risk >= 4 ? 0.6 : risk >= 3 ? 0.75 : risk >= 2 ? 0.9 : 1;

    const paybackNominal = (inv / Math.max(1, ret)).toFixed(1);
    const evNominal = ret * 12;

    const adjustedMonthlyReturn = ret * prob * sustainabilityFactor;
    const paybackAjustado = (inv / Math.max(1, adjustedMonthlyReturn)).toFixed(1);

    const operationalExposure = inv * (risk / 5);
    const evAjustado = (ret * 12 * prob) - operationalExposure;

    const baseROI = (((ret * 12) - inv) / inv) * 100;
    const annualROINominal = baseROI.toFixed(0);
    const annualROI = (baseROI * prob * sustainabilityFactor).toFixed(0);

    const riskLevel = risk >= 4 || prob < 0.5 ? 'Alto' : risk >= 3 || prob < 0.75 ? 'Moderado' : 'Baixo';

    return {
      payback: paybackNominal,
      payback_ajustado: paybackAjustado,
      annualROI,
      annualROINominal,
      expectedValue: evNominal,
      ev_ajustado: evAjustado,
      riskLevel,
      dominantRisk: risk,
      sustainabilityFactor,
      operationalExposure,
    };
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
        payback_nominal: currentStats.payback,
        payback_ajustado: currentStats.payback_ajustado,
        annual_roi: currentStats.annualROI,
        ev_nominal: currentStats.expectedValue,
        ev_ajustado: currentStats.ev_ajustado,
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
          this.aiAnalysis = (res.analysis || '')
            .replace(/\$\\rightarrow\$/g, '→')
            .replace(/\$\\Rightarrow\$/g, '⇒')
            .replace(/\$\\leftarrow\$/g, '←')
            .replace(/\$\\to\$/g, '→')
            .replace(/\$[^$\n]*\$/g, '')
            .replace(/[#*]+\s?/g, '')
            .replace(/^\s*-{2,}\s*$/gm, '')
            .trim();
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
      const loadImg = (src: string): Promise<{ url: string; w: number; h: number } | null> =>
        new Promise(resolve => {
          const img = new Image();
          img.onload = () => {
            const c = document.createElement('canvas');
            c.width = img.naturalWidth; c.height = img.naturalHeight;
            c.getContext('2d')!.drawImage(img, 0, 0);
            resolve({ url: c.toDataURL('image/png'), w: img.naturalWidth, h: img.naturalHeight });
          };
          img.onerror = () => resolve(null);
          img.src = src;
        });

      const [iel, cni] = await Promise.all([
        loadImg('assets/logo-iel.png'),
        loadImg('assets/logo-cni.png'),
      ]);

      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentW = pageW - margin * 2;

      const checkPage = (needed = 10) => {
        if (y + needed > pageH - 18) { doc.addPage(); y = 22; }
      };

      // ── CABEÇALHO (igual ao HTML) ──────────────────────
      const headerH = 24;

      if (iel) {
        const ielH = 10;
        const ielW = ielH * (iel.w / iel.h);
        const ielY = (headerH - ielH) / 2;
        doc.addImage(iel.url, 'PNG', margin, ielY, ielW, ielH);

        const tx = margin + ielW + 3;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(26, 59, 140);
        doc.text('Programa IEL Mentoria para Mulheres', tx, headerH / 2 - 1);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6);
        doc.setTextColor(148, 163, 184);
        doc.text('RELATÓRIO DE RISCO E ESCALA', tx, headerH / 2 + 4);
      }

      if (cni) {
        const cniH = 18;
        const cniW = cniH * (cni.w / cni.h);
        doc.addImage(cni.url, 'PNG', pageW - margin - cniW, (headerH - cniH) / 2, cniW, cniH);
      }

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(0, headerH, pageW, headerH);

      let y = headerH + 10;

      // Nome e data abaixo do cabeçalho
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42);
      doc.text(this.menteeName, pageW / 2, y, { align: 'center' });
      y += 7;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
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
      doc.text(`${this.stats.annualROINominal}%`, mc[1], y);
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

        const indent = 8;
        const lineH = 5;

        const renderParagraph = (text: string, startY: number): number => {
          const words = text.trim().split(/\s+/);
          const lines: { ws: string[]; x: number; maxW: number }[] = [];
          let lineWs: string[] = [];
          let lineW = 0;
          let first = true;

          for (const word of words) {
            const wW = doc.getTextWidth(word);
            const spW = lineWs.length > 0 ? doc.getTextWidth(' ') : 0;
            const maxW = first ? contentW - indent : contentW;
            if (lineWs.length > 0 && lineW + spW + wW > maxW) {
              lines.push({ ws: lineWs, x: first ? margin + indent : margin, maxW });
              lineWs = [word]; lineW = wW; first = false;
            } else {
              if (lineWs.length > 0) lineW += spW;
              lineWs.push(word); lineW += wW;
            }
          }
          if (lineWs.length > 0) {
            lines.push({ ws: lineWs, x: first ? margin + indent : margin, maxW: first ? contentW - indent : contentW });
          }

          let cy = startY;
          for (let i = 0; i < lines.length; i++) {
            const { ws, x, maxW } = lines[i];
            if (i === lines.length - 1 || ws.length === 1) {
              doc.text(ws.join(' '), x, cy);
            } else {
              const totalW = ws.reduce((s, w) => s + doc.getTextWidth(w), 0);
              const gap = (maxW - totalW) / (ws.length - 1);
              let cx = x;
              for (const w of ws) { doc.text(w, cx, cy); cx += doc.getTextWidth(w) + gap; }
            }
            cy += lineH;
          }
          return cy;
        };

        const paragraphs = this.aiAnalysis.split('\n');
        for (const para of paragraphs) {
          if (!para.trim()) { y += 3; continue; }
          const estimatedLines = Math.ceil(doc.getTextWidth(para.trim()) / contentW) + 1;
          checkPage(estimatedLines * lineH + 3);
          y = renderParagraph(para, y);
          y += 2;
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

  newSession(): void {
    this.menteeName = '';
    this.investment = 10000;
    this.monthlyReturn = 2500;
    this.successProb = 80;
    this.riskFactors = { market: 1, team: 1, technical: 1, external: 1 };
    this.aiAnalysis = '';
    this.errorMessage = '';
    this.savedReportId = null;
  }

  get expectedValuePositive(): boolean {
    return this.stats.expectedValue > 0;
  }

  formatCurrency(value: number): string {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  }
}
