import { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import StatCard from "@/components/dashboard/StatCard";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BadgeStatus } from "@/components/ui/badge-status";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, Clock, CheckCircle2, XCircle, Check, X, TrendingUp, TrendingDown } from "lucide-react";

interface RecurringTransaction {
  id: string;
  description: string;
  category: string;
  type: "income" | "expense";
  amount: string;
  frequency: string;
  nextDate: string;
  status: "pending" | "approved" | "rejected";
}

const mockRecurring: RecurringTransaction[] = [
  { id: "1", description: "Aluguel Escritório", category: "Aluguel", type: "expense", amount: "R$ 2.800,00", frequency: "Mensal", nextDate: "01/02/2025", status: "pending" },
  { id: "2", description: "Conta de Telefone", category: "Telecomunicações", type: "expense", amount: "R$ 380,00", frequency: "Mensal", nextDate: "10/02/2025", status: "pending" },
  { id: "3", description: "Internet", category: "Telecomunicações", type: "expense", amount: "R$ 150,00", frequency: "Mensal", nextDate: "15/02/2025", status: "approved" },
  { id: "4", description: "Contrato Cliente A", category: "Contratos", type: "income", amount: "R$ 5.000,00", frequency: "Mensal", nextDate: "05/02/2025", status: "approved" },
  { id: "5", description: "Contrato Cliente B", category: "Contratos", type: "income", amount: "R$ 3.500,00", frequency: "Mensal", nextDate: "05/02/2025", status: "pending" },
  { id: "6", description: "Seguro Veículos", category: "Seguros", type: "expense", amount: "R$ 1.200,00", frequency: "Mensal", nextDate: "20/02/2025", status: "rejected" },
];

const Recurring = () => {
  const pendingItems = mockRecurring.filter(r => r.status === "pending");
  const approvedItems = mockRecurring.filter(r => r.status === "approved");
  
  const pendingIncome = pendingItems
    .filter(r => r.type === "income")
    .reduce((acc, r) => acc + parseFloat(r.amount.replace(/[^\d,]/g, '').replace(',', '.')), 0);
  
  const pendingExpense = pendingItems
    .filter(r => r.type === "expense")
    .reduce((acc, r) => acc + parseFloat(r.amount.replace(/[^\d,]/g, '').replace(',', '.')), 0);

  return (
    <MainLayout title="Recorrências" subtitle="Transações pendentes de aprovação">
      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <StatCard
          title="Pendentes de Aprovação"
          value={pendingItems.length.toString()}
          icon={<Clock className="h-6 w-6 text-warning" />}
          variant="warning"
        />
        <StatCard
          title="Entradas Pendentes"
          value={`R$ ${pendingIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={<TrendingUp className="h-6 w-6 text-success" />}
          variant="success"
        />
        <StatCard
          title="Saídas Pendentes"
          value={`R$ ${pendingExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={<TrendingDown className="h-6 w-6 text-destructive" />}
          variant="destructive"
        />
      </div>

      {/* Pending Approval Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-warning" />
            Aguardando Aprovação
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingItems.length > 0 ? (
            <div className="space-y-4">
              {pendingItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30">
                  <div className="flex items-center gap-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      item.type === "income" ? "bg-success/10" : "bg-destructive/10"
                    }`}>
                      {item.type === "income" ? (
                        <TrendingUp className="h-5 w-5 text-success" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-destructive" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{item.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.category} • {item.frequency} • Próximo: {item.nextDate}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className={`font-semibold ${
                      item.type === "income" ? "text-success" : "text-destructive"
                    }`}>
                      {item.type === "income" ? "+" : "-"} {item.amount}
                    </p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="text-success border-success hover:bg-success/10">
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" className="text-destructive border-destructive hover:bg-destructive/10">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma recorrência pendente de aprovação
            </p>
          )}
        </CardContent>
      </Card>

      {/* All Recurring Table */}
      <div className="data-table">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead>Descrição</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Frequência</TableHead>
              <TableHead>Próxima Data</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockRecurring.map((item) => (
              <TableRow key={item.id} className="border-border">
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                      item.type === "income" ? "bg-success/10" : "bg-destructive/10"
                    }`}>
                      <RefreshCw className={`h-5 w-5 ${
                        item.type === "income" ? "text-success" : "text-destructive"
                      }`} />
                    </div>
                    {item.description}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{item.category}</TableCell>
                <TableCell className="text-muted-foreground">{item.frequency}</TableCell>
                <TableCell className="text-muted-foreground">{item.nextDate}</TableCell>
                <TableCell className={`text-right font-semibold ${
                  item.type === "income" ? "text-success" : "text-destructive"
                }`}>
                  {item.type === "income" ? "+" : "-"} {item.amount}
                </TableCell>
                <TableCell>
                  <BadgeStatus status={
                    item.status === "approved" ? "success" : 
                    item.status === "pending" ? "warning" : "error"
                  }>
                    {item.status === "approved" ? "Aprovado" : 
                     item.status === "pending" ? "Pendente" : "Rejeitado"}
                  </BadgeStatus>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </MainLayout>
  );
};

export default Recurring;
