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
    payback: string;
    annual_roi: string;
    expected_value: number;
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
