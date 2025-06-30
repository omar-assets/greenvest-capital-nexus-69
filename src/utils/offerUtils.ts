
// Utility functions for offer calculations

export const calculatePayments = (
  amount: number,
  factorRate: number,
  termMonths: number,
  paymentFrequency: 'daily' | 'weekly'
) => {
  const totalPayback = amount * factorRate;
  
  if (paymentFrequency === 'daily') {
    // Assume 22 business days per month
    const totalDays = termMonths * 22;
    const dailyPayment = totalPayback / totalDays;
    return {
      totalPayback,
      dailyPayment,
      weeklyPayment: dailyPayment * 5, // 5 business days per week
    };
  } else {
    // Weekly payments
    const totalWeeks = Math.ceil(termMonths * 4.33); // ~4.33 weeks per month
    const weeklyPayment = totalPayback / totalWeeks;
    return {
      totalPayback,
      dailyPayment: weeklyPayment / 5,
      weeklyPayment,
    };
  }
};

export const calculateISOCommission = (
  amount: number,
  buyRate?: number,
  factorRate?: number
) => {
  if (!buyRate || !factorRate) return 0;
  
  // ISO commission is typically the difference between factor rate and buy rate
  const commissionRate = factorRate - buyRate;
  return amount * commissionRate;
};

export const formatCurrency = (amount: number | null | undefined): string => {
  if (amount == null) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export const formatPercentage = (value: number | null | undefined): string => {
  if (value == null) return '0%';
  return `${(value * 100).toFixed(2)}%`;
};

export const getStatusBadgeColor = (status: string) => {
  switch (status) {
    case 'draft': return 'bg-slate-600 text-slate-200';
    case 'sent': return 'bg-blue-600 text-blue-200';
    case 'viewed': return 'bg-yellow-600 text-yellow-200';
    case 'accepted': return 'bg-green-600 text-green-200';
    case 'declined': return 'bg-red-600 text-red-200';
    default: return 'bg-slate-600 text-slate-200';
  }
};

export const getStatusIcon = (status: string) => {
  switch (status) {
    case 'draft': return '📝';
    case 'sent': return '📤';
    case 'viewed': return '👁️';
    case 'accepted': return '✅';
    case 'declined': return '❌';
    default: return '📄';
  }
};
