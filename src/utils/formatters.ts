
/**
 * Format currency values with proper locale support
 */
export const formatCurrency = (
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string => {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch (error) {
    console.warn('Error formatting currency:', error);
    return `$${amount.toLocaleString()}`;
  }
};

/**
 * Format large numbers with K, M, B suffixes
 */
export const formatCompactNumber = (
  num: number,
  locale: string = 'en-US'
): string => {
  try {
    return new Intl.NumberFormat(locale, {
      notation: 'compact',
      compactDisplay: 'short',
    }).format(num);
  } catch (error) {
    console.warn('Error formatting compact number:', error);
    
    // Fallback formatting
    if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toString();
  }
};

/**
 * Format date with relative time support
 */
export const formatDate = (
  date: string | Date,
  options: {
    relative?: boolean;
    includeTime?: boolean;
    locale?: string;
  } = {}
): string => {
  const {
    relative = false,
    includeTime = false,
    locale = 'en-US'
  } = options;

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (relative) {
    return formatRelativeTime(dateObj, locale);
  }

  try {
    const formatOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...(includeTime && {
        hour: '2-digit',
        minute: '2-digit',
      })
    };

    return new Intl.DateTimeFormat(locale, formatOptions).format(dateObj);
  } catch (error) {
    console.warn('Error formatting date:', error);
    return dateObj.toLocaleDateString();
  }
};

/**
 * Format relative time (e.g., "2 hours ago", "in 3 days")
 */
export const formatRelativeTime = (
  date: Date,
  locale: string = 'en-US'
): string => {
  try {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHour = Math.round(diffMin / 60);
    const diffDay = Math.round(diffHour / 24);
    const diffWeek = Math.round(diffDay / 7);
    const diffMonth = Math.round(diffDay / 30);
    const diffYear = Math.round(diffDay / 365);

    if (Math.abs(diffYear) >= 1) return rtf.format(diffYear, 'year');
    if (Math.abs(diffMonth) >= 1) return rtf.format(diffMonth, 'month');
    if (Math.abs(diffWeek) >= 1) return rtf.format(diffWeek, 'week');
    if (Math.abs(diffDay) >= 1) return rtf.format(diffDay, 'day');
    if (Math.abs(diffHour) >= 1) return rtf.format(diffHour, 'hour');
    if (Math.abs(diffMin) >= 1) return rtf.format(diffMin, 'minute');
    return rtf.format(diffSec, 'second');
  } catch (error) {
    console.warn('Error formatting relative time:', error);
    return formatDate(date);
  }
};

/**
 * Calculate days between two dates
 */
export const daysBetween = (startDate: string | Date, endDate: string | Date = new Date()): number => {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Debounce function for search and input handling
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Throttle function for scroll and resize events
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};
