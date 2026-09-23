import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AlertTriangle, LogOut, Phone, Send, Wallet } from "lucide-react";
import { UltraDeliveriesBoard } from "@/components/ultra/UltraDeliveriesBoard";
import logo from "@/assets/logo.png";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Archive } from "lucide-react";
import { useSendUltraDayToCentral, useUltraDeliveries } from "@/hooks/useUltraDeliveries";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const UltraRegistro = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const today = format(new Date(), "yyyy-MM-dd");
  const { data: deliveries = [] } = useUltraDeliveries(today, { sentOnly: false });
  const sendMut = useSendUltraDayToCentral();
  const [exitReminderOpen, setExitReminderOpen] = useState(false);
  const pendingCount = deliveries.filter((delivery) => !delivery.sent_to_central).length;

  useEffect(() => {
    if (pendingCount === 0) {
      setExitReminderOpen(false);
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
      setExitReminderOpen(true);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [pendingCount]);

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

  const handleSendNow = () => {
    sendMut.mutate(today, {
      onSuccess: () => setExitReminderOpen(false),
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-card border-b print:hidden">
        <div className="mx-auto max-w-3xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Vai Moto" className="h-14 w-auto" />
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
        {pendingCount > 0 && (
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-warning/40 bg-warning/10 p-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-500">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">Relatório pendente de envio</p>
              <p className="text-sm text-muted-foreground">
                {pendingCount} {pendingCount === 1 ? "corrida ainda não foi enviada" : "corridas ainda não foram enviadas"} para os ADM.
              </p>
            </div>
            <Button size="sm" onClick={handleSendNow} disabled={sendMut.isPending}>
              <Send className="mr-2 h-4 w-4" />
              {sendMut.isPending ? "Enviando..." : "Enviar agora"}
            </Button>
          </div>
        )}
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
                <Wallet className="h-4 w-4 mr-2" /> Pagamentos
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Totais do dia</SheetTitle>
              </SheetHeader>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Card>
                  <CardContent className="p-3">
                    <p className="text-xs text-muted-foreground">Corridas</p>
                    <p className="text-xl font-bold">{totals.corridas}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3">
                    <p className="text-xs text-muted-foreground">Entregues (OK)</p>
                    <p className="text-xl font-bold text-success">{totals.entregues}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3">
                    <p className="text-xs text-muted-foreground">Total pagamento</p>
                    <p className="text-lg font-bold">{fmtMoney(totals.pagamento)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3">
                    <p className="text-xs text-muted-foreground">Total taxa</p>
                    <p className="text-lg font-bold">{fmtMoney(totals.taxa)}</p>
                  </CardContent>
                </Card>
              </div>
            </SheetContent>
          </Sheet>
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

      <Dialog open={exitReminderOpen} onOpenChange={setExitReminderOpen}>
        <DialogContent className="border-warning/50 sm:max-w-md animate-in zoom-in-95 duration-200">
          <DialogHeader>
            <div className="mx-auto mb-2 flex h-14 w-14 animate-pulse items-center justify-center rounded-full bg-warning/15 text-warning">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <DialogTitle className="text-center">Calma, o relatório ainda não foi enviado</DialogTitle>
            <DialogDescription className="text-center">
              Existem {pendingCount} {pendingCount === 1 ? "corrida pendente" : "corridas pendentes"}. Os ADM só conseguirão ver o relatório depois do envio.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button className="w-full" onClick={handleSendNow} disabled={sendMut.isPending}>
              <Send className="mr-2 h-4 w-4" />
              {sendMut.isPending ? "Enviando..." : "Enviar relatório agora"}
            </Button>
            <Button variant="outline" className="w-full" onClick={() => setExitReminderOpen(false)}>
              Continuar preenchendo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UltraRegistro;