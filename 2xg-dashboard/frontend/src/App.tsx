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
import CustomerManagementPage from './pages/CustomerManagementPage';
import NewCustomerForm from './components/customers/NewCustomerForm';
import PurchaseOrderPage from './pages/PurchaseOrderPage';
import NewPurchaseOrderForm from './components/purchase-orders/NewPurchaseOrderForm';
import BillsPage from './pages/BillsPage';
import NewBillForm from './components/bills/NewBillForm';
import SalesPage from './pages/SalesPage';
import SalesOrderPage from './pages/SalesOrderPage';
import InvoicesPage from './pages/InvoicesPage';
import ExpensesPage from './pages/ExpensesPage';
import TasksPage from './pages/TasksPage';
import ReportsPage from './pages/ReportsPage';
import SearchPage from './pages/SearchPage';
import AIReportingPage from './pages/AIReportingPage';
import PaymentMadePage from './pages/PaymentMadePage';
import NewPaymentForm from './components/payments/NewPaymentForm';
import VendorCreditsPage from './pages/VendorCreditsPage';
import NewVendorCreditForm from './components/vendor-credits/NewVendorCreditForm';
import TransferOrdersPage from './pages/TransferOrdersPage';
import NewTransferOrderForm from './components/transfer-orders/NewTransferOrderForm';
import NewInvoiceForm from './components/invoices/NewInvoiceForm';
import SalesOrdersPage from './pages/SalesOrdersPage';
import NewSalesOrderForm from './components/sales-orders/NewSalesOrderForm';
import PaymentsReceivedPage from './pages/PaymentsReceivedPage';
import NewPaymentReceivedForm from './components/payments-received/NewPaymentReceivedForm';
import DeliveryChallansPage from './pages/DeliveryChallansPage';
import NewDeliveryChallanForm from './components/delivery-challans/NewDeliveryChallanForm';
import NewExpenseForm from './components/expenses/NewExpenseForm';

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

            {/* Transfer Orders Routes (Inventory Module) */}
            <Route path="/inventory/transfer-orders" element={<TransferOrdersPage />} />
            <Route path="/inventory/transfer-orders/new" element={<NewTransferOrderForm />} />

            {/* Purchase Routes */}
            <Route path="/purchases" element={<PurchasesPage />} />
            <Route path="/purchases/vendor-management" element={<VendorManagementPage />} />
            <Route path="/purchases/po" element={<PurchaseOrderPage />} />
            <Route path="/purchases/bills" element={<BillsPage />} />
            <Route path="/purchases/bills/new" element={<NewBillForm />} />
            <Route path="/purchases/payment-made" element={<PaymentMadePage />} />
            <Route path="/purchases/payments-made" element={<PaymentMadePage />} />
            <Route path="/purchases/payments-made/new" element={<NewPaymentForm />} />
            <Route path="/purchases/vendor-credits" element={<VendorCreditsPage />} />
            <Route path="/purchases/vendor-credits/new" element={<NewVendorCreditForm />} />
            <Route path="/purchases/ledger-account" element={<PurchasesPage />} />

            {/* Vendor Management Routes */}
            <Route path="/vendor-management" element={<VendorManagementPage />} />
            <Route path="/vendor-management/new" element={<NewVendorForm />} />

            {/* Customer Management Routes */}
            <Route path="/sales/customers" element={<CustomerManagementPage />} />
            <Route path="/sales/customers/new" element={<NewCustomerForm />} />

            {/* Purchase Order Routes */}
            <Route path="/purchase-orders" element={<PurchaseOrderPage />} />
            <Route path="/purchase-orders/new" element={<NewPurchaseOrderForm />} />

            {/* Sales Routes */}
            <Route path="/sales" element={<SalesPage />} />
            <Route path="/sales/sales" element={<SalesPage />} />
            <Route path="/sales/sales-order" element={<SalesOrderPage />} />
            <Route path="/sales/sales-orders" element={<SalesOrdersPage />} />
            <Route path="/sales/sales-orders/new" element={<NewSalesOrderForm />} />
            <Route path="/sales/invoices" element={<InvoicesPage />} />
            <Route path="/sales/invoices/new" element={<NewInvoiceForm />} />
            <Route path="/sales/payment-received" element={<PaymentsReceivedPage />} />
            <Route path="/sales/payment-received/new" element={<NewPaymentReceivedForm />} />

            {/* Delivery Challan Routes (Logistics Module) */}
            <Route path="/logistics/delivery-challan" element={<DeliveryChallansPage />} />
            <Route path="/logistics/create-delivery-challan" element={<NewDeliveryChallanForm />} />

            <Route path="/expenses" element={<ExpensesPage />} />
            <Route path="/expenses/new" element={<NewExpenseForm />} />
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
