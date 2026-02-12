import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { DateFilterProvider } from './contexts/DateFilterContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ItemsPage from './pages/ItemsPage';
import ItemDetailPage from './pages/ItemDetailPage';
import NewItemForm from './components/items/NewItemForm';
import TransferOrderPage from './pages/TransferOrderPage';
import PurchasesPage from './pages/PurchasesPage';
import VendorManagementPage from './pages/VendorManagementPage';
import NewVendorForm from './components/vendors/NewVendorForm';
import CustomerManagementPage from './pages/CustomerManagementPage';
import NewCustomerForm from './components/customers/NewCustomerForm';
import EditCustomerForm from './components/customers/EditCustomerForm';
import PurchaseOrderPage from './pages/PurchaseOrderPage';
import NewPurchaseOrderForm from './components/purchase-orders/NewPurchaseOrderForm';
import BillsPage from './pages/BillsPage';
import NewBillForm from './components/bills/NewBillForm';
import SalesPage from './pages/SalesPage';
import SalesOrderPage from './pages/SalesOrderPage';
import InvoicesPage from './pages/InvoicesPage';
import ExpensesPage from './pages/ExpensesPage';
import ExpenseDetailPage from './pages/ExpenseDetailPage';
import TasksPage from './pages/TasksPage';
import ReportsPage from './pages/ReportsPage';
import ReportViewerPage from './pages/ReportViewerPage';
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
import SalesOrderDetailPage from './pages/SalesOrderDetailPage';
import NewSalesOrderForm from './components/sales-orders/NewSalesOrderForm';
import PaymentsReceivedPage from './pages/PaymentsReceivedPage';
import PaymentReceivedDetailPage from './pages/PaymentReceivedDetailPage';
import PaymentMadeDetailPage from './pages/PaymentMadeDetailPage';
import InvoiceDetailPage from './pages/InvoiceDetailPage';
import PurchaseOrderDetailPage from './pages/PurchaseOrderDetailPage';
import BillDetailPage from './pages/BillDetailPage';
import CustomerDetailPage from './pages/CustomerDetailPage';
import VendorDetailPage from './pages/VendorDetailPage';
import VendorCreditDetailPage from './pages/VendorCreditDetailPage';
import NewPaymentReceivedForm from './components/payments-received/NewPaymentReceivedForm';
import DeliveryChallansPage from './pages/DeliveryChallansPage';
import DeliveryChallanDetailPage from './pages/DeliveryChallanDetailPage';
import NewDeliveryChallanForm from './components/delivery-challans/NewDeliveryChallanForm';
import NewExpenseForm from './components/expenses/NewExpenseForm';
import SettingsPage from './pages/SettingsPage';

