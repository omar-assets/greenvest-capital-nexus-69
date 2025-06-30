
export interface PriorityConfig {
  urgent: {
    daysThreshold: number;
    amountThreshold: number;
    scoreThreshold: number;
  };
  high: {
    daysThreshold: number;
    amountThreshold: number;
    scoreThreshold: number;
  };
  normal: {
    scoreThreshold: number;
  };
}

export const DEFAULT_PRIORITY_CONFIG: PriorityConfig = {
  urgent: {
    daysThreshold: 10,
    amountThreshold: 150000,
    scoreThreshold: 80
  },
  high: {
    daysThreshold: 5,
    amountThreshold: 75000,
    scoreThreshold: 60
  },
  normal: {
    scoreThreshold: 0
  }
};

export type PriorityLevel = 'urgent' | 'high' | 'normal';

export interface PriorityScore {
  level: PriorityLevel;
  score: number;
  reasons: string[];
}

export const calculatePriorityScore = (
  updatedAt: string,
  amountRequested: number,
  stage: string,
  config: PriorityConfig = DEFAULT_PRIORITY_CONFIG
): PriorityScore => {
  const daysInStage = Math.floor((Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24));
  const reasons: string[] = [];
  let score = 0;

  // Time-based scoring (0-40 points)
  const timeScore = Math.min(40, (daysInStage / config.urgent.daysThreshold) * 40);
  score += timeScore;
  
  if (daysInStage >= config.urgent.daysThreshold) {
    reasons.push(`${daysInStage} days in stage`);
  } else if (daysInStage >= config.high.daysThreshold) {
    reasons.push(`${daysInStage} days in stage`);
  }

  // Amount-based scoring (0-30 points)
  const amountScore = Math.min(30, (amountRequested / config.urgent.amountThreshold) * 30);
  score += amountScore;
  
  if (amountRequested >= config.urgent.amountThreshold) {
    reasons.push(`High amount: $${amountRequested.toLocaleString()}`);
  } else if (amountRequested >= config.high.amountThreshold) {
    reasons.push(`Medium amount: $${amountRequested.toLocaleString()}`);
  }

  // Stage-based scoring (0-30 points)
  const stageMultipliers: Record<string, number> = {
    'New': 1.0,
    'Reviewing Documents': 1.2,
    'Underwriting': 1.5,
    'Offer Sent': 2.0,
    'Funded': 0.5,
    'Declined': 0.1
  };
  
  const stageScore = Math.min(30, timeScore * (stageMultipliers[stage] || 1.0));
  score += stageScore;

  if (stage === 'Offer Sent' && daysInStage > 3) {
    reasons.push('Offer pending response');
  } else if (stage === 'Underwriting' && daysInStage > 2) {
    reasons.push('Underwriting review overdue');
  }

  // Determine priority level
  let level: PriorityLevel = 'normal';
  if (score >= config.urgent.scoreThreshold) {
    level = 'urgent';
  } else if (score >= config.high.scoreThreshold) {
    level = 'high';
  }

  return {
    level,
    score: Math.round(score),
    reasons
  };
};

export const getPriorityStyles = (level: PriorityLevel) => {
  switch (level) {
    case 'urgent':
      return {
        borderClass: 'border-l-4 border-l-red-500',
        shadowClass: 'shadow-red-100',
        badgeClass: 'bg-red-100 text-red-800 border-red-200',
        iconColor: 'text-red-500',
        pulseClass: 'animate-pulse'
      };
    case 'high':
      return {
        borderClass: 'border-l-4 border-l-orange-500',
        shadowClass: 'shadow-orange-100',
        badgeClass: 'bg-orange-100 text-orange-800 border-orange-200',
        iconColor: 'text-orange-500',
        pulseClass: ''
      };
    default:
      return {
        borderClass: 'border-l-4 border-l-gray-300',
        shadowClass: '',
        badgeClass: 'bg-gray-100 text-gray-600 border-gray-200',
        iconColor: 'text-gray-400',
        pulseClass: ''
      };
  }
};

export const sortDealsByPriority = <T extends { updated_at: string; amount_requested: number; stage: string }>(
  deals: T[],
  config?: PriorityConfig
): T[] => {
  return [...deals].sort((a, b) => {
    const priorityA = calculatePriorityScore(a.updated_at, a.amount_requested, a.stage, config);
    const priorityB = calculatePriorityScore(b.updated_at, b.amount_requested, b.stage, config);
    
    // Sort by priority score (descending), then by updated_at (most recent first)
    if (priorityA.score !== priorityB.score) {
      return priorityB.score - priorityA.score;
    }
    
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });
};
