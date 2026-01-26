import MainLayout from "@/components/layout/MainLayout";
import StatCard from "@/components/dashboard/StatCard";
import { Wallet, TrendingUp, TrendingDown, PiggyBank, Bike, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCashFlow } from "@/hooks/useCashFlow";
import { useMotoboys } from "@/hooks/useMotoboys";

const Dashboard = () => {
  const { data: cashFlowEntries, isLoading: loadingCashFlow } = useCashFlow();
  const { data: motoboys, isLoading: loadingMotoboys } = useMotoboys();

  // Calculate motoboy payments total (active motoboys weekly payment)
  const motoboyPaymentsTotal = motoboys
    ?.filter(m => m.status === 'active')
    .reduce((sum, m) => sum + Number((m as any).weekly_payment || 0), 0) || 0;

  // Calculate financial stats from real data
  const incomeTotal = cashFlowEntries?.filter(e => e.type === 'revenue').reduce((sum, e) => sum + Number(e.value), 0) || 0;
  const cashFlowExpenseTotal = cashFlowEntries?.filter(e => e.type === 'expense').reduce((sum, e) => sum + Number(e.value), 0) || 0;
  
  // Total expenses includes cash flow expenses + motoboy payments
  const expenseTotal = cashFlowExpenseTotal + motoboyPaymentsTotal;
  const balance = incomeTotal - expenseTotal;

  // Get active motoboys count
  const activeMotoboys = motoboys?.filter(m => m.status === 'active').length || 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const isLoading = loadingCashFlow || loadingMotoboys;

  return (
    <MainLayout title="Dashboard" subtitle="Visão geral financeira da sua empresa">
      {/* Financial Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Saldo Atual"
          value={isLoading ? "..." : formatCurrency(balance)}
          icon={<Wallet className="h-6 w-6 text-primary" />}
          variant="primary"
        />
        <StatCard
          title="Total de Entradas"
          value={isLoading ? "..." : formatCurrency(incomeTotal)}
          icon={<TrendingUp className="h-6 w-6 text-success" />}
          variant="success"
        />
        <StatCard
          title="Total de Saídas"
          value={isLoading ? "..." : formatCurrency(expenseTotal)}
          icon={<TrendingDown className="h-6 w-6 text-destructive" />}
          variant="destructive"
        />
        <StatCard
          title="Balanço Geral"
          value={isLoading ? "..." : formatCurrency(balance)}
          icon={<PiggyBank className="h-6 w-6 text-primary" />}
          variant={balance >= 0 ? "success" : "destructive"}
        />
      </div>

      {/* Quick Stats */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <StatCard
          title="Motoboys Ativos"
          value={isLoading ? "..." : String(activeMotoboys)}
          icon={<Bike className="h-6 w-6 text-primary" />}
        />
        <StatCard
          title="Total de Motoboys"
          value={isLoading ? "..." : String(motoboys?.length || 0)}
          icon={<Bike className="h-6 w-6 text-primary" />}
        />
        <StatCard
          title="Pagamentos Motoboys"
          value={isLoading ? "..." : formatCurrency(motoboyPaymentsTotal)}
          icon={<DollarSign className="h-6 w-6 text-destructive" />}
          variant="destructive"
        />
      </div>

      {/* Motoboys em Atividade */}
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
                          {motoboy.shift === 'day' ? 'Diurno' : motoboy.shift === 'night' ? 'Noturno' : 'Estrela'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${motoboy.status === "active" ? "text-success" : "text-muted-foreground"}`}>
                        {motoboy.status === "active" ? "Ativo" : "Inativo"}
                      </p>
                      {motoboy.phone && (
                        <p className="text-sm text-muted-foreground">{motoboy.phone}</p>
                      )}
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
    </MainLayout>
  );
};

export default Dashboard;
