import MainLayout from "@/components/layout/MainLayout";
import { useLoans, useAllLoanPayments } from "@/hooks/useLoans";
import LoanFormDialog from "@/components/loans/LoanFormDialog";
import LoanCard from "@/components/loans/LoanCard";
import { Card, CardContent } from "@/components/ui/card";
import { HandCoins, TrendingUp, Banknote } from "lucide-react";
import { useMemo } from "react";

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const LoansLent = () => {
  const { data: loans = [], isLoading } = useLoans('lent');
  const loanIds = useMemo(() => loans.map(l => l.id), [loans]);
  const { data: allPayments = [] } = useAllLoanPayments('lent', loanIds);

  const activeLoans = loans.filter(l => l.status === 'active');
  const totalLent = activeLoans.reduce((s, l) => s + Number(l.principal_amount), 0);
  const totalInterestPaid = allPayments
    .filter(p => p.payment_type === 'interest')
    .reduce((s, p) => s + Number(p.amount), 0);

  return (
    <MainLayout title="Emprestei" subtitle="Dinheiro que você emprestou para outras pessoas">
      <div className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <HandCoins className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Emprestado (Ativos)</p>
                  <p className="text-xl font-bold">{formatCurrency(totalLent)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Empréstimos Ativos</p>
                  <p className="text-xl font-bold">{activeLoans.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                  <Banknote className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total de Juros Recebidos</p>
                  <p className="text-xl font-bold">{formatCurrency(totalInterestPaid)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-end">
          <LoanFormDialog type="lent" />
        </div>

        {/* Loan Cards */}
        {isLoading ? (
          <p className="text-muted-foreground text-center py-8">Carregando...</p>
        ) : loans.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">Nenhum empréstimo cadastrado</p>
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

export default LoansLent;
