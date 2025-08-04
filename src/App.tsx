import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './components/Dashboard/DashboardLayout';
import Overview from './components/Dashboard/Overview';
import ClientDetailsPage from './pages/ClientDetailsPage';
import UnscheduledRequests from './pages/UnscheduledRequests';
import PhotoListPage from './pages/PhotoListPage';
import StaffList from './pages/StaffList';
import ProductPerformancePage from './pages/ProductPerformancePage';
import ProductPerformanceGraphPage from './pages/ProductPerformanceGraphPage';

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
import PurchaseOrderPage from './pages/PurchaseOrderPage';
import PurchaseOrdersPage from './pages/PurchaseOrdersPage';
import PurchaseOrderDetailsPage from './pages/PurchaseOrderDetailsPage';
import CreateCustomerOrderPage from './pages/CreateCustomerOrderPage';
import CustomerOrdersPage from './pages/CustomerOrdersPage';
import ReceiveItemsPage from './pages/ReceiveItemsPage';
import StoreInventoryPage from './pages/StoreInventoryPage';
import UpdateStockQuantityPage from './pages/UpdateStockQuantityPage';
import PayablesPage from './pages/PayablesPage';
import CreateInvoicePage from './pages/CreateInvoicePage';
import ReceivablesPage from './pages/ReceivablesPage';
import ProfitLossReportPage from './pages/ProfitLossReportPage';
import AddExpensePage from './pages/AddExpensePage';
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
import PendingPaymentsPage from './pages/PendingPaymentsPage';
import GeneralLedgerReportPage from './pages/GeneralLedgerReportPage';
import InventoryTransactionsPage from './pages/InventoryTransactionsPage';
import InventoryAsOfPage from './pages/InventoryAsOfPage';
import StockTransferPage from './pages/StockTransferPage';
import StockTransferHistoryPage from './pages/StockTransferHistoryPage';
import StockTakePage from './pages/StockTakePage';
import StockTakeHistoryPage from './pages/StockTakeHistoryPage';
import ClientsWithBalancesPage from './pages/ClientsWithBalancesPage';
import CustomerLedgerPage from './pages/CustomerLedgerPage';
import CustomerPaymentsPage from './pages/CustomerPaymentsPage';
import UnconfirmedPaymentsPage from './pages/UnconfirmedPaymentsPage';
import ReceivablesCustomerPage from './pages/ReceivablesCustomerPage';
import SuppliersPage from './pages/SuppliersPage';
import SupplierInvoicesPage from './pages/SupplierInvoicesPage';
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
import SalesRepPerformancePage from './pages/SalesRepPerformancePage';
import SharedPerformancePage from './pages/SharedPerformancePage';
import ManagersPerformancePage from './pages/ManagersPerformancePage';
import SalesRepPerformanceGraphPage from './pages/SalesRepPerformanceGraphPage';
import ClientActivityPage from './pages/ClientActivityPage';
import AssetsPage from './pages/AssetsPage';
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
import RoleBasedRoute from './components/RoleBasedRoute';
import UploadDocumentPage from './pages/UploadDocumentPage';
import EmployeeDocumentsPage from './pages/EmployeeDocumentsPage';
import InventorySalesPage from './pages/InventorySalesPage';
import MyVisibilityPage from './pages/MyVisibilityPage';
import EmployeeWorkingHoursPage from './pages/EmployeeWorkingHoursPage';
import EmployeeWorkingDaysPage from './pages/EmployeeWorkingDaysPage';
import OutOfOfficeRequestsPage from './pages/OutOfOfficeRequestsPage';
import AddJournalEntryPage from './pages/AddJournalEntryPage';

// Protected route wrapper
const ProtectedRoute = () => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

