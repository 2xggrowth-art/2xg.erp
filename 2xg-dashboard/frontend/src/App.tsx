import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { DateFilterProvider } from './contexts/DateFilterContext';
import DashboardLayout from './components/layout/DashboardLayout';
import DashboardPage from './pages/DashboardPage';
import ItemsPage from './pages/ItemsPage';
import ItemDetailPage from './pages/ItemDetailPage';
import NewItemForm from './components/items/NewItemForm';
import StockCountPage from './pages/StockCountPage';
import NewStockCountPage from './pages/NewStockCountPage';
import TransferOrderPage from './pages/TransferOrderPage';
import PurchasesPage from './pages/PurchasesPage';
import VendorManagementPage from './pages/VendorManagementPage';
import NewVendorForm from './components/vendors/NewVendorForm';
import PurchaseOrderPage from './pages/PurchaseOrderPage';
import NewPurchaseOrderForm from './components/purchase-orders/NewPurchaseOrderForm';
import SalesPage from './pages/SalesPage';
import SalesOrderPage from './pages/SalesOrderPage';
import InvoicesPage from './pages/InvoicesPage';
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

            {/* Items Routes */}
            <Route path="/items" element={<ItemsPage />} />
            <Route path="/items/new" element={<NewItemForm />} />
            <Route path="/items/:id" element={<ItemDetailPage />} />
            <Route path="/items/new-category" element={<ItemsPage />} />
            <Route path="/items/stock-count" element={<StockCountPage />} />
            <Route path="/items/stock-count/new" element={<NewStockCountPage />} />
            <Route path="/items/transfer-order" element={<TransferOrderPage />} />

            {/* Purchase Routes */}
            <Route path="/purchases" element={<PurchasesPage />} />
            <Route path="/purchases/vendor-management" element={<VendorManagementPage />} />
            <Route path="/purchases/po" element={<PurchaseOrderPage />} />
            <Route path="/purchases/bills" element={<PurchasesPage />} />
            <Route path="/purchases/payment-made" element={<PurchasesPage />} />
            <Route path="/purchases/vendor-credits" element={<PurchasesPage />} />
            <Route path="/purchases/ledger-account" element={<PurchasesPage />} />

            {/* Vendor Management Routes */}
            <Route path="/vendor-management" element={<VendorManagementPage />} />
            <Route path="/vendor-management/new" element={<NewVendorForm />} />

            {/* Purchase Order Routes */}
            <Route path="/purchase-orders" element={<PurchaseOrderPage />} />
            <Route path="/purchase-orders/new" element={<NewPurchaseOrderForm />} />

            {/* Sales Routes */}
            <Route path="/sales" element={<SalesPage />} />
            <Route path="/sales/sales" element={<SalesPage />} />
            <Route path="/sales/sales-order" element={<SalesOrderPage />} />
            <Route path="/sales/invoices" element={<InvoicesPage />} />
            <Route path="/sales/payment-received" element={<SalesPage />} />

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
