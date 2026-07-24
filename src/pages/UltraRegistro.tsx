import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { UltraDeliveriesBoard } from "@/components/ultra/UltraDeliveriesBoard";
import logo from "@/assets/logo.png";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Archive } from "lucide-react";

const UltraRegistro = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-card border-b">
        <div className="mx-auto max-w-3xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Vai Moto" className="h-9 w-auto" />
            <div>
              <h1 className="text-lg font-bold leading-none">ULTRA</h1>
              <p className="text-xs text-muted-foreground">Registro de entregas</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-1" /> Sair
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-4">
        <div className="flex justify-end mb-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <Archive className="h-4 w-4 mr-2" /> Salvos
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-full sm:max-w-lg overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Relatórios salvos</SheetTitle>
              </SheetHeader>
              <div className="mt-4">
                <UltraDeliveriesBoard editable={false} allowDateChange sentOnly />
              </div>
            </SheetContent>
          </Sheet>
        </div>
        <UltraDeliveriesBoard editable />
      </main>
    </div>
  );
};

export default UltraRegistro;