import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loan, LoanPayment, useLoanPayments, calculateLoanDetails, useUpdateLoanStatus, useDeleteLoan, useUpdateLoanPayment, useDeleteLoanPayment } from "@/hooks/useLoans";
import LoanPaymentDialog from "./LoanPaymentDialog";
import LoanEditDialog from "./LoanEditDialog";
import { ChevronDown, ChevronUp, Trash2, CheckCircle, Clock, Pencil, Save, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editPaymentType, setEditPaymentType] = useState<string>("interest");
  const [deletePaymentOpen, setDeletePaymentOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);
  const { data: payments = [] } = useLoanPayments(loan.id);
  const updateStatus = useUpdateLoanStatus();
  const deleteLoan = useDeleteLoan();
  const updatePayment = useUpdateLoanPayment();
  const deletePayment = useDeleteLoanPayment();
  const details = calculateLoanDetails(loan, payments);

  const isActive = loan.status === 'active';

  const startEditPayment = (p: LoanPayment) => {
    setEditingPaymentId(p.id);
    setEditAmount(String(p.amount));
    setEditDate(p.payment_date);
    setEditNotes(p.notes || "");
    setEditPaymentType(p.payment_type || "interest");
  };

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
                <LoanPaymentDialog loanId={loan.id} maxAmount={details.totalWithInterest} monthlyInterest={details.monthlyInterest} />
                <Button variant="ghost" size="sm" onClick={() => updateStatus.mutate({ id: loan.id, status: 'paid' })} title="Marcar como quitado">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </Button>
              </>
            )}
            {!isActive && (
              <Button variant="ghost" size="sm" onClick={() => updateStatus.mutate({ id: loan.id, status: 'active' })} title="Reativar">
                <Clock className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
            <DeleteConfirmDialog open={deleteOpen} onOpenChange={setDeleteOpen} title="Excluir empréstimo" description={`Deseja excluir o empréstimo de ${loan.person_name}?`} onConfirm={() => deleteLoan.mutate(loan.id)} />
          </div>
        </div>
        {loan.notes && <p className="text-sm text-muted-foreground mt-1">{loan.notes}</p>}
        {loan.due_date && (
          <p className="text-sm text-muted-foreground mt-1">
            Vencimento: {format(new Date(loan.due_date + 'T12:00:00'), "dd/MM/yyyy", { locale: ptBR })}
          </p>
        )}
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
              payments.map(p => {
                const isEditing = editingPaymentId === p.id;
                if (isEditing) {
                  return (
                    <div key={p.id} className="flex items-center gap-2 rounded-md border p-3 text-sm flex-wrap">
                      <Input type="number" step="0.01" value={editAmount} onChange={e => setEditAmount(e.target.value)} className="h-8 w-28" />
                      <Input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} className="h-8 w-36" />
                      <Select value={editPaymentType} onValueChange={setEditPaymentType}>
                        <SelectTrigger className="h-8 w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="interest">💰 Juros</SelectItem>
                          <SelectItem value="principal">📉 Saldo</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input value={editNotes} onChange={e => setEditNotes(e.target.value)} placeholder="Notas" className="h-8 flex-1 min-w-[80px]" />
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => {
                        updatePayment.mutate({ id: p.id, amount: Number(editAmount), payment_date: editDate, notes: editNotes.trim() || undefined, payment_type: editPaymentType }, {
                          onSuccess: () => setEditingPaymentId(null)
                        });
                      }}><Save className="h-3 w-3" /></Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setEditingPaymentId(null)}><X className="h-3 w-3" /></Button>
                    </div>
                  );
                }
                return (
                  <div key={p.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant={p.payment_type === 'principal' ? 'default' : 'secondary'} className="text-xs">
                        {p.payment_type === 'principal' ? '📉 Saldo' : '💰 Juros'}
                      </Badge>
                      <span className="font-medium">{formatCurrency(Number(p.amount))}</span>
                      {p.notes && <span className="text-muted-foreground">— {p.notes}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">
                        {format(new Date(p.payment_date + 'T12:00:00'), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => startEditPayment(p)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => {
                        setPaymentToDelete(p.id);
                        setDeletePaymentOpen(true);
                      }}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
        <DeleteConfirmDialog open={deletePaymentOpen} onOpenChange={setDeletePaymentOpen} title="Excluir pagamento" description="Deseja excluir este pagamento?" onConfirm={() => { if (paymentToDelete) deletePayment.mutate(paymentToDelete); setDeletePaymentOpen(false); }} />
      </CardContent>
      <LoanEditDialog loan={loan} open={editOpen} onOpenChange={setEditOpen} />
    </Card>
  );
};

export default LoanCard;
