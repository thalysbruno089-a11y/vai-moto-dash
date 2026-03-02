import MainLayout from "@/components/layout/MainLayout";
import StatCard from "@/components/dashboard/StatCard";
import { Wallet, TrendingUp, TrendingDown, Bike, RotateCcw, Calendar, CalendarDays } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMotoboys } from "@/hooks/useMotoboys";
import { useCashFlow } from "@/hooks/useCashFlow";
import { useState } from "react";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type ViewMode = 'week' | 'month';

const getWeekRange = () => {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 3=Wed
  // Week starts on Wednesday
  const diffToWed = day >= 3 ? day - 3 : day + 4;
  const start = new Date(now);
  start.setDate(now.getDate() - diffToWed);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const getMonthRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { start, end };
};

const formatDateStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const Dashboard = () => {
  const { data: motoboys, isLoading: loadingMotoboys } = useMotoboys();
  const { data: cashFlowEntries, isLoading: loadingCashFlow } = useCashFlow();
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const queryClient = useQueryClient();

  const weekRange = getWeekRange();
  const monthRange = getMonthRange();

  const range = viewMode === 'week' ? weekRange : monthRange;
  const rangeStartStr = formatDateStr(range.start);
  const rangeEndStr = formatDateStr(range.end);

  // Motoboy payments (income) - only paid active motoboys
  const motoboyPaymentsTotal = motoboys
    ?.filter(m => m.status === 'active' && m.payment_status === 'paid')
    .reduce((sum, m) => sum + Number(m.weekly_payment || 0), 0) || 0;

  // Cash flow entries in range
  const entriesInRange = cashFlowEntries?.filter(e => {
    return e.flow_date >= rangeStartStr && e.flow_date <= rangeEndStr;
  }) || [];

  const cashFlowIncome = entriesInRange.filter(e => e.type === 'revenue').reduce((sum, e) => sum + Number(e.value), 0);
  const cashFlowExpense = entriesInRange.filter(e => e.type === 'expense').reduce((sum, e) => sum + Number(e.value), 0);

  const totalIncome = cashFlowIncome + motoboyPaymentsTotal;
  const totalExpense = cashFlowExpense;
  const balance = totalIncome - totalExpense;

  const activeMotoboys = motoboys?.filter(m => m.status === 'active').length || 0;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const handleReset = async () => {
    setIsResetting(true);
    try {
      // Reset all motoboy payment status to pending
      const paidMotoboys = (motoboys || []).filter(m => m.payment_status === 'paid');
      for (const m of paidMotoboys) {
        await supabase.from('motoboys').update({ payment_status: 'pending' }).eq('id', m.id);
      }
      queryClient.invalidateQueries({ queryKey: ['motoboys'] });
      toast.success('Semana zerada com sucesso!');
      setResetDialogOpen(false);
    } catch {
      toast.error('Erro ao zerar semana');
    } finally {
      setIsResetting(false);
    }
  };

  const isLoading = loadingCashFlow || loadingMotoboys;

  const periodLabel = viewMode === 'week' ? 'Semana' : 'Mês';
  const formatPeriod = (d: Date) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;

  return (
    <MainLayout title="Dashboard" subtitle="Visão geral financeira da sua empresa">
      {/* Period Toggle + Reset */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('week')}
          >
            <Calendar className="h-4 w-4 mr-1" /> Semana
          </Button>
          <Button
            variant={viewMode === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('month')}
          >
            <CalendarDays className="h-4 w-4 mr-1" /> Mês
          </Button>
          <span className="text-sm text-muted-foreground ml-2">
            {formatPeriod(range.start)} - {formatPeriod(range.end)}
          </span>
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setResetDialogOpen(true)}
        >
          <RotateCcw className="h-4 w-4 mr-1" /> Zerar Semana
        </Button>
      </div>

      {/* Financial Stats */}
      <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-3 mb-6 sm:mb-8">
        <StatCard
          title={`Entradas (${periodLabel})`}
          value={isLoading ? "..." : formatCurrency(totalIncome)}
          icon={<TrendingUp className="h-6 w-6 text-success" />}
          variant="success"
        />
        <StatCard
          title={`Saídas (${periodLabel})`}
          value={isLoading ? "..." : formatCurrency(totalExpense)}
          icon={<TrendingDown className="h-6 w-6 text-destructive" />}
          variant="destructive"
        />
        <StatCard
          title="Saldo Atual"
          value={isLoading ? "..." : formatCurrency(balance)}
          icon={<Wallet className="h-6 w-6 text-primary" />}
          variant={balance >= 0 ? "success" : "destructive"}
        />
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 mb-6 sm:mb-8">
        <StatCard
          title="Motoboys Ativos"
          value={isLoading ? "..." : String(activeMotoboys)}
          icon={<Bike className="h-6 w-6 text-primary" />}
        />
        <StatCard
          title="Receita Motoboys (Pagos)"
          value={isLoading ? "..." : formatCurrency(motoboyPaymentsTotal)}
          icon={<TrendingUp className="h-6 w-6 text-success" />}
          variant="success"
        />
      </div>

      {/* Motoboys */}
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Motoboys Cadastrados</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">Carregando...</p>
            ) : motoboys && motoboys.length > 0 ? (
              <div className="space-y-4">
                {motoboys.slice(0, 5).map((motoboy) => (
                  <div key={motoboy.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          <span className="text-sm font-medium text-primary">
                            {motoboy.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                          </span>
                        </div>
                        <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card ${
                          motoboy.status === "active" ? "bg-success" : "bg-muted"
                        }`} />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{motoboy.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {motoboy.shift === 'day' ? 'Diurno' : motoboy.shift === 'night' ? 'Noturno' : motoboy.shift === 'star' ? 'Estrela' : motoboy.shift === 'free' ? 'Free' : 'Fim de Semana'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${motoboy.payment_status === "paid" ? "text-success" : "text-destructive"}`}>
                        {motoboy.payment_status === "paid" ? "Pago" : "Não Pago"}
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
      </div>

      <DeleteConfirmDialog
        open={resetDialogOpen}
        onOpenChange={setResetDialogOpen}
        onConfirm={handleReset}
        title="Zerar Semana"
        description="Isso vai redefinir todos os pagamentos dos motoboys para 'Não Pago' e zerar o saldo. Deseja continuar?"
        isLoading={isResetting}
      />
    </MainLayout>
  );
};

export default Dashboard;
