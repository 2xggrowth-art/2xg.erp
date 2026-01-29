import { useDateFilter } from '../../contexts/DateFilterContext';
import { DateRange } from '../../types';

const DateRangeFilter = () => {
  const { dateRange, setDateRange } = useDateFilter();

  const presets = [
    { label: 'Today', value: 'today' as const },
    { label: 'This Week', value: 'week' as const },
    { label: 'This Month', value: 'month' as const },
    { label: 'This Quarter', value: 'quarter' as const },
    { label: 'This Year', value: 'year' as const }
  ];

  const handlePresetChange = (preset: DateRange['preset']) => {
    const today = new Date();
    let startDate = '';
    const endDate = today.toISOString().split('T')[0];

    switch (preset) {
      case 'today':
        startDate = endDate;
        break;
      case 'week': {
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        startDate = weekStart.toISOString().split('T')[0];
        break;
      }
      case 'month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        break;
      case 'quarter': {
        const quarter = Math.floor(today.getMonth() / 3);
        startDate = new Date(today.getFullYear(), quarter * 3, 1).toISOString().split('T')[0];
        break;
      }
      case 'year':
        startDate = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
        break;
      default:
        startDate = endDate;
    }

    setDateRange({ startDate, endDate, preset });
  };

  return (
    <div className="flex gap-2 items-center mb-6">
      <label className="text-sm font-medium text-gray-700">Date Range:</label>
      <div className="flex gap-2 flex-wrap">
        {presets.map((p) => (
          <button
            key={p.value}
            onClick={() => handlePresetChange(p.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              dateRange.preset === p.value
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default DateRangeFilter;
