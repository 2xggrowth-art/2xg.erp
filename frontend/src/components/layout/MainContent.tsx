import { ReactNode } from 'react';
import DateRangeFilter from '../common/DateRangeFilter';

interface MainContentProps {
  children: ReactNode;
}

const MainContent = ({ children }: MainContentProps) => {
  return (
    <div className="max-w-7xl mx-auto w-full">
      {/* Greeting Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Hello, Zaheer</h1>
        <p className="text-gray-600 mt-1">2XG Dashboard Overview</p>
      </div>

      {/* Date Range Filter */}
      <DateRangeFilter />

      {/* Dashboard Content */}
      <div className="space-y-8">
        {children}
      </div>
    </div>
  );
};

export default MainContent;
