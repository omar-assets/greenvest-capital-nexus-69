
import { useState, useCallback } from 'react';

export const useTabNavigation = (defaultTab = 'overview') => {
  const [activeTab, setActiveTab] = useState(defaultTab);

  const switchToTab = useCallback((tabValue: string) => {
    setActiveTab(tabValue);
  }, []);

  return {
    activeTab,
    setActiveTab,
    switchToTab
  };
};
