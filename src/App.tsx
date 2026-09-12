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
import Contas from "./pages/Contas";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import LoansLent from "./pages/LoansLent";
import LoansBorrowed from "./pages/LoansBorrowed";
import MotorcycleRentals from "./pages/MotorcycleRentals";
import MotorcycleExpenses from "./pages/MotorcycleExpenses";
import DeletionLogs from "./pages/DeletionLogs";
import Ultra from "./pages/Ultra";
import UltraRegistro from "./pages/UltraRegistro";
import SantaLuzia from "./pages/SantaLuzia";
import SantaLuziaRegistro from "./pages/SantaLuziaRegistro";
import Lagoinha from "./pages/Lagoinha";
import LagoinhaRegistro from "./pages/LagoinhaRegistro";
import Burgazzo from "./pages/Burgazzo";
import BurgazzoRegistro from "./pages/BurgazzoRegistro";
import Benefits from "./pages/Benefits";
import Queue from "./pages/Queue";
import QueueTV from "./pages/QueueTV";
import QueueApp from "./pages/QueueApp";
import QueueAdmin from "./pages/QueueAdmin";
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
              <Route path="/beneficios" element={<Benefits />} />
              <Route path="/fila" element={<Queue />} />
              <Route path="/fila/tv" element={<QueueTV />} />
              <Route path="/fila/app" element={<QueueApp />} />
              <Route path="/fila/admin" element={<ProtectedRoute allowFinance={false} allowQueue><QueueAdmin /></ProtectedRoute>} />
              <Route path="/" element={<ProtectedRoute allowFinance={false}><Dashboard /></ProtectedRoute>} />
              <Route path="/motorcyclists" element={<ProtectedRoute allowFinance><Motorcyclists /></ProtectedRoute>} />
              <Route path="/clients" element={<ProtectedRoute allowEmployee allowFinance><Clients /></ProtectedRoute>} />
              <Route path="/contas" element={<ProtectedRoute allowFinance={false}><Contas /></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute allowFinance={false}><Reports /></ProtectedRoute>} />
              <Route path="/settings" element={<AdminRoute><Settings /></AdminRoute>} />
              <Route path="/loans-lent" element={<AdminRoute><LoansLent /></AdminRoute>} />
              <Route path="/loans-borrowed" element={<AdminRoute><LoansBorrowed /></AdminRoute>} />
              <Route path="/motorcycle-rentals" element={<AdminRoute><MotorcycleRentals /></AdminRoute>} />
              <Route path="/motorcycle-expenses" element={<AdminRoute><MotorcycleExpenses /></AdminRoute>} />
              <Route path="/deletion-logs" element={<AdminRoute><DeletionLogs /></AdminRoute>} />
              <Route path="/ultra" element={<ProtectedRoute allowEmployee><Ultra /></ProtectedRoute>} />
              <Route path="/ultra-registro" element={<ProtectedRoute allowEmployee allowUltra><UltraRegistro /></ProtectedRoute>} />
              <Route path="/santa-luzia" element={<ProtectedRoute allowEmployee><SantaLuzia /></ProtectedRoute>} />
              <Route path="/santa-luzia-registro" element={<ProtectedRoute allowEmployee allowSantaLuzia><SantaLuziaRegistro /></ProtectedRoute>} />
              <Route path="/lagoinha" element={<ProtectedRoute allowEmployee><Lagoinha /></ProtectedRoute>} />
              <Route path="/lagoinha-registro" element={<ProtectedRoute allowEmployee allowLagoinha><LagoinhaRegistro /></ProtectedRoute>} />
              <Route path="/burgazzo" element={<ProtectedRoute allowEmployee><Burgazzo /></ProtectedRoute>} />
              <Route path="/burgazzo-registro" element={<ProtectedRoute allowEmployee allowBurgazzo><BurgazzoRegistro /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </BillsNotificationProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
