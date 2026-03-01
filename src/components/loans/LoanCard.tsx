import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loan, useLoanPayments, calculateLoanDetails, useUpdateLoanStatus, useDeleteLoan } from "@/hooks/useLoans";
import LoanPaymentDialog from "./LoanPaymentDialog";
import LoanEditDialog from "./LoanEditDialog";
import { ChevronDown, ChevronUp, Trash2, CheckCircle, Clock, Pencil } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";

interface Props {
  loan: Loan;
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const LoanCard = ({ loan }: Props) => {
  const [expanded, setExpanded] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const { data: payments = [] } = useLoanPayments(loan.id);
  const updateStatus = useUpdateLoanStatus();
  const deleteLoan = useDeleteLoan();
  const details = calculateLoanDetails(loan, payments);

  const isActive = loan.status === 'active';

  return (
    <Card className={!isActive ? "opacity-60" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg">{loan.person_name}</CardTitle>
            <Badge variant={isActive ? "default" : "secondary"}>
              {isActive ? "Ativo" : "Quitado"}
            </Badge>
            <Badge variant="outline">{loan.interest_rate}% a.m.</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setEditOpen(true)} title="Editar">
              <Pencil className="h-4 w-4" />
            </Button>
            {isActive && (
              <>
                <LoanPaymentDialog loanId={loan.id} maxAmount={details.remainingBalance} />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => updateStatus.mutate({ id: loan.id, status: 'paid' })}
                  title="Marcar como quitado"
                >
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </Button>
              </>
            )}
            {!isActive && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => updateStatus.mutate({ id: loan.id, status: 'active' })}
                title="Reativar"
              >
                <Clock className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
            <DeleteConfirmDialog
              open={deleteOpen}
              onOpenChange={setDeleteOpen}
              title="Excluir empréstimo"
              description={`Deseja excluir o empréstimo de ${loan.person_name}?`}
              onConfirm={() => deleteLoan.mutate(loan.id)}
            />
          </div>
        </div>
        {loan.notes && <p className="text-sm text-muted-foreground mt-1">{loan.notes}</p>}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-3">
          <div>
            <p className="text-xs text-muted-foreground">Valor Emprestado</p>
            <p className="text-sm font-semibold">{formatCurrency(Number(loan.principal_amount))}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Saldo Devedor</p>
            <p className="text-sm font-semibold text-destructive">{formatCurrency(details.remainingBalance)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Juros Mensal Atual</p>
            <p className="text-sm font-semibold text-amber-600">{formatCurrency(details.monthlyInterest)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Juros Pagos</p>
            <p className="text-sm font-semibold text-blue-600">{formatCurrency(details.totalInterestPaid)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Pago</p>
            <p className="text-sm font-semibold text-green-600">{formatCurrency(details.totalPaid)}</p>
          </div>
        </div>

        <Button variant="ghost" size="sm" className="w-full" onClick={() => setExpanded(!expanded)}>
          {expanded ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
          {expanded ? "Ocultar pagamentos" : `Ver pagamentos (${payments.length})`}
        </Button>

        {expanded && (
          <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
            {payments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum pagamento registrado</p>
            ) : (
              payments.map(p => (
                <div key={p.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                  <div>
                    <span className="font-medium">{formatCurrency(Number(p.amount))}</span>
                    {p.notes && <span className="text-muted-foreground ml-2">— {p.notes}</span>}
                  </div>
                  <span className="text-muted-foreground">
                    {format(new Date(p.payment_date + 'T12:00:00'), "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
      <LoanEditDialog loan={loan} open={editOpen} onOpenChange={setEditOpen} />
    </Card>
  );
};

export default LoanCard;
