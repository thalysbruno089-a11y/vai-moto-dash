import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";
import { BillsNotificationProvider } from "@/components/bills/BillsNotificationProvider";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Motorcyclists from "./pages/Motorcyclists";
import Clients from "./pages/Clients";
import Bills from "./pages/Bills";
import CashFlow from "./pages/CashFlow";
import Categories from "./pages/Categories";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import LoansLent from "./pages/LoansLent";
import LoansBorrowed from "./pages/LoansBorrowed";
import MotorcycleRentals from "./pages/MotorcycleRentals";
import MotorcycleExpenses from "./pages/MotorcycleExpenses";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <BillsNotificationProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
            <Route path="/auth" element={<Auth />} />
              <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/motorcyclists" element={<ProtectedRoute><Motorcyclists /></ProtectedRoute>} />
              <Route path="/clients" element={<ProtectedRoute allowEmployee><Clients /></ProtectedRoute>} />
              <Route path="/bills" element={<ProtectedRoute><Bills /></ProtectedRoute>} />
              <Route path="/cash-flow" element={<ProtectedRoute><CashFlow /></ProtectedRoute>} />
              <Route path="/categories" element={<ProtectedRoute><Categories /></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
              <Route path="/settings" element={<AdminRoute><Settings /></AdminRoute>} />
              <Route path="/loans-lent" element={<AdminRoute><LoansLent /></AdminRoute>} />
              <Route path="/loans-borrowed" element={<AdminRoute><LoansBorrowed /></AdminRoute>} />
              <Route path="/motorcycle-rentals" element={<AdminRoute><MotorcycleRentals /></AdminRoute>} />
              <Route path="/motorcycle-expenses" element={<AdminRoute><MotorcycleExpenses /></AdminRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </BillsNotificationProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