// Redirect authenticated users away from login
const LoginRoute = () => {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/" replace />;
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
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginRoute />} />
      
      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardWrapper />}>
          <Route path="/" element={<FinancialDashboardPage />} />
          <Route path="/dashboard" element={<FinancialDashboardPage />} />
          <Route path="/financial" element={<FinancialDashboardPage />} />
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
          <Route path="/receive-items/:purchaseOrderId" element={<ReceiveItemsPage />} />
          <Route path="/store-inventory" element={<StoreInventoryPage />} />
        <Route path="/update-stock-quantity" element={<UpdateStockQuantityPage />} />
          <Route 
            path="/inventory-staff-dashboard" 
            element={
              <RoleBasedRoute allowedRoles={['stock', 'admin']} fallbackPath="/">
                <InventoryStaffDashboardPage />
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
          <Route path="/payables" element={<PayablesPage />} />
          <Route path="/pending-payments" element={<PendingPaymentsPage />} />
          <Route path="/receivables" element={<ReceivablesPage />} />
          <Route path="/receivables/customer/:customerId" element={<ReceivablesCustomerPage />} />
          <Route path="/reports" element={<FinancialReportsIndexPage />} />
          <Route path="/reports/profit-loss" element={<ProfitLossReportPage />} />
          <Route path="/reports/balance-sheet" element={<BalanceSheetReportPage />} />
          <Route path="/reports/cash-flow" element={<CashFlowReportPage />} />
          <Route path="/reports/general-ledger" element={<GeneralLedgerReportPage />} />
          <Route path="/create-invoice" element={<CreateInvoicePage />} />
          <Route path="/add-expense" element={<AddExpensePage />} />
          <Route path="/assets/add" element={<AddAssetPage />} />
          <Route path="/assets/depreciation" element={<AssetDepreciationPage />} />
          <Route path="/depreciation/manage" element={<DepreciationManagementPage />} />
          <Route path="/equity/manage" element={<AddEquityPage />} />
          <Route path="/equity/entries" element={<EquityEntryPage />} />
          <Route path="/cash-equivalents" element={<CashAndEquivalentsPage />} />
          <Route path="/cash-account-details/:accountId" element={<CashAccountDetailsPage />} />
          <Route path="/all-orders" element={<AllOrdersPage />} />
          <Route path="/sales-orders/:id" element={<SalesOrderDetailsPage />} />
          <Route path="/journal-entries" element={<JournalEntriesPage />} />
          <Route path="/payroll-management" element={<PayrollManagementPage />} />
          <Route path="/inventory-transactions" element={<InventoryTransactionsPage />} />
          <Route path="/inventory-as-of" element={<InventoryAsOfPage />} />
          <Route path="/stock-transfer" element={<StockTransferPage />} />
          <Route path="/stock-transfer-history" element={<StockTransferHistoryPage />} />
          <Route path="/stock-take" element={<StockTakePage />} />
          <Route path="/stock-take-history" element={<StockTakeHistoryPage />} />
          <Route path="/clients-with-balances" element={<ClientsWithBalancesPage />} />
          <Route path="/customers/:id/ledger" element={<CustomerLedgerPage />} />
          <Route path="/customers/:id/payments" element={<CustomerPaymentsPage />} />
          <Route path="/unconfirmed-payments" element={<UnconfirmedPaymentsPage />} />
          <Route path="/clients" element={<ClientsList />} />
          <Route path="/clients-list" element={<ClientsListPage />} />
          <Route path="/clients-map" element={<ClientsMapPage />} />
          <Route path="/suppliers" element={<SuppliersPage />} />
          <Route path="/suppliers/:supplierId/invoices" element={<SupplierInvoicesPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/sales-dashboard" element={<SalesDashboardPage />} />
                                <Route path="/master-sales" element={<MasterSalesPage />} />
                      <Route path="/sales-rep-master-report" element={<SalesRepMasterReportPage />} />
                      <Route path="/sales-rep-reports/:salesRepId/:clientId" element={<SalesRepReportsPage />} />
                      <Route path="/products-sale-report" element={<ProductsSaleReportPage />} />
          <Route path="/sales-reps" element={<SalesRepsPage />} />
          <Route path="/sales-reps/:id" element={<SalesRepDetailsPage />} />
          <Route path="/managers" element={<ManagersPage />} />
          <Route path="/hr-dashboard" element={<HrDashboardPage />} />
          <Route path="/visibility-report" element={<VisibilityReportPage />} />
          <Route path="/my-visibility" element={<MyVisibilityPage />} />
          <Route path="/feedback-reports" element={<FeedbackReportPage />} />
          <Route path="/availability-reports" element={<AvailabilityReportPage />} />
          <Route path="/client-activity" element={<ClientActivityPage />} />
          <Route path="/assets" element={<AssetsPage />} />
          <Route path="/expenses" element={<ExpensesPage />} />
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
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;