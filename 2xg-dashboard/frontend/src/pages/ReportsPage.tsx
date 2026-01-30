import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Search, Star } from 'lucide-react';
import {
  SYSTEM_REPORTS,
  reportsService,
  formatLastVisited,
  type SystemReport,
  type ReportCategory
} from '../services/reports.service';

const ReportsPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [lastVisited, setLastVisited] = useState<Record<string, string>>({});

  // Get unique categories for dropdown
  const categories = useMemo(() => reportsService.getCategories(), []);

  // Load favorites and last visited from localStorage on mount
  useEffect(() => {
    setFavorites(reportsService.getFavorites());
    setLastVisited(reportsService.getLastVisited());
  }, []);

  // Filter reports based on search and category
  const filteredReports = useMemo(() => {
    return SYSTEM_REPORTS.filter(report => {
      const matchesSearch = !searchQuery ||
        report.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !selectedCategory || report.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  // Handle favorite toggle
  const handleToggleFavorite = (e: React.MouseEvent, reportId: string) => {
    e.stopPropagation();
    const updatedFavorites = reportsService.toggleFavorite(reportId);
    setFavorites(updatedFavorites);
  };

  // Handle report click - record visit and navigate
  const handleReportClick = (report: SystemReport) => {
    reportsService.recordVisit(report.id);
    setLastVisited(reportsService.getLastVisited());
    navigate(`/reports/${report.id}`);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-blue-600" />
              <h1 className="text-2xl font-semibold text-gray-800">Reports</h1>
            </div>
          </div>
        </div>

        {/* Search and Category Filter */}
        <div className="px-6 pb-4 flex items-center gap-4">
          <div className="flex-1 max-w-md relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Reports Table */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Report Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Report Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Visited
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredReports.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <FileText className="w-12 h-12 mb-3" />
                        <p className="text-lg font-medium">No reports found</p>
                        <p className="text-sm mt-1">
                          {searchQuery || selectedCategory
                            ? 'Try adjusting your search or filter'
                            : 'No reports available'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredReports.map((report) => {
                    const isFavorite = favorites.includes(report.id);
                    const visitTime = lastVisited[report.id];

                    return (
                      <tr
                        key={report.id}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => handleReportClick(report)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => handleToggleFavorite(e, report.id)}
                              className="p-1 hover:bg-gray-100 rounded transition-colors"
                              title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                            >
                              <Star
                                className={`w-4 h-4 ${
                                  isFavorite
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-gray-300 hover:text-amber-400'
                                }`}
                              />
                            </button>
                            <span className="text-sm font-medium text-blue-600 hover:underline">
                              {report.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600">{report.category}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600">{report.createdBy}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600">
                            {formatLastVisited(visitTime)}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
