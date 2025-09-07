import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './components/Dashboard/DashboardLayout';
import ClientDetailsPage from './pages/ClientDetailsPage';
import UnscheduledRequests from './pages/UnscheduledRequests';
import PhotoListPage from './pages/PhotoListPage';
import StaffList from './pages/StaffList';
import ProductPerformancePage from './pages/ProductPerformancePage';
import ProductPerformanceGraphPage from './pages/ProductPerformanceGraphPage';
import AutoLogout from './components/AutoLogout';

import TeamsList from './pages/TeamList';
import ClientsList from './pages/ClientsPage';
import ClaimsPage from './pages/ClaimsPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import Layout from './components/Layout/Layout';
import { useAuth } from './contexts/AuthContext';
import PendingRequests from './pages/PendingRequests';
import InTransitRequests from './pages/InTransitRequests';
import AddClientPage from './pages/AddClientPage';
import ClientBranchesPage from './pages/ClientBranchesPage';
import FinancialDashboardPage from './pages/FinancialDashboardPage';
import ExecutiveDashboardPage from './pages/ExecutiveDashboardPage';
import PurchaseOrderPage from './pages/PurchaseOrderPage';
import PurchaseOrdersPage from './pages/PurchaseOrdersPage';
import PurchaseOrderDetailsPage from './pages/PurchaseOrderDetailsPage';
import CreateCustomerOrderPage from './pages/CreateCustomerOrderPage';
import CustomerOrdersPage from './pages/CustomerOrdersPage';
import ReceiveItemsPage from './pages/ReceiveItemsPage';
import StoreInventoryPage from './pages/StoreInventoryPage';
import PayablesPage from './pages/PayablesPage';
import CreateInvoicePage from './pages/CreateInvoicePage';
import InvoiceListPage from './pages/InvoiceListPage';
import ReceivablesPage from './pages/ReceivablesPage';
import ProfitLossReportPage from './pages/ProfitLossReportPage';
import AddExpensePage from './pages/AddExpensePage';
import ExpenseSummaryPage from './pages/ExpenseSummaryPage';
import ExpenseInvoicePage from './pages/ExpenseInvoicePage';
import PendingPaymentsPage from './pages/PendingPaymentsPage';
import AddAssetPage from './pages/AddAssetPage';
import BalanceSheetReportPage from './pages/BalanceSheetReportPage';
import CashFlowReportPage from './pages/CashFlowReportPage';
import FinancialReportsIndexPage from './pages/FinancialReportsIndexPage';
import AssetDepreciationPage from './pages/AssetDepreciationPage';
import DepreciationManagementPage from './pages/DepreciationManagementPage';
import AddEquityPage from './pages/AddEquityPage';
import EquityEntryPage from './pages/EquityEntryPage';
import AllOrdersPage from './pages/AllOrdersPage';
import SalesOrderDetailsPage from './pages/SalesOrderDetailsPage';
import CashAndEquivalentsPage from './pages/CashAndEquivalentsPage';
import CashAccountDetailsPage from './pages/CashAccountDetailsPage';
import JournalEntriesPage from './pages/JournalEntriesPage';
import PayrollManagementPage from './pages/PayrollManagementPage';
import GeneralLedgerReportPage from './pages/GeneralLedgerReportPage';
import CollectionReportPage from './pages/CollectionReportPage';
import UnconfirmedPaymentsPage from './pages/UnconfirmedPaymentsPage';
import InventoryTransactionsPage from './pages/InventoryTransactionsPage';
import InventoryAsOfPage from './pages/InventoryAsOfPage';
import StockTransferPage from './pages/StockTransferPage';
import StockTransferHistoryPage from './pages/StockTransferHistoryPage';
import StockTakePage from './pages/StockTakePage';
import StockTakeHistoryPage from './pages/StockTakeHistoryPage';
import OpeningQuantitiesPage from './pages/OpeningQuantitiesPage';
import ClientsWithBalancesPage from './pages/ClientsWithBalancesPage';
import CustomerLedgerPage from './pages/CustomerLedgerPage';
import CustomerPaymentsPage from './pages/CustomerPaymentsPage';
import ReceivablesCustomerPage from './pages/ReceivablesCustomerPage';
import SuppliersPage from './pages/SuppliersPage';
import SupplierInvoicesPage from './pages/SupplierInvoicesPage';
import SupplierInvoicePage from './pages/SupplierInvoicePage';
import SupplierLedgerPage from './pages/SupplierLedgerPage';
import ProductsPage from './pages/ProductsPage';
import CategoriesPage from './pages/CategoriesPage';
import SalesDashboardPage from './pages/SalesDashboardPage';
import SalesRepsPage from './pages/SalesRepsPage';
import ManagersPage from './pages/ManagersPage';
import SalesRepDetailsPage from './pages/SalesRepDetailsPage';
import ClientsListPage from './pages/ClientsListPage';
import HrDashboardPage from './pages/HrDashboardPage';
import ClientsMapPage from './pages/ClientsMapPage';
import NoticesPage from './pages/NoticesPage';
import TasksPage from './pages/TasksPage';
import MyAccountPage from './pages/MyAccountPage';
import LeaveRequestsPage from './pages/LeaveRequestsPage';
import DocumentListPage from './pages/DocumentListPage';
import ChatRoomPage from './pages/ChatRoomPage';
import AttendanceHistoryPage from './pages/AttendanceHistoryPage';
import EmployeeWarningsPage from './pages/EmployeeWarningsPage';
import ExpiringContractsPage from './pages/ExpiringContractsPage';
import EmployeeLeavesPage from './pages/EmployeeLeavesPage';
import SalesReportPage from './pages/SalesReportPage';
import VisibilityReportPage from './pages/VisibilityReportPage';
import FeedbackReportPage from './pages/FeedbackReportPage';
import AvailabilityReportPage from './pages/AvailabilityReportPage';
import SalesRepLeavesPage from './pages/SalesRepLeavesPage';
import SalesRepWorkingDaysPage from './pages/SalesRepWorkingDaysPage';
import SalesRepAttendancePage from './pages/SalesRepAttendancePage';
import OverallAttendancePage from './pages/OverallAttendancePage';
import MyReportsPage from './pages/MyReportsPage';
import SalesRepPerformancePage from './pages/SalesRepPerformancePage';
import SharedPerformancePage from './pages/SharedPerformancePage';
import ManagersPerformancePage from './pages/ManagersPerformancePage';
import SalesRepPerformanceGraphPage from './pages/SalesRepPerformanceGraphPage';
import ClientActivityPage from './pages/ClientActivityPage';
import AssetsPage from './pages/AssetsPage';
import JourneyPlanPage from './pages/JourneyPlanPage';
import RouteCoveragePage from './pages/RouteCoveragePage';
import RouteReportPage from './pages/RouteReportPage';
import ExpensesPage from './pages/ExpensesPage';
import ClientProfilePage from './pages/ClientProfilePage';
import MasterSalesPage from './pages/MasterSalesPage';
import SalesRepMasterReportPage from './pages/SalesRepMasterReportPage';
import SalesRepReportsPage from './pages/SalesRepReportsPage';
import ProductsSaleReportPage from './pages/ProductsSaleReportPage';
import PostReceiptPage from './pages/PostReceiptPage';
import ViewReceiptsPage from './pages/ViewReceiptsPage';
import SuppliersManagementPage from './pages/SuppliersManagementPage';
import MyAssetsPage from './pages/MyAssetsPage';
import PostFaultyProductsPage from './pages/PostFaultyProductsPage';
import ViewFaultyReportsPage from './pages/ViewFaultyReportsPage';
import InventoryStaffDashboardPage from './pages/InventoryStaffDashboardPage';
import MerchandisePage from './pages/MerchandisePage';
import RoleBasedRoute from './components/RoleBasedRoute';
import UploadDocumentPage from './pages/UploadDocumentPage';
import EmployeeDocumentsPage from './pages/EmployeeDocumentsPage';
import RidersPage from './pages/RidersPage';
import InventorySalesPage from './pages/InventorySalesPage';
import InventorySalesOrderDetailsPage from './pages/InventorySalesOrderDetailsPage';
import DeliveryNotePage from './pages/DeliveryNotePage';
import DeliveryNoteDetailsPage from './pages/DeliveryNoteDetailsPage';
import MyVisibilityPage from './pages/MyVisibilityPage';
import EmployeeWorkingHoursPage from './pages/EmployeeWorkingHoursPage';
import EmployeeWorkingDaysPage from './pages/EmployeeWorkingDaysPage';
import OutOfOfficeRequestsPage from './pages/OutOfOfficeRequestsPage';
import AddJournalEntryPage from './pages/AddJournalEntryPage';
import CreditNotesPage from './pages/CreditNotesPage';
import CreateCreditNotePage from './pages/CreateCreditNotePage';
import ClientCreditNotePage from './pages/ClientCreditNotePage';
import CreditNoteSummaryPage from './pages/CreditNoteSummaryPage';
import CreditNoteDetailsPage from './pages/CreditNoteDetailsPage';
import RoutesPage from './pages/RoutesPage';

