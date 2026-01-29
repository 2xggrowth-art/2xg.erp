import { createContext, useContext, useState, ReactNode } from 'react';
import { DateRange } from '../types';

interface DateFilterContextType {
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
}

const DateFilterContext = createContext<DateFilterContextType | undefined>(undefined);

export const DateFilterProvider = ({ children }: { children: ReactNode }) => {
  // Default to current month
  const getDefaultDateRange = (): DateRange => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

    return {
      startDate: firstDay.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0],
      preset: 'month'
    };
  };

  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange());

  return (
    <DateFilterContext.Provider value={{ dateRange, setDateRange }}>
      {children}
    </DateFilterContext.Provider>
  );
};

export const useDateFilter = () => {
  const context = useContext(DateFilterContext);
  if (!context) {
    throw new Error('useDateFilter must be used within DateFilterProvider');
  }
  return context;
};
