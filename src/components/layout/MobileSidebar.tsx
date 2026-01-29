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
  Menu,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import logo from "@/assets/logo.png";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Motoboys", href: "/motorcyclists", icon: Bike },
  { name: "Pagamentos", href: "/payments", icon: CreditCard },
  { name: "Fluxo de Caixa", href: "/cash-flow", icon: TrendingUp },
  { name: "Categorias", href: "/categories", icon: Tags },
  { name: "Relatórios", href: "/reports", icon: FileText },
];

const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  manager: 'Gerente',
  finance: 'Financeiro',
};

const MobileSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut, canAccessSettings } = useAuth();
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
    setOpen(false);
  };

  const handleNavigation = (href: string) => {
    navigate(href);
    setOpen(false);
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
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Abrir menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0 bg-sidebar">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-center px-4 border-b border-sidebar-border bg-white">
            <img src={logo} alt="Vai Moto" className="h-12 w-auto object-contain" />
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <button
                  key={item.name}
                  onClick={() => handleNavigation(item.href)}
                  className={`w-full ${isActive ? "sidebar-link-active" : "sidebar-link"}`}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>

          {/* Bottom Actions */}
          <div className="border-t border-sidebar-border p-3 space-y-1">
            {canAccessSettings && (
              <button 
                onClick={() => handleNavigation('/settings')} 
                className="sidebar-link w-full"
              >
                <Settings className="h-5 w-5" />
                <span>Configurações</span>
              </button>
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
      </SheetContent>
    </Sheet>
  );
};

export default MobileSidebar;
