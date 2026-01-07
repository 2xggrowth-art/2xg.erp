import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { DateFilterProvider } from './contexts/DateFilterContext';
import DashboardLayout from './components/layout/DashboardLayout';
import DashboardPage from './pages/DashboardPage';
import ItemsPage from './pages/ItemsPage';
import PurchasesPage from './pages/PurchasesPage';
import SalesPage from './pages/SalesPage';
import ExpensesPage from './pages/ExpensesPage';
import TasksPage from './pages/TasksPage';
import ReportsPage from './pages/ReportsPage';
import SearchPage from './pages/SearchPage';
import AIReportingPage from './pages/AIReportingPage';

function App() {
  return (
    <Router>
      <DateFilterProvider>
        <DashboardLayout>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/erp" element={<DashboardPage />} />
            <Route path="/logistics" element={<DashboardPage />} />
            <Route path="/care" element={<DashboardPage />} />
            <Route path="/crm" element={<DashboardPage />} />
            <Route path="/items" element={<ItemsPage />} />
            <Route path="/purchases" element={<PurchasesPage />} />
            <Route path="/sales" element={<SalesPage />} />
            <Route path="/expenses" element={<ExpensesPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/ai-reporting" element={<AIReportingPage />} />
          </Routes>
        </DashboardLayout>
      </DateFilterProvider>
    </Router>
  );
}

export default App;