// POS
import PosCreate from './pages/PosCreate';
import PosPage from './pages/PosPage';
import SessionDetailPage from './pages/SessionDetailPage';
import ComingSoonPage from './pages/ComingSoonPage';
import TransferOrderDetailPage from './pages/TransferOrderDetailPage';
import BinLocationsPage from './pages/BinLocationsPage';
import BrandManufacturerManagementPage from './pages/BrandManufacturerManagementPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <DateFilterProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected Routes - All wrapped with ProtectedRoute and DashboardLayout */}
            <Route path="/" element={<ProtectedRoute><DashboardLayout><DashboardPage /></DashboardLayout></ProtectedRoute>} />
            <Route path="/erp" element={<ProtectedRoute><DashboardLayout><DashboardPage /></DashboardLayout></ProtectedRoute>} />
            <Route path="/logistics" element={<ProtectedRoute><DashboardLayout><DashboardPage /></DashboardLayout></ProtectedRoute>} />
            <Route path="/care" element={<ProtectedRoute><DashboardLayout><DashboardPage /></DashboardLayout></ProtectedRoute>} />
            <Route path="/crm" element={<ProtectedRoute><DashboardLayout><DashboardPage /></DashboardLayout></ProtectedRoute>} />

            {/* Items Routes */}
            <Route path="/items" element={<ProtectedRoute><DashboardLayout><ItemsPage /></DashboardLayout></ProtectedRoute>} />
            <Route path="/items/new" element={<ProtectedRoute><DashboardLayout><NewItemForm /></DashboardLayout></ProtectedRoute>} />
            <Route path="/brands-manufacturers" element={<ProtectedRoute><DashboardLayout><BrandManufacturerManagementPage /></DashboardLayout></ProtectedRoute>} />
            <Route path="/items/:id" element={<ProtectedRoute><DashboardLayout><ItemDetailPage /></DashboardLayout></ProtectedRoute>} />
            <Route path="/items/:id/edit" element={<ProtectedRoute><DashboardLayout><NewItemForm /></DashboardLayout></ProtectedRoute>} />
            <Route path="/items/new-category" element={<ProtectedRoute><DashboardLayout><ComingSoonPage /></DashboardLayout></ProtectedRoute>} />
            <Route path="/items/transfer-order" element={<ProtectedRoute><DashboardLayout><TransferOrderPage /></DashboardLayout></ProtectedRoute>} />
            <Route path="/items/bin-locations" element={<ProtectedRoute><DashboardLayout><BinLocationsPage /></DashboardLayout></ProtectedRoute>} />

            {/* Transfer Orders Routes (Inventory Module) */}
            <Route path="/inventory/transfer-orders" element={<ProtectedRoute><DashboardLayout><TransferOrdersPage /></DashboardLayout></ProtectedRoute>} />
            <Route path="/inventory/transfer-orders/new" element={<ProtectedRoute><DashboardLayout><NewTransferOrderForm /></DashboardLayout></ProtectedRoute>} />
            <Route path="/inventory/transfer-orders/:id" element={<ProtectedRoute><DashboardLayout><TransferOrderDetailPage /></DashboardLayout></ProtectedRoute>} />
            <Route path="/inventory/transfer-orders/edit/:id" element={<ProtectedRoute><DashboardLayout><NewTransferOrderForm /></DashboardLayout></ProtectedRoute>} />

            {/* Purchase Routes */}
            <Route path="/purchases" element={<ProtectedRoute><DashboardLayout><PurchasesPage /></DashboardLayout></ProtectedRoute>} />
            <Route path="/purchases/vendor-management" element={<ProtectedRoute><DashboardLayout><VendorManagementPage /></DashboardLayout></ProtectedRoute>} />
            <Route path="/purchases/po" element={<ProtectedRoute><DashboardLayout><PurchaseOrderPage /></DashboardLayout></ProtectedRoute>} />
            <Route path="/purchases/bills" element={<ProtectedRoute><DashboardLayout><BillsPage /></DashboardLayout></ProtectedRoute>} />
            <Route path="/purchases/bills/new" element={<ProtectedRoute><DashboardLayout><NewBillForm /></DashboardLayout></ProtectedRoute>} />
            <Route path="/purchases/bills/:id" element={<ProtectedRoute><DashboardLayout><BillDetailPage /></DashboardLayout></ProtectedRoute>} />
            <Route path="/purchases/bills/:id/edit" element={<ProtectedRoute><DashboardLayout><NewBillForm /></DashboardLayout></ProtectedRoute>} />
            <Route path="/purchases/payment-made" element={<ProtectedRoute><DashboardLayout><PaymentMadePage /></DashboardLayout></ProtectedRoute>} />
            <Route path="/purchases/payments-made" element={<ProtectedRoute><DashboardLayout><PaymentMadePage /></DashboardLayout></ProtectedRoute>} />
            <Route path="/purchases/payments-made/new" element={<ProtectedRoute><DashboardLayout><NewPaymentForm /></DashboardLayout></ProtectedRoute>} />
            <Route path="/purchases/payments-made/:id" element={<ProtectedRoute><DashboardLayout><PaymentMadeDetailPage /></DashboardLayout></ProtectedRoute>} />
            <Route path="/purchases/payments-made/edit/:id" element={<ProtectedRoute><DashboardLayout><NewPaymentForm /></DashboardLayout></ProtectedRoute>} />
            <Route path="/purchases/vendor-credits" element={<ProtectedRoute><DashboardLayout><VendorCreditsPage /></DashboardLayout></ProtectedRoute>} />
            <Route path="/purchases/vendor-credits/new" element={<ProtectedRoute><DashboardLayout><NewVendorCreditForm /></DashboardLayout></ProtectedRoute>} />
            <Route path="/purchases/vendor-credits/:id" element={<ProtectedRoute><DashboardLayout><VendorCreditDetailPage /></DashboardLayout></ProtectedRoute>} />
            <Route path="/purchases/ledger-account" element={<ProtectedRoute><DashboardLayout><PurchasesPage /></DashboardLayout></ProtectedRoute>} />

            {/* Vendor Management Routes */}
            <Route path="/vendor-management" element={<ProtectedRoute><DashboardLayout><VendorManagementPage /></DashboardLayout></ProtectedRoute>} />
            <Route path="/vendor-management/new" element={<ProtectedRoute><DashboardLayout><NewVendorForm /></DashboardLayout></ProtectedRoute>} />
            <Route path="/vendor-management/:id" element={<ProtectedRoute><DashboardLayout><VendorDetailPage /></DashboardLayout></ProtectedRoute>} />
            <Route path="/vendor-management/:id/edit" element={<ProtectedRoute><DashboardLayout><NewVendorForm /></DashboardLayout></ProtectedRoute>} />

            {/* Customer Management Routes */}
            <Route path="/sales/customers" element={<ProtectedRoute><DashboardLayout><CustomerManagementPage /></DashboardLayout></ProtectedRoute>} />
            <Route path="/sales/customers/new" element={<ProtectedRoute><DashboardLayout><NewCustomerForm /></DashboardLayout></ProtectedRoute>} />
            <Route path="/sales/customers/:id" element={<ProtectedRoute><DashboardLayout><CustomerDetailPage /></DashboardLayout></ProtectedRoute>} />
            <Route path="/sales/customers/:id/edit" element={<ProtectedRoute><DashboardLayout><EditCustomerForm /></DashboardLayout></ProtectedRoute>} />

            {/* Purchase Order Routes */}
            <Route path="/purchase-orders" element={<ProtectedRoute><DashboardLayout><PurchaseOrderPage /></DashboardLayout></ProtectedRoute>} />
            <Route path="/purchase-orders/new" element={<ProtectedRoute><DashboardLayout><NewPurchaseOrderForm /></DashboardLayout></ProtectedRoute>} />
            <Route path="/purchase-orders/:id" element={<ProtectedRoute><DashboardLayout><PurchaseOrderDetailPage /></DashboardLayout></ProtectedRoute>} />
            <Route path="/purchase-orders/:id/edit" element={<ProtectedRoute><DashboardLayout><NewPurchaseOrderForm /></DashboardLayout></ProtectedRoute>} />

            {/* Sales Routes */}
            <Route path="/sales" element={<ProtectedRoute><DashboardLayout><SalesPage /></DashboardLayout></ProtectedRoute>} />
            <Route path="/sales/sales" element={<ProtectedRoute><DashboardLayout><SalesPage /></DashboardLayout></ProtectedRoute>} />

            {/* ONLY ADDED THIS POS ROUTE */}
            <Route path="/sales/pos" element={<ProtectedRoute><DashboardLayout><PosPage /></DashboardLayout></ProtectedRoute>} />
            <Route path="/sales/pos/new" element={<ProtectedRoute><DashboardLayout><PosCreate /></DashboardLayout></ProtectedRoute>} />
            <Route path="/sales/pos/sessions/:sessionId" element={<ProtectedRoute><DashboardLayout><SessionDetailPage /></DashboardLayout></ProtectedRoute>} />

            <Route path="/sales/sales-order" element={<ProtectedRoute><DashboardLayout><SalesOrderPage /></DashboardLayout></ProtectedRoute>} />
            <Route path="/sales/sales-orders" element={<ProtectedRoute><DashboardLayout><SalesOrdersPage /></DashboardLayout></ProtectedRoute>} />
            <Route path="/sales/sales-orders/new" element={<ProtectedRoute><DashboardLayout><NewSalesOrderForm /></DashboardLayout></ProtectedRoute>} />
            <Route path="/sales/sales-orders/:id" element={<ProtectedRoute><DashboardLayout><SalesOrderDetailPage /></DashboardLayout></ProtectedRoute>} />
            <Route path="/sales/invoices" element={<ProtectedRoute><DashboardLayout><InvoicesPage /></DashboardLayout></ProtectedRoute>} />
            <Route path="/sales/invoices/new" element={<ProtectedRoute><DashboardLayout><NewInvoiceForm /></DashboardLayout></ProtectedRoute>} />
            <Route path="/sales/invoices/:id" element={<ProtectedRoute><DashboardLayout><InvoiceDetailPage /></DashboardLayout></ProtectedRoute>} />
            <Route path="/sales/invoices/:id/edit" element={<ProtectedRoute><DashboardLayout><NewInvoiceForm /></DashboardLayout></ProtectedRoute>} />
            <Route path="/sales/payment-received" element={<ProtectedRoute><DashboardLayout><PaymentsReceivedPage /></DashboardLayout></ProtectedRoute>} />
            <Route path="/sales/payment-received/new" element={<ProtectedRoute><DashboardLayout><NewPaymentReceivedForm /></DashboardLayout></ProtectedRoute>} />
            <Route path="/sales/payment-received/:id" element={<ProtectedRoute><DashboardLayout><PaymentReceivedDetailPage /></DashboardLayout></ProtectedRoute>} />
            <Route path="/sales/payment-received/:id/edit" element={<ProtectedRoute><DashboardLayout><NewPaymentReceivedForm /></DashboardLayout></ProtectedRoute>} />

            {/* Delivery Challan Routes (Logistics Module) */}
            <Route path="/logistics/delivery-challan" element={<ProtectedRoute><DashboardLayout><DeliveryChallansPage /></DashboardLayout></ProtectedRoute>} />
            <Route path="/logistics/delivery-challan/:id" element={<ProtectedRoute><DashboardLayout><DeliveryChallanDetailPage /></DashboardLayout></ProtectedRoute>} />
            <Route path="/logistics/delivery-challan/:id/edit" element={<ProtectedRoute><DashboardLayout><NewDeliveryChallanForm /></DashboardLayout></ProtectedRoute>} />
            <Route path="/logistics/create-delivery-challan" element={<ProtectedRoute><DashboardLayout><NewDeliveryChallanForm /></DashboardLayout></ProtectedRoute>} />

            <Route path="/expenses" element={<ProtectedRoute><DashboardLayout><ExpensesPage /></DashboardLayout></ProtectedRoute>} />
            <Route path="/expenses/new" element={<ProtectedRoute><DashboardLayout><NewExpenseForm /></DashboardLayout></ProtectedRoute>} />
            <Route path="/expenses/:id" element={<ProtectedRoute><DashboardLayout><ExpenseDetailPage /></DashboardLayout></ProtectedRoute>} />
            <Route path="/tasks" element={<ProtectedRoute><DashboardLayout><TasksPage /></DashboardLayout></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><DashboardLayout><ReportsPage /></DashboardLayout></ProtectedRoute>} />
            <Route path="/reports/:reportId" element={<ProtectedRoute><DashboardLayout><ReportViewerPage /></DashboardLayout></ProtectedRoute>} />
            <Route path="/search" element={<ProtectedRoute><DashboardLayout><SearchPage /></DashboardLayout></ProtectedRoute>} />
            <Route path="/ai-reporting" element={<ProtectedRoute><DashboardLayout><AIReportingPage /></DashboardLayout></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><DashboardLayout><SettingsPage /></DashboardLayout></ProtectedRoute>} />
          </Routes>
        </DateFilterProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