// Protected route wrapper
const ProtectedRoute = () => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

// Role-based dashboard redirect component
const RoleBasedDashboardRedirect = () => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect users to their appropriate dashboard based on role
  if (user.role === 'sales') {
    return <Navigate to="/sales-dashboard" replace />;
  } else if (user.role === 'hr') {
    return <Navigate to="/hr-dashboard" replace />;
  } else if (user.role === 'stock') {
    return <Navigate to="/inventory-staff-dashboard" replace />;
  } else if (user.role === 'executive') {
    return <Navigate to="/executive-dashboard" replace />;
  } else {
    // Admin and other roles can access FinancialDashboard
    return <FinancialDashboardPage />;
  }
};

// Redirect authenticated users away from login
const LoginRoute = () => {
  const { user } = useAuth();

  if (user) {
    // Redirect users to their appropriate dashboard based on role
    if (user.role === 'sales') {
      return <Navigate to="/sales-dashboard" replace />;
    } else if (user.role === 'hr') {
      return <Navigate to="/hr-dashboard" replace />;
    } else if (user.role === 'stock') {
      return <Navigate to="/inventory-staff-dashboard" replace />;
    } else if (user.role === 'executive') {
      return <Navigate to="/executive-dashboard" replace />;
    } else {
      // Admin and other roles go to FinancialDashboard
      return <Navigate to="/" replace />;
    }
  }

  return <LoginPage />;
};

