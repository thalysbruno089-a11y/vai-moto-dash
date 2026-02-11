import MainLayout from "@/components/layout/MainLayout";
import { useLoans } from "@/hooks/useLoans";
import LoanFormDialog from "@/components/loans/LoanFormDialog";
import LoanCard from "@/components/loans/LoanCard";
import { Card, CardContent } from "@/components/ui/card";
import { Landmark, TrendingDown, DollarSign } from "lucide-react";

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const LoansBorrowed = () => {
  const { data: loans = [], isLoading } = useLoans('borrowed');

  const activeLoans = loans.filter(l => l.status === 'active');
  const totalBorrowed = activeLoans.reduce((s, l) => s + Number(l.principal_amount), 0);
  const totalAllBorrowed = loans.reduce((s, l) => s + Number(l.principal_amount), 0);

  return (
    <MainLayout title="Peguei Emprestado" subtitle="Dinheiro que você pegou emprestado de outras pessoas">
      <div className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                  <Landmark className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Devido (Ativos)</p>
                  <p className="text-xl font-bold">{formatCurrency(totalBorrowed)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                  <TrendingDown className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Dívidas Ativas</p>
                  <p className="text-xl font-bold">{activeLoans.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Geral Pego</p>
                  <p className="text-xl font-bold">{formatCurrency(totalAllBorrowed)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-end">
          <LoanFormDialog type="borrowed" />
        </div>

        {/* Loan Cards */}
        {isLoading ? (
          <p className="text-muted-foreground text-center py-8">Carregando...</p>
        ) : loans.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">Nenhuma dívida cadastrada</p>
        ) : (
          <div className="space-y-4">
            {loans.map(loan => (
              <LoanCard key={loan.id} loan={loan} />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default LoansBorrowed;
