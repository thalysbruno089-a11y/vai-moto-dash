import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Users,
  Bike,
  CreditCard,
  TrendingUp,
  RefreshCw,
  FolderOpen,
  FileText,
  Settings,
  LogOut,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Pedidos", href: "/orders", icon: Package },
  { name: "Clientes", href: "/clients", icon: Users },
  { name: "Motoboys", href: "/motorcyclists", icon: Bike },
  { name: "Pagamentos", href: "/payments", icon: CreditCard },
  { name: "Fluxo de Caixa", href: "/cash-flow", icon: TrendingUp },
  { name: "Recorrências", href: "/recurring", icon: RefreshCw },
  { name: "Categorias", href: "/categories", icon: FolderOpen },
  { name: "Relatórios", href: "/reports", icon: FileText },
];

const Sidebar = () => {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 px-6 border-b border-sidebar-border">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Bike className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-sidebar-foreground">Vai Moto</h1>
            <p className="text-xs text-sidebar-muted">Gestão de Entregas</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={isActive ? "sidebar-link-active" : "sidebar-link"}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="border-t border-sidebar-border p-3 space-y-1">
          <Link to="/settings" className="sidebar-link">
            <Settings className="h-5 w-5" />
            <span>Configurações</span>
          </Link>
          <button className="sidebar-link w-full text-left">
            <LogOut className="h-5 w-5" />
            <span>Sair</span>
          </button>
        </div>

        {/* User Info */}
        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-sidebar-accent flex items-center justify-center">
              <span className="text-sm font-medium text-sidebar-foreground">AD</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                Admin
              </p>
              <p className="text-xs text-sidebar-muted truncate">
                Empresa Demo
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
