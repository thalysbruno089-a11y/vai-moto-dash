import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Bike,
  CreditCard,
  TrendingUp,
  Tags,
  FileText,
  Settings,
  LogOut,
  Bell,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import logo from "@/assets/logo.png";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Motoboys", href: "/motorcyclists", icon: Bike },
  { name: "Clientes", href: "/clients", icon: CreditCard },
  { name: "Contas a Pagar", href: "/bills", icon: Bell },
  { name: "Fluxo de Caixa", href: "/cash-flow", icon: TrendingUp },
  { name: "Categorias", href: "/categories", icon: Tags },
  { name: "Relatórios", href: "/reports", icon: FileText },
];

const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  manager: 'Gerente',
  finance: 'Financeiro',
  employee: 'Funcionária',
};

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut, canAccessSettings } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-20 items-center justify-center px-4 border-b border-sidebar-border bg-white">
          <img src={logo} alt="Vai Moto" className="h-14 w-auto object-contain" />
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
          {canAccessSettings && (
            <Link to="/settings" className="sidebar-link">
              <Settings className="h-5 w-5" />
              <span>Configurações</span>
            </Link>
          )}
          <button onClick={handleSignOut} className="sidebar-link w-full text-left">
            <LogOut className="h-5 w-5" />
            <span>Sair</span>
          </button>
        </div>

        {/* User Info */}
        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-sidebar-accent flex items-center justify-center">
              <span className="text-sm font-medium text-sidebar-foreground">
                {profile?.name ? getInitials(profile.name) : 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {profile?.name || 'Usuário'}
              </p>
              <p className="text-xs text-sidebar-muted truncate">
                {profile?.role ? roleLabels[profile.role] : 'Carregando...'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
