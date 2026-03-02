import MainLayout from "@/components/layout/MainLayout";
import StatCard from "@/components/dashboard/StatCard";
import { Wallet, TrendingUp, TrendingDown, Bike, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMotoboys } from "@/hooks/useMotoboys";
import { useCashFlow } from "@/hooks/useCashFlow";
import { useBills } from "@/hooks/useBills";
import { useState, useMemo } from "react";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format, addDays, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

/** Semana de quinta (4) a quarta (3) */
const getWeekRange = (refDate: Date = new Date()) => {
  const d = new Date(refDate);
  const day = d.getDay(); // 0=Dom ... 4=Qui
  const diffToThursday = day >= 4 ? day - 4 : day + 3;
  const start = new Date(d);
  start.setDate(d.getDate() - diffToThursday);
  start.setHours(0, 0, 0, 0);
  const end = addDays(start, 6);
  return { start, end };
};

const fmtDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const fmtShort = (d: Date) => format(d, "dd/MM", { locale: ptBR });

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const Dashboard = () => {
  const { data: motoboys, isLoading: loadingMotoboys } = useMotoboys();
  const { data: cashFlowEntries, isLoading: loadingCashFlow } = useCashFlow();
  const { data: bills, isLoading: loadingBills } = useBills();
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [monthOffset, setMonthOffset] = useState(0);
  const queryClient = useQueryClient();

  const isLoading = loadingCashFlow || loadingMotoboys || loadingBills;

  // Current week (always current)
  const week = getWeekRange();
  const weekStartStr = fmtDate(week.start);
  const weekEndStr = fmtDate(week.end);

  // Month navigation
  const selectedMonth = useMemo(() => {
    const d = new Date();
    return monthOffset === 0 ? d : monthOffset > 0 ? addMonths(d, monthOffset) : subMonths(d, Math.abs(monthOffset));
  }, [monthOffset]);
  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);
  const monthStartStr = fmtDate(monthStart);
  const monthEndStr = fmtDate(monthEnd);

  // ---- WEEK calculations ----
  const weekMotoboyIncome = motoboys
    ?.filter((m) => m.status === "active" && m.payment_status === "paid")
    .reduce((s, m) => s + Number(m.weekly_payment || 0), 0) || 0;

  const weekCashFlowEntries = cashFlowEntries?.filter(
    (e) => e.flow_date >= weekStartStr && e.flow_date <= weekEndStr
  ) || [];
  const weekCfIncome = weekCashFlowEntries.filter((e) => e.type === "revenue").reduce((s, e) => s + Number(e.value), 0);
  const weekCfExpense = weekCashFlowEntries.filter((e) => e.type === "expense").reduce((s, e) => s + Number(e.value), 0);

  // Bills paid this week
  const weekBillsExpense = bills?.filter((b) => {
    if (b.status !== "paid" || !b.paid_at) return false;
    const paidDate = b.paid_at.slice(0, 10);
    return paidDate >= weekStartStr && paidDate <= weekEndStr;
  }).reduce((s, b) => s + Number(b.value), 0) || 0;

  const weekIncome = weekMotoboyIncome + weekCfIncome;
  const weekExpense = weekCfExpense + weekBillsExpense;
  const weekBalance = weekIncome - weekExpense;

  // ---- MONTH calculations ----
  const monthMotoboyIncome = motoboys
    ?.filter((m) => m.status === "active" && m.payment_status === "paid")
    .reduce((s, m) => s + Number(m.weekly_payment || 0), 0) || 0;

  const monthCashFlowEntries = cashFlowEntries?.filter(
    (e) => e.flow_date >= monthStartStr && e.flow_date <= monthEndStr
  ) || [];
  const monthCfIncome = monthCashFlowEntries.filter((e) => e.type === "revenue").reduce((s, e) => s + Number(e.value), 0);
  const monthCfExpense = monthCashFlowEntries.filter((e) => e.type === "expense").reduce((s, e) => s + Number(e.value), 0);

  const monthBillsExpense = bills?.filter((b) => {
    if (b.status !== "paid" || !b.paid_at) return false;
    const paidDate = b.paid_at.slice(0, 10);
    return paidDate >= monthStartStr && paidDate <= monthEndStr;
  }).reduce((s, b) => s + Number(b.value), 0) || 0;

  const monthIncome = monthMotoboyIncome + monthCfIncome;
  const monthExpense = monthCfExpense + monthBillsExpense;
  const monthBalance = monthIncome - monthExpense;

  const activeMotoboys = motoboys?.filter((m) => m.status === "active").length || 0;

  const handleReset = async () => {
    setIsResetting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Não autenticado");

      const res = await supabase.functions.invoke("reset-payment-status", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (res.error) throw res.error;

      queryClient.invalidateQueries({ queryKey: ["motoboys"] });
      queryClient.invalidateQueries({ queryKey: ["cash_flow"] });
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      toast.success("Semana zerada com sucesso! Pagamentos e valores resetados.");
      setResetDialogOpen(false);
    } catch {
      toast.error("Erro ao zerar semana");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <MainLayout title="Dashboard" subtitle="Controle financeiro semanal e mensal">
      <Tabs defaultValue="week" className="w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <TabsList>
            <TabsTrigger value="week">📅 Semana Atual</TabsTrigger>
            <TabsTrigger value="month">📆 Mensal</TabsTrigger>
          </TabsList>
          <Button variant="destructive" size="sm" onClick={() => setResetDialogOpen(true)}>
            <RotateCcw className="h-4 w-4 mr-1" /> Zerar Semana
          </Button>
        </div>

        {/* ===== SEMANA ===== */}
        <TabsContent value="week" className="space-y-6">
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <p className="text-sm text-muted-foreground">Período da semana</p>
            <p className="text-lg font-bold text-foreground">
              Quinta {fmtShort(week.start)} → Quarta {fmtShort(week.end)}
            </p>
          </div>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
            <StatCard
              title="Entradas da Semana"
              value={isLoading ? "..." : formatCurrency(weekIncome)}
              icon={<TrendingUp className="h-6 w-6 text-success" />}
              variant="success"
            />
            <StatCard
              title="Saídas da Semana"
              value={isLoading ? "..." : formatCurrency(weekExpense)}
              icon={<TrendingDown className="h-6 w-6 text-destructive" />}
              variant="destructive"
            />
            <StatCard
              title="Saldo da Semana"
              value={isLoading ? "..." : formatCurrency(weekBalance)}
              icon={<Wallet className="h-6 w-6 text-primary" />}
              variant={weekBalance >= 0 ? "success" : "destructive"}
            />
          </div>

          <div className="grid gap-4 grid-cols-2">
            <StatCard
              title="Motoboys Ativos"
              value={isLoading ? "..." : String(activeMotoboys)}
              icon={<Bike className="h-6 w-6 text-primary" />}
            />
            <StatCard
              title="Receita Motoboys (Pagos)"
              value={isLoading ? "..." : formatCurrency(weekMotoboyIncome)}
              icon={<TrendingUp className="h-6 w-6 text-success" />}
              variant="success"
            />
          </div>

          <MotoboyList motoboys={motoboys} isLoading={isLoading} />
        </TabsContent>

        {/* ===== MÊS ===== */}
        <TabsContent value="month" className="space-y-6">
          <div className="flex items-center justify-center gap-3 rounded-lg bg-muted/50 p-3">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setMonthOffset((p) => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-[160px] text-center">
              <p className="text-sm text-muted-foreground">Mês</p>
              <p className="text-lg font-bold capitalize text-foreground">
                {format(selectedMonth, "MMMM yyyy", { locale: ptBR })}
              </p>
            </div>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setMonthOffset((p) => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            {monthOffset !== 0 && (
              <Button variant="ghost" size="sm" onClick={() => setMonthOffset(0)}>Atual</Button>
            )}
          </div>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
            <StatCard
              title="Entradas do Mês"
              value={isLoading ? "..." : formatCurrency(monthIncome)}
              icon={<TrendingUp className="h-6 w-6 text-success" />}
              variant="success"
            />
            <StatCard
              title="Saídas do Mês"
              value={isLoading ? "..." : formatCurrency(monthExpense)}
              icon={<TrendingDown className="h-6 w-6 text-destructive" />}
              variant="destructive"
            />
            <StatCard
              title="Saldo do Mês"
              value={isLoading ? "..." : formatCurrency(monthBalance)}
              icon={<Wallet className="h-6 w-6 text-primary" />}
              variant={monthBalance >= 0 ? "success" : "destructive"}
            />
          </div>
        </TabsContent>
      </Tabs>

      <DeleteConfirmDialog
        open={resetDialogOpen}
        onOpenChange={setResetDialogOpen}
        onConfirm={handleReset}
        title="Zerar Semana"
        description="Isso vai redefinir todos os pagamentos dos motoboys para 'Não Pago'. O novo ciclo começa na próxima quinta-feira. Deseja continuar?"
        isLoading={isResetting}
      />
    </MainLayout>
  );
};

function MotoboyList({ motoboys, isLoading }: { motoboys: any[] | undefined; isLoading: boolean }) {
  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Motoboys Cadastrados</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground">Carregando...</p>
        ) : motoboys && motoboys.length > 0 ? (
          <div className="space-y-3">
            {motoboys.slice(0, 8).map((motoboy) => (
              <div key={motoboy.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <span className="text-sm font-medium text-primary">
                        {motoboy.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                      </span>
                    </div>
                    <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card ${
                      motoboy.status === "active" ? "bg-success" : "bg-muted"
                    }`} />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{motoboy.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {motoboy.shift === "day" ? "Diurno" : motoboy.shift === "night" ? "Noturno" : motoboy.shift === "star" ? "Estrela" : motoboy.shift === "free" ? "Free" : "Fim de Semana"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium ${motoboy.payment_status === "paid" ? "text-success" : "text-destructive"}`}>
                    {motoboy.payment_status === "paid" ? "✅ Pago" : "❌ Não Pago"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(Number(motoboy.weekly_payment || 0))}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">Nenhum motoboy cadastrado</p>
        )}
      </CardContent>
    </Card>
  );
}

export default Dashboard;
