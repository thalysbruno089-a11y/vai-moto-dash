import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, Phone, Wallet } from "lucide-react";
import { UltraDeliveriesBoard } from "@/components/ultra/UltraDeliveriesBoard";
import logo from "@/assets/logo.png";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Archive } from "lucide-react";
import { useUltraDeliveries } from "@/hooks/useUltraDeliveries";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { useMemo } from "react";

const UltraRegistro = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const today = format(new Date(), "yyyy-MM-dd");
  const { data: deliveries = [] } = useUltraDeliveries(today, { sentOnly: false });

  const totals = useMemo(() => {
    const t = { pagamento: 0, taxa: 0, corridas: 0, entregues: 0 };
    for (const d of deliveries) {
      t.pagamento += Number(d.pagamento || 0);
      t.taxa += Number(d.taxa || 0);
      if (d.ok) t.entregues += 1;
    }
    t.corridas = deliveries.length;
    return t;
  }, [deliveries]);

  const fmtMoney = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-card border-b print:hidden">
        <div className="mx-auto max-w-3xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Vai Moto" className="h-9 w-auto" />
            <div>
              <h1 className="text-lg font-bold leading-none">ULTRA</h1>
              <p className="text-xs text-muted-foreground">Registro de entregas</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-1" /> Sair
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-4">
        <div className="flex justify-end gap-2 mb-3 print:hidden">
          <Button
            size="sm"
            asChild
            className="bg-[#25D366] hover:bg-[#1ebe57] text-white transition-all duration-200 hover:scale-105 shadow-sm"
          >
            <a
              href="https://wa.me/5535997609456?text=Preciso%20de%20uma%20moto."
              target="_blank"
              rel="noopener noreferrer"
            >
              <Phone className="h-4 w-4 mr-2" /> WhatsApp
            </a>
          </Button>
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