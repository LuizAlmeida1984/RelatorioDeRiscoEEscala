export interface RiskFactors {
  market: number;
  team: number;
  technical: number;
  external: number;
}

export interface Stats {
  payback: string;
  annualROI: string;
  expectedValue: number;
  riskLevel: string;
  factorAvg: number;
}

export interface AnalyzePayload {
  mentee_name: string;
  investment: number;
  monthly_return: number;
  success_prob: number;
  risk_factors: RiskFactors;
  stats: {
    payback: string;
    annual_roi: string;
  };
}

export interface AnalysisResponse {
  analysis: string;
}

export interface ReportPayload {
  mentee_name: string;
  investment: number;
  monthly_return: number;
  success_prob: number;
  risk_factors: RiskFactors;
  stats: Stats;
  ai_analysis: string;
}
