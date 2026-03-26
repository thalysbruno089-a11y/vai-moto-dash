import MainLayout from "@/components/layout/MainLayout";
import StatCard from "@/components/dashboard/StatCard";
import { Wallet, TrendingUp, TrendingDown, Bike, RotateCcw, ChevronLeft, ChevronRight, Save, History, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMotoboys } from "@/hooks/useMotoboys";
import { useCashFlow } from "@/hooks/useCashFlow";

import { useMonthlyClosings, useSaveMonthlyClosing, useDeleteMonthlyClosing } from "@/hooks/useMonthlyClosings";
import { useWeeklyClosings, useSaveWeeklyClosing, useDeleteWeeklyClosing } from "@/hooks/useWeeklyClosings";
import { useState, useMemo } from "react";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format, addDays, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

const getWeekRange = (refDate: Date = new Date()) => {
  const d = new Date(refDate);
  const day = d.getDay();
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

const MONTH_NAMES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

const Dashboard = () => {
  const { data: motoboys, isLoading: loadingMotoboys } = useMotoboys();
  const { data: cashFlowEntries, isLoading: loadingCashFlow } = useCashFlow();
  
  const { data: closings = [] } = useMonthlyClosings();
  const { data: weeklyClosings = [] } = useWeeklyClosings();
  const saveClosing = useSaveMonthlyClosing();
  const saveWeeklyClosing = useSaveWeeklyClosing();
  const deleteWeeklyClosing = useDeleteWeeklyClosing();
  const deleteMonthlyClosing = useDeleteMonthlyClosing();
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [monthOffset, setMonthOffset] = useState(0);
  const [deleteHistoryId, setDeleteHistoryId] = useState<string | null>(null);
  const [deleteHistoryType, setDeleteHistoryType] = useState<'weekly' | 'monthly'>('weekly');
  const [deleteHistoryDialogOpen, setDeleteHistoryDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const isLoading = loadingCashFlow || loadingMotoboys;

  const week = getWeekRange();
  const weekStartStr = fmtDate(week.start);
  const weekEndStr = fmtDate(week.end);

  const latestWeeklyResetAt = useMemo(() => {
    const thisWeekClosings = weeklyClosings
      .filter((closing) => {
        const createdAt = new Date(closing.created_at);
        return createdAt >= week.start && createdAt <= week.end;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return thisWeekClosings[0]?.created_at ?? null;
  }, [weeklyClosings, week.start, week.end]);

  const selectedMonth = useMemo(() => {
    const d = new Date();
    return monthOffset === 0 ? d : monthOffset > 0 ? addMonths(d, monthOffset) : subMonths(d, Math.abs(monthOffset));
  }, [monthOffset]);
  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);
  const monthStartStr = fmtDate(monthStart);
  const monthEndStr = fmtDate(monthEnd);

  // WEEK
  const weekMotoboyIncome = motoboys
    ?.filter((m) => m.status === "active" && m.payment_status === "paid")
    .reduce((s, m) => s + Number(m.weekly_payment || 0), 0) || 0;

  const weekResetAt = latestWeeklyResetAt ? new Date(latestWeeklyResetAt) : null;

  const weekCashFlowEntries = cashFlowEntries?.filter((e) => {
    const inWeekRange = e.flow_date >= weekStartStr && e.flow_date <= weekEndStr;
    if (!inWeekRange) return false;
    if (!weekResetAt) return true;
    return new Date(e.created_at) > weekResetAt;
  }) || [];
  const weekCfIncome = weekCashFlowEntries.filter((e) => e.type === "revenue").reduce((s, e) => s + Number(e.value), 0);
  const weekCfExpense = weekCashFlowEntries.filter((e) => e.type === "expense").reduce((s, e) => s + Number(e.value), 0);

  const weekIncome = weekMotoboyIncome + weekCfIncome;
  const weekExpense = weekCfExpense;
  const weekBalance = weekIncome - weekExpense;

  // MONTH
  const monthMotoboyIncome = motoboys
    ?.filter((m) => m.status === "active" && m.payment_status === "paid")
    .reduce((s, m) => s + Number(m.weekly_payment || 0), 0) || 0;

  const monthCashFlowEntries = cashFlowEntries?.filter(
    (e) => e.flow_date >= monthStartStr && e.flow_date <= monthEndStr
  ) || [];
  const monthCfIncome = monthCashFlowEntries.filter((e) => e.type === "revenue").reduce((s, e) => s + Number(e.value), 0);
  const monthCfExpense = monthCashFlowEntries.filter((e) => e.type === "expense").reduce((s, e) => s + Number(e.value), 0);

  const monthIncome = monthMotoboyIncome + monthCfIncome;
  const monthExpense = monthCfExpense;
  const monthBalance = monthIncome - monthExpense;

  const activeMotoboys = motoboys?.filter((m) => m.status === "active").length || 0;

  const handleReset = async () => {
    setIsResetting(true);
    let createdWeeklyClosingId: string | null = null;

    try {
      // Fetch fresh motoboy data to ensure we capture paid income accurately
      const { data: freshMotoboys } = await supabase
        .from("motoboys")
        .select("*")
        .eq("status", "active")
        .eq("payment_status", "paid");

      const freshMotoboyIncome = (freshMotoboys || []).reduce(
        (s, m) => s + Number(m.weekly_payment || 0), 0
      );

      // Fetch fresh cash flow for this week
      const { data: freshCashFlow } = await supabase
        .from("cash_flow")
        .select("*")
        .gte("flow_date", weekStartStr)
        .lte("flow_date", weekEndStr);

      const filteredCf = (freshCashFlow || []).filter((e) => {
        if (!weekResetAt) return true;
        return new Date(e.created_at) > weekResetAt;
      });

      const freshCfIncome = filteredCf.filter((e) => e.type === "revenue").reduce((s, e) => s + Number(e.value), 0);
      const freshCfExpense = filteredCf.filter((e) => e.type === "expense").reduce((s, e) => s + Number(e.value), 0);

      const totalIncome = freshMotoboyIncome + freshCfIncome;
      const totalExpense = freshCfExpense;

      const weeklyClosing = await saveWeeklyClosing.mutateAsync({
        week_start: weekStartStr,
        week_end: weekEndStr,
        income: totalIncome,
        expense: totalExpense,
      });
      createdWeeklyClosingId = weeklyClosing.id;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Não autenticado");
      const res = await supabase.functions.invoke("reset-payment-status", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.error) throw res.error;

      queryClient.invalidateQueries({ queryKey: ["motoboys"] });
      queryClient.invalidateQueries({ queryKey: ["cash_flow"] });
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      queryClient.invalidateQueries({ queryKey: ["weekly_closings"] });

      toast.success("Semana zerada e salva no histórico!");
      setResetDialogOpen(false);
    } catch (error) {
      if (createdWeeklyClosingId) {
        await supabase.from("weekly_closings" as any).delete().eq("id", createdWeeklyClosingId);
        queryClient.invalidateQueries({ queryKey: ["weekly_closings"] });
      }

      toast.error("Erro ao zerar semana", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setIsResetting(false);
    }
  };

  const handleSaveMonth = () => {
    const m = selectedMonth.getMonth() + 1;
    const y = selectedMonth.getFullYear();
    saveClosing.mutate({ month: m, year: y, income: monthIncome, expense: monthExpense });
  };

  return (
    <MainLayout title="Dashboard" subtitle="Controle financeiro semanal e mensal">
      <Tabs defaultValue="week" className="w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <TabsList>
            <TabsTrigger value="week">📅 Semana Atual</TabsTrigger>
            <TabsTrigger value="month">📆 Mensal</TabsTrigger>
            <TabsTrigger value="history">📊 Histórico</TabsTrigger>
          </TabsList>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setResetDialogOpen(true)}
            disabled={isResetting || saveWeeklyClosing.isPending}
          >
            <RotateCcw className="h-4 w-4 mr-1" /> Zerar Semana
          </Button>
        </div>

        {/* SEMANA */}
        <TabsContent value="week" className="space-y-6">
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <p className="text-sm text-muted-foreground">Período da semana</p>
            <p className="text-lg font-bold text-foreground">
              Quinta {fmtShort(week.start)} → Quarta {fmtShort(week.end)}
            </p>
          </div>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
            <StatCard title="Entradas da Semana" value={isLoading ? "..." : formatCurrency(weekIncome)} icon={<TrendingUp className="h-6 w-6 text-success" />} variant="success" />
            <StatCard title="Saídas da Semana" value={isLoading ? "..." : formatCurrency(weekExpense)} icon={<TrendingDown className="h-6 w-6 text-destructive" />} variant="destructive" />
            <StatCard title="Saldo da Semana" value={isLoading ? "..." : formatCurrency(weekBalance)} icon={<Wallet className="h-6 w-6 text-primary" />} variant={weekBalance >= 0 ? "success" : "destructive"} />
          </div>
          <div className="grid gap-4 grid-cols-2">
            <StatCard title="Motoboys Ativos" value={isLoading ? "..." : String(activeMotoboys)} icon={<Bike className="h-6 w-6 text-primary" />} />
            <StatCard title="Receita Motoboys (Pagos)" value={isLoading ? "..." : formatCurrency(weekMotoboyIncome)} icon={<TrendingUp className="h-6 w-6 text-success" />} variant="success" />
          </div>
          <MotoboyList motoboys={motoboys} isLoading={isLoading} />
        </TabsContent>

        {/* MÊS */}
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
            <StatCard title="Entradas do Mês" value={isLoading ? "..." : formatCurrency(monthIncome)} icon={<TrendingUp className="h-6 w-6 text-success" />} variant="success" />
            <StatCard title="Saídas do Mês" value={isLoading ? "..." : formatCurrency(monthExpense)} icon={<TrendingDown className="h-6 w-6 text-destructive" />} variant="destructive" />
            <StatCard title="Saldo do Mês" value={isLoading ? "..." : formatCurrency(monthBalance)} icon={<Wallet className="h-6 w-6 text-primary" />} variant={monthBalance >= 0 ? "success" : "destructive"} />
          </div>

          <div className="flex justify-center">
            <Button onClick={handleSaveMonth} disabled={saveClosing.isPending} variant="outline">
              <Save className="h-4 w-4 mr-2" />
              {saveClosing.isPending ? "Salvando..." : "Salvar Mês"}
            </Button>
          </div>
        </TabsContent>

        {/* HISTÓRICO */}
        <TabsContent value="history" className="space-y-6">
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
              <History className="h-4 w-4" /> Histórico Semanal e Mensal
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Semanas Zeradas</h3>
            {weeklyClosings.length === 0 ? (
              <p className="text-center text-muted-foreground py-6">Nenhuma semana zerada ainda.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {weeklyClosings.map((closing) => {
                  const start = new Date(`${closing.week_start}T12:00:00`);
                  const end = new Date(`${closing.week_end}T12:00:00`);
                  const balance = Number(closing.income) - Number(closing.expense);

                  return (
                    <Card key={closing.id}>
                      <CardHeader className="pb-2 flex flex-row items-center justify-between">
                        <CardTitle className="text-base">
                          Semana {format(start, "dd/MM", { locale: ptBR })} → {format(end, "dd/MM", { locale: ptBR })}
                        </CardTitle>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { setDeleteHistoryId(closing.id); setDeleteHistoryType('weekly'); setDeleteHistoryDialogOpen(true); }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Entradas</span>
                          <span className="text-sm font-semibold text-success">{formatCurrency(Number(closing.income))}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Saídas</span>
                          <span className="text-sm font-semibold text-destructive">{formatCurrency(Number(closing.expense))}</span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span className="text-sm font-medium">Saldo</span>
                          <span className={`text-sm font-bold ${balance >= 0 ? "text-success" : "text-destructive"}`}>
                            {formatCurrency(balance)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Meses Salvos</h3>
            {closings.length === 0 ? (
              <p className="text-center text-muted-foreground py-6">Nenhum mês salvo ainda. Vá na aba "Mensal" e clique em "Salvar Mês".</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {closings.map((c) => {
                  const balance = Number(c.income) - Number(c.expense);

                  return (
                    <Card key={c.id}>
                      <CardHeader className="pb-2 flex flex-row items-center justify-between">
                        <CardTitle className="text-base capitalize">
                          {MONTH_NAMES[c.month - 1]} {c.year}
                        </CardTitle>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { setDeleteHistoryId(c.id); setDeleteHistoryType('monthly'); setDeleteHistoryDialogOpen(true); }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Entradas</span>
                          <span className="text-sm font-semibold text-success">{formatCurrency(Number(c.income))}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Saídas</span>
                          <span className="text-sm font-semibold text-destructive">{formatCurrency(Number(c.expense))}</span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span className="text-sm font-medium">Saldo</span>
                          <span className={`text-sm font-bold ${balance >= 0 ? "text-success" : "text-destructive"}`}>
                            {formatCurrency(balance)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
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
      <DeleteConfirmDialog
        open={deleteHistoryDialogOpen}
        onOpenChange={setDeleteHistoryDialogOpen}
        onConfirm={() => {
          if (!deleteHistoryId) return;
          if (deleteHistoryType === 'weekly') {
            deleteWeeklyClosing.mutate(deleteHistoryId, { onSuccess: () => { setDeleteHistoryDialogOpen(false); toast.success('Registro excluído!'); } });
          } else {
            deleteMonthlyClosing.mutate(deleteHistoryId, { onSuccess: () => setDeleteHistoryDialogOpen(false) });
          }
        }}
        title="Excluir registro"
        description="Tem certeza que deseja excluir este registro do histórico? Esta ação não pode ser desfeita."
        isLoading={deleteWeeklyClosing.isPending || deleteMonthlyClosing.isPending}
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
