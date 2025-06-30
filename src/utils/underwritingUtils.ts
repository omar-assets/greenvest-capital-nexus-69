
import type { Database } from '@/integrations/supabase/types';

type Deal = Database['public']['Tables']['deals']['Row'];

export interface RiskAssessment {
  creditRisk: 'low' | 'medium' | 'high';
  cashFlowRisk: 'low' | 'medium' | 'high';
  businessAgeRisk: 'low' | 'medium' | 'high';
  dailyBalanceRisk: 'low' | 'medium' | 'high';
  overallRisk: 'low' | 'medium' | 'high';
  riskScore: number;
}

export const calculateRiskAssessment = (deal: Deal, yearsInBusiness?: number): RiskAssessment => {
  // Credit Risk Assessment
  let creditRisk: 'low' | 'medium' | 'high' = 'medium';
  if (deal.credit_score) {
    if (deal.credit_score >= 750) creditRisk = 'low';
    else if (deal.credit_score >= 650) creditRisk = 'medium';
    else creditRisk = 'high';
  }

  // Cash Flow Risk Assessment
  let cashFlowRisk: 'low' | 'medium' | 'high' = 'medium';
  if (deal.monthly_revenue && deal.amount_requested) {
    const monthlyRequestRatio = Number(deal.amount_requested) / Number(deal.monthly_revenue);
    if (monthlyRequestRatio <= 1) cashFlowRisk = 'low';
    else if (monthlyRequestRatio <= 2) cashFlowRisk = 'medium';
    else cashFlowRisk = 'high';
  }

  // Business Age Risk Assessment
  let businessAgeRisk: 'low' | 'medium' | 'high' = 'medium';
  if (yearsInBusiness) {
    if (yearsInBusiness >= 3) businessAgeRisk = 'low';
    else if (yearsInBusiness >= 1) businessAgeRisk = 'medium';
    else businessAgeRisk = 'high';
  }

  // Daily Balance Risk Assessment
  let dailyBalanceRisk: 'low' | 'medium' | 'high' = 'medium';
  if (deal.average_daily_balance && deal.amount_requested) {
    const balanceRatio = Number(deal.average_daily_balance) / Number(deal.amount_requested);
    if (balanceRatio >= 0.3) dailyBalanceRisk = 'low';
    else if (balanceRatio >= 0.15) dailyBalanceRisk = 'medium';
    else dailyBalanceRisk = 'high';
  }

  // Calculate overall risk score (0-100, lower is better)
  const riskWeights = {
    credit: 30,
    cashFlow: 25,
    businessAge: 20,
    dailyBalance: 15,
    documents: 10
  };

  const riskScores = {
    low: 20,
    medium: 50,
    high: 80
  };

  const riskScore = Math.round(
    (riskScores[creditRisk] * riskWeights.credit +
     riskScores[cashFlowRisk] * riskWeights.cashFlow +
     riskScores[businessAgeRisk] * riskWeights.businessAge +
     riskScores[dailyBalanceRisk] * riskWeights.dailyBalance) / 100
  );

  // Determine overall risk
  let overallRisk: 'low' | 'medium' | 'high' = 'medium';
  if (riskScore <= 35) overallRisk = 'low';
  else if (riskScore <= 65) overallRisk = 'medium';
  else overallRisk = 'high';

  return {
    creditRisk,
    cashFlowRisk,
    businessAgeRisk,
    dailyBalanceRisk,
    overallRisk,
    riskScore
  };
};

export const calculateDebtServiceCoverage = (deal: Deal): number | null => {
  if (!deal.monthly_revenue || !deal.amount_requested || !deal.factor_rate || !deal.term_months) {
    return null;
  }

  const totalPayback = Number(deal.amount_requested) * Number(deal.factor_rate);
  const dailyPayment = totalPayback / (Number(deal.term_months) * 30);
  const dailyRevenue = Number(deal.monthly_revenue) / 30;
  
  return dailyRevenue / dailyPayment;
};

export const formatCurrency = (amount: number | string | null): string => {
  if (!amount) return '$0';
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numAmount);
};

export const formatPercentage = (value: number | null): string => {
  if (!value) return '0%';
  return `${Math.round(value * 100)}%`;
};

export const DECLINE_REASONS = [
  'Insufficient Cash Flow',
  'Poor Credit History',
  'Inadequate Documentation',
  'High Risk Industry',
  'Debt Service Coverage Too Low',
  'Bank Statements Show NSF Activity',
  'Business Too New',
  'Other'
] as const;