// Dashboard layout wrapper
const DashboardWrapper = () => {
  return (
    <Layout>
      <DashboardLayout />
    </Layout>
  );
};

const App = () => {
  return (
    <>
      <AutoLogout />
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginRoute />} />
        
        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardWrapper />}>
            <Route path="/" element={<RoleBasedDashboardRedirect />} />
            <Route path="/dashboard" element={<RoleBasedDashboardRedirect />} />
            <Route path="/financial" element={<RoleBasedDashboardRedirect />} />
            <Route path="/dashboard/unscheduled" element={<UnscheduledRequests />} />
            <Route path="/dashboard/pending" element={<PendingRequests />} />
            <Route path="/dashboard/in-transit" element={<InTransitRequests />} />
            <Route path="/dashboard/photo-list" element={<PhotoListPage />} />
            <Route path="/dashboard/staff-list" element={<StaffList/>} />
            <Route path="/notices" element={<NoticesPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/my-account" element={<MyAccountPage />} />
            <Route path="/leave-requests" element={<LeaveRequestsPage />} />
            <Route path="/document-list" element={<DocumentListPage />} />
            <Route path="/chat-room" element={<ChatRoomPage />} />
            <Route path="/attendance-history" element={<AttendanceHistoryPage />} />
            <Route path="/dashboard/employee-warnings" element={<EmployeeWarningsPage />} />
            <Route path="/dashboard/expiring-contracts" element={<ExpiringContractsPage />} />
            <Route path="/dashboard/employee-leaves" element={<EmployeeLeavesPage />} />
            <Route path="/sales-rep-leaves" element={<SalesRepLeavesPage />} />
            <Route path="/sales-rep-working-days" element={<SalesRepWorkingDaysPage />} />
            <Route path="/sales-rep-attendance" element={<SalesRepAttendancePage />} />
            <Route path="/overall-attendance" element={<OverallAttendancePage />} />
            <Route path="/sales-rep-performance" element={<SalesRepPerformancePage />} />
            <Route path="/sales-rep-performance-graph" element={<SalesRepPerformanceGraphPage />} />
            <Route path="/shared-performance" element={<SharedPerformancePage />} />
            <Route path="/managers-performance" element={<ManagersPerformancePage />} />
            <Route path="/employee-working-hours" element={<EmployeeWorkingHoursPage />} />
            <Route path="/employee-working-days" element={<EmployeeWorkingDaysPage />} />
            <Route path="/out-of-office-requests" element={<OutOfOfficeRequestsPage />} />
            <Route path="/add-journal-entry" element={<AddJournalEntryPage />} />

            <Route path="/dashboard/teams-list" element={<TeamsList/>} />
            <Route path="/dashboard/clients-list" element={<ClientsList/>} />
            <Route path="/dashboard/claims" element={<ClaimsPage />} />
            <Route path="/dashboard/reports" element={<ReportsPage />} />
            <Route path="/dashboard/reports/profit-loss" element={<ProfitLossReportPage />} />
            <Route path="/dashboard/reports/balance-sheet" element={<BalanceSheetReportPage />} />
            <Route path="/dashboard/reports/cash-flow" element={<CashFlowReportPage />} />
            <Route path="/dashboard/reports/general-ledger" element={<GeneralLedgerReportPage />} />
            <Route path="/dashboard/reports/sales-report" element={<SalesReportPage />} />
            <Route path="/dashboard/reports/product-performance" element={<ProductPerformancePage />} />
            <Route path="/dashboard/reports/product-performance-graph" element={<ProductPerformanceGraphPage />} />
            <Route path="/dashboard/clients/add" element={<AddClientPage />} />
            <Route path="/dashboard/clients/:id/branches" element={<ClientBranchesPage />} />
        <Route path="/dashboard/journey-plans" element={<JourneyPlanPage />} />
        <Route path="/dashboard/route-coverage/:salesRepId" element={<RouteCoveragePage />} />
        <Route path="/dashboard/route-report/:salesRepId" element={<RouteReportPage />} />
<Route path="/financial/purchase-order" element={<PurchaseOrderPage />} />
            <Route path="/financial/create-customer-order" element={<CreateCustomerOrderPage />} />
            <Route path="/financial/customer-orders" element={<CustomerOrdersPage />} />
            <Route path="/financial/post-receipt" element={<PostReceiptPage />} />
            <Route path="/financial/view-receipts" element={<ViewReceiptsPage />} />
            <Route path="/financial/suppliers" element={<SuppliersManagementPage />} />
            <Route path="/my-assets" element={<MyAssetsPage />} />
            <Route path="/faulty-products" element={
              <RoleBasedRoute allowedRoles={['stock', 'admin']} fallbackPath="/">
                <PostFaultyProductsPage />
              </RoleBasedRoute>
            } />
            <Route path="/faulty-reports" element={
              <RoleBasedRoute allowedRoles={['stock', 'admin']} fallbackPath="/">
                <ViewFaultyReportsPage />
              </RoleBasedRoute>
            } />
            <Route path="/purchase-orders" element={<PurchaseOrdersPage />} />
            <Route path="/purchase-orders/:id" element={<PurchaseOrderDetailsPage />} />
            <Route path="/create-purchase-order" element={
              <RoleBasedRoute allowedRoles={['admin', 'manager', 'accountant']} fallbackPath="/sales-dashboard">
                <PurchaseOrderPage />
              </RoleBasedRoute>
            } />
            <Route path="/supplier-invoice/:id" element={<SupplierInvoicePage />} />
            <Route path="/suppliers/:supplierId/ledger" element={<SupplierLedgerPage />} />
            <Route path="/receive-items/:purchaseOrderId" element={<ReceiveItemsPage />} />
            <Route path="/store-inventory" element={<StoreInventoryPage />} />
            <Route path="/opening-quantities" element={<OpeningQuantitiesPage />} />
            <Route 
              path="/inventory-staff-dashboard" 
              element={
                <RoleBasedRoute allowedRoles={['stock']} fallbackPath="/">
                  <InventoryStaffDashboardPage />
                </RoleBasedRoute>
              } 
            />
            <Route 
              path="/merchandise" 
              element={
                <RoleBasedRoute allowedRoles={['stock', 'admin']} fallbackPath="/">
                  <MerchandisePage />
                </RoleBasedRoute>
              } 
            />
            <Route 
              path="/inventory-sales" 
              element={
                <RoleBasedRoute allowedRoles={['stock', 'admin']} fallbackPath="/">
                  <InventorySalesPage />
                </RoleBasedRoute>
              } 
            />
            <Route 
              path="/inventory-sales/:id" 
              element={
                <RoleBasedRoute allowedRoles={['stock', 'admin']} fallbackPath="/">
                  <InventorySalesOrderDetailsPage />
                </RoleBasedRoute>
              } 
            />
            <Route 
              path="/delivery-notes" 
              element={
                <RoleBasedRoute allowedRoles={['stock', 'admin']} fallbackPath="/">
                  <DeliveryNotePage />
                </RoleBasedRoute>
              } 
            />
            <Route 
              path="/delivery-notes/:id" 
              element={
                <RoleBasedRoute allowedRoles={['stock', 'admin']} fallbackPath="/">
                  <DeliveryNoteDetailsPage />
                </RoleBasedRoute>
              } 
            />
            <Route path="/payables" element={
              <RoleBasedRoute allowedRoles={['admin', 'manager', 'accountant']} fallbackPath="/sales-dashboard">
                <PayablesPage />
              </RoleBasedRoute>
            } />
            <Route path="/receivables" element={
              <RoleBasedRoute allowedRoles={['admin', 'manager', 'accountant', 'stock']} fallbackPath="/sales-dashboard">
                <ReceivablesPage />
              </RoleBasedRoute>
            } />
            <Route path="/receivables/customer/:customerId" element={
              <RoleBasedRoute allowedRoles={['admin', 'manager', 'accountant', 'stock'	]} fallbackPath="/sales-dashboard">
                <ReceivablesCustomerPage />
              </RoleBasedRoute>
            } />
            <Route path="/reports" element={
              <RoleBasedRoute allowedRoles={['admin', 'manager', 'accountant']} fallbackPath="/sales-dashboard">
                <FinancialReportsIndexPage />
              </RoleBasedRoute>
            } />
            <Route path="/reports/profit-loss" element={
              <RoleBasedRoute allowedRoles={['admin', 'manager', 'accountant']} fallbackPath="/sales-dashboard">
                <ProfitLossReportPage />
              </RoleBasedRoute>
            } />
            <Route path="/reports/balance-sheet" element={
              <RoleBasedRoute allowedRoles={['admin', 'manager', 'accountant']} fallbackPath="/sales-dashboard">
                <BalanceSheetReportPage />
              </RoleBasedRoute>
            } />
            <Route path="/reports/cash-flow" element={
              <RoleBasedRoute allowedRoles={['admin', 'manager', 'accountant']} fallbackPath="/sales-dashboard">
                <CashFlowReportPage />
              </RoleBasedRoute>
            } />
            <Route path="/reports/general-ledger" element={
              <RoleBasedRoute allowedRoles={['admin', 'manager', 'accountant']} fallbackPath="/sales-dashboard">
                <GeneralLedgerReportPage />
              </RoleBasedRoute>
            } />
                    <Route path="/reports/collection-report" element={
          <RoleBasedRoute allowedRoles={['admin', 'manager', 'accountant']} fallbackPath="/sales-dashboard">
            <CollectionReportPage />
          </RoleBasedRoute>
        } />
        <Route path="/reports/unconfirmed-payments" element={
          <RoleBasedRoute allowedRoles={['admin', 'manager', 'accountant']} fallbackPath="/sales-dashboard">
            <UnconfirmedPaymentsPage />
          </RoleBasedRoute>
        } />
            <Route path="/create-invoice" element={
              <RoleBasedRoute allowedRoles={['admin', 'manager', 'accountant']} fallbackPath="/sales-dashboard">
                <CreateInvoicePage />
              </RoleBasedRoute>
            } />
            <Route path="/invoice-list" element={
              <RoleBasedRoute allowedRoles={['admin', 'manager', 'accountant', 'sales', 'executive'	]} fallbackPath="/sales-dashboard">
                <InvoiceListPage />
              </RoleBasedRoute>
            } />
            <Route path="/credit-notes" element={
              <RoleBasedRoute allowedRoles={['admin', 'manager', 'accountant', 'executive', 'sales'	]} fallbackPath="/sales-dashboard">
                <CreditNotesPage />
              </RoleBasedRoute>
            } />
            <Route path="/credit-notes/:id" element={
              <RoleBasedRoute allowedRoles={['admin', 'manager', 'accountant', 'executive', 'sales'	]} fallbackPath="/sales-dashboard">
                <CreditNotesPage />
              </RoleBasedRoute>
            } />
            <Route path="/create-credit-note" element={
              <RoleBasedRoute allowedRoles={['admin', 'manager', 'accountant', 'executive']} fallbackPath="/sales-dashboard">
                <CreateCreditNotePage />
              </RoleBasedRoute>
            } />
            <Route path="/clients/:clientId/credit-notes" element={
              <RoleBasedRoute allowedRoles={['admin', 'manager', 'accountant', 'executive', 'sales'	]} fallbackPath="/sales-dashboard">
                <ClientCreditNotePage />
              </RoleBasedRoute>
            } />
            <Route path="/credit-note-summary" element={
              <RoleBasedRoute allowedRoles={['admin', 'manager', 'accountant', 'stock', 'executive', 'sales'	]} fallbackPath="/sales-dashboard">
                <CreditNoteSummaryPage />
              </RoleBasedRoute>
            } />
            <Route path="/credit-note-details/:id" element={
              <RoleBasedRoute allowedRoles={['admin', 'manager', 'accountant', 'stock', 'executive', 'sales'	]} fallbackPath="/sales-dashboard">
                <CreditNoteDetailsPage />
              </RoleBasedRoute>
            } />
            <Route path="/add-expense" element={
              <RoleBasedRoute allowedRoles={['admin', 'manager', 'accountant', 'executive']} fallbackPath="/sales-dashboard">
                <AddExpensePage />
              </RoleBasedRoute>
            } />
            <Route path="/expense-summary" element={
              <RoleBasedRoute allowedRoles={['admin', 'manager', 'accountant', 'executive']} fallbackPath="/sales-dashboard">
                <ExpenseSummaryPage />
              </RoleBasedRoute>
            } />
            <Route path="/expense-invoice/:journal_entry_id" element={
              <RoleBasedRoute allowedRoles={['admin', 'manager', 'accountant', 'executive'	]} fallbackPath="/sales-dashboard">
                <ExpenseInvoicePage />
              </RoleBasedRoute>
            } />
            <Route path="/pending-payments" element={
              <RoleBasedRoute allowedRoles={['admin', 'manager', 'accountant']} fallbackPath="/sales-dashboard">
                <PendingPaymentsPage />
              </RoleBasedRoute>
            } />
            <Route path="/assets/add" element={
              <RoleBasedRoute allowedRoles={['admin', 'manager', 'accountant']} fallbackPath="/sales-dashboard">
                <AddAssetPage />
              </RoleBasedRoute>
            } />
            <Route path="/assets/depreciation" element={
              <RoleBasedRoute allowedRoles={['admin', 'manager', 'accountant']} fallbackPath="/sales-dashboard">
                <AssetDepreciationPage />
              </RoleBasedRoute>
            } />
            <Route path="/depreciation/manage" element={
              <RoleBasedRoute allowedRoles={['admin', 'manager', 'accountant']} fallbackPath="/sales-dashboard">
                <DepreciationManagementPage />
              </RoleBasedRoute>
            } />
            <Route path="/equity/manage" element={
              <RoleBasedRoute allowedRoles={['admin', 'manager', 'accountant']} fallbackPath="/sales-dashboard">
                <AddEquityPage />
              </RoleBasedRoute>
            } />
            <Route path="/equity/entries" element={
              <RoleBasedRoute allowedRoles={['admin', 'manager', 'accountant']} fallbackPath="/sales-dashboard">
                <EquityEntryPage />
              </RoleBasedRoute>
            } />
            <Route path="/cash-equivalents" element={
              <RoleBasedRoute allowedRoles={['admin', 'manager', 'accountant']} fallbackPath="/sales-dashboard">
                <CashAndEquivalentsPage />
              </RoleBasedRoute>
            } />
            <Route path="/cash-account-details/:accountId" element={
              <RoleBasedRoute allowedRoles={['admin', 'manager', 'accountant']} fallbackPath="/sales-dashboard">
                <CashAccountDetailsPage />
              </RoleBasedRoute>
            } />
            <Route path="/all-orders" element={
              <RoleBasedRoute allowedRoles={['admin', 'manager', 'accountant', 'stock', 'sales', 'executive'	]} fallbackPath="/sales-dashboard">
                <AllOrdersPage />
              </RoleBasedRoute>
            } />
            <Route path="/sales-orders/:id" element={
              <RoleBasedRoute allowedRoles={['admin', 'manager', 'accountant', 'sales', 'stock']} fallbackPath="/sales-dashboard">
                <SalesOrderDetailsPage />
              </RoleBasedRoute>
            } />
            <Route path="/delivery-note/:id" element={
              <RoleBasedRoute allowedRoles={['admin', 'manager', 'accountant', 'sales', 'stock']} fallbackPath="/sales-dashboard">
                <DeliveryNoteDetailsPage />
              </RoleBasedRoute>
            } />
            <Route path="/journal-entries" element={
              <RoleBasedRoute allowedRoles={['admin', 'manager', 'accountant']} fallbackPath="/sales-dashboard">
                <JournalEntriesPage />
              </RoleBasedRoute>
            } />
            <Route path="/payroll-management" element={
              <RoleBasedRoute allowedRoles={['admin', 'manager', 'accountant']} fallbackPath="/sales-dashboard">
                <PayrollManagementPage />
              </RoleBasedRoute>
            } />
            <Route path="/inventory-transactions" element={
              <RoleBasedRoute allowedRoles={['admin', 'manager', 'accountant', 'stock']} fallbackPath="/sales-dashboard">
                <InventoryTransactionsPage />
              </RoleBasedRoute>
            } />
            <Route path="/inventory-as-of" element={
              <RoleBasedRoute allowedRoles={['admin', 'manager', 'accountant', 'stock']} fallbackPath="/sales-dashboard">
                <InventoryAsOfPage />
              </RoleBasedRoute>
            } />
            <Route path="/stock-transfer" element={
              <RoleBasedRoute allowedRoles={['admin', 'manager', 'accountant']} fallbackPath="/sales-dashboard">
                <StockTransferPage />
              </RoleBasedRoute>
            } />
            <Route path="/stock-transfer-history" element={
              <RoleBasedRoute allowedRoles={['admin', 'manager', 'accountant', 'stock']} fallbackPath="/sales-dashboard">
                <StockTransferHistoryPage />
              </RoleBasedRoute>
            } />
            <Route path="/stock-take" element={
              <RoleBasedRoute allowedRoles={['admin', 'manager', 'accountant', 'stock']} fallbackPath="/sales-dashboard">
                <StockTakePage />
              </RoleBasedRoute>
            } />
            <Route path="/stock-take-history" element={
              <RoleBasedRoute allowedRoles={['admin', 'manager', 'accountant', 'stock']} fallbackPath="/sales-dashboard">
                <StockTakeHistoryPage />
              </RoleBasedRoute>
            } />
            <Route path="/clients-with-balances" element={
              <RoleBasedRoute allowedRoles={['admin', 'manager', 'accountant']} fallbackPath="/sales-dashboard">
                <ClientsWithBalancesPage />
              </RoleBasedRoute>
            } />
            <Route path="/customers/:id/ledger" element={
              <RoleBasedRoute allowedRoles={['admin', 'manager', 'accountant']} fallbackPath="/sales-dashboard">
                <CustomerLedgerPage />
              </RoleBasedRoute>
            } />
            <Route path="/customers/:id/payments" element={
              <RoleBasedRoute allowedRoles={['admin', 'manager', 'accountant']} fallbackPath="/sales-dashboard">
                <CustomerPaymentsPage />
              </RoleBasedRoute>
            } />
            <Route path="/unconfirmed-payments" element={
              <RoleBasedRoute allowedRoles={['admin', 'manager', 'accountant']} fallbackPath="/sales-dashboard">
                <UnconfirmedPaymentsPage />
              </RoleBasedRoute>
            } />
            <Route path="/clients" element={<ClientsList />} />
            <Route path="/clients-list" element={<ClientsListPage />} />
            <Route path="/clients-map" element={<ClientsMapPage />} />
            <Route path="/routes" element={<RoutesPage />} />
            <Route path="/suppliers" element={
              <RoleBasedRoute allowedRoles={['admin', 'manager', 'accountant', 'stock', 'sales', 'executive']} fallbackPath="/sales-dashboard">
                <SuppliersPage />
              </RoleBasedRoute>
            } />
            <Route path="/riders" element={
              <RoleBasedRoute allowedRoles={['admin', 'manager', 'accountant', 'stock']} fallbackPath="/sales-dashboard">
                <RidersPage />
              </RoleBasedRoute>
            } />
            <Route path="/suppliers/:supplierId/invoices" element={
              <RoleBasedRoute allowedRoles={['admin', 'manager', 'accountant', 'sales', 'executive']} fallbackPath="/sales-dashboard">
                <SupplierInvoicesPage />
              </RoleBasedRoute>
            } />
            <Route path="/products" element={
              <RoleBasedRoute allowedRoles={['admin', 'manager', 'accountant', 'sales', 'executive']} fallbackPath="/sales-dashboard">
                <ProductsPage />
              </RoleBasedRoute>
            } />
            <Route path="/categories" element={
              <RoleBasedRoute allowedRoles={['admin', 'manager', 'accountant', 'sales', 'executive']} fallbackPath="/sales-dashboard">
                <CategoriesPage />
              </RoleBasedRoute>
            } />
            <Route path="/sales-dashboard" element={
              <RoleBasedRoute allowedRoles={['sales']} fallbackPath="/">
                <SalesDashboardPage />
              </RoleBasedRoute>
            } />
            <Route path="/master-sales" element={<MasterSalesPage />} />
            <Route path="/sales-rep-master-report" element={<SalesRepMasterReportPage />} />
            <Route path="/sales-rep-reports/:salesRepId/:clientId" element={<SalesRepReportsPage />} />
            <Route path="/products-sale-report" element={<ProductsSaleReportPage />} />
            <Route path="/sales-reps" element={<SalesRepsPage />} />
            <Route path="/sales-reps/:id" element={<SalesRepDetailsPage />} />
            <Route path="/managers" element={<ManagersPage />} />
            <Route path="/hr-dashboard" element={
              <RoleBasedRoute allowedRoles={['hr']} fallbackPath="/">
                <HrDashboardPage />
              </RoleBasedRoute>
            } />
            <Route path="/executive-dashboard" element={
              <RoleBasedRoute allowedRoles={['executive']} fallbackPath="/">
                <ExecutiveDashboardPage />
              </RoleBasedRoute>
            } />
            <Route path="/visibility-report" element={<VisibilityReportPage />} />
            <Route path="/my-visibility" element={<MyVisibilityPage />} />
            <Route path="/feedback-reports" element={<FeedbackReportPage />} />
            <Route path="/my-reports" element={<MyReportsPage />} />
            <Route path="/availability-reports" element={<AvailabilityReportPage />} />
            <Route path="/client-activity" element={<ClientActivityPage />} />
            <Route path="/assets" element={
              <RoleBasedRoute allowedRoles={['admin', 'manager', 'accountant']} fallbackPath="/sales-dashboard">
                <AssetsPage />
              </RoleBasedRoute>
            } />
            <Route path="/expenses" element={
              <RoleBasedRoute allowedRoles={['admin', 'manager', 'accountant']} fallbackPath="/sales-dashboard">
                <ExpensesPage />
              </RoleBasedRoute>
            } />
            <Route path="/client-profile/:id" element={<ClientProfilePage />} />
            <Route path="/dashboard/clients/:id" element={<ClientDetailsPage />} />
            <Route path="/upload-document" element={<UploadDocumentPage />} />
            <Route path="/employee-documents" element={<EmployeeDocumentsPage />} />
          </Route>
          
          <Route path="/settings" element={
            <Layout>
              <SettingsPage />
            </Layout>
          } />
        </Route>
        
        {/* Catch all route */}
        <Route path="*" element={<RoleBasedDashboardRedirect />} />
      </Routes>
    </>
  );
};

export default App; 