export interface RiskFactors {
  market: number;
  team: number;
  technical: number;
  external: number;
}

export interface Stats {
  payback: string;
  payback_ajustado: string;
  annualROI: string;
  annualROINominal: string;
  expectedValue: number;
  ev_ajustado: number;
  riskLevel: string;
  dominantRisk: number;
  sustainabilityFactor: number;
  operationalExposure: number;
}

export interface AnalyzePayload {
  mentee_name: string;
  investment: number;
  monthly_return: number;
  success_prob: number;
  risk_factors: RiskFactors;
  stats: {
    payback_nominal: string;
    payback_ajustado: string;
    annual_roi: string;
    ev_nominal: number;
    ev_ajustado: number;
    risk_level: string;
    dominant_risk: number;
    sustainability_factor: number;
    operational_exposure: number;
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
