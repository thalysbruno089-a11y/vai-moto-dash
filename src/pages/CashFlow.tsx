import { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import StatCard from "@/components/dashboard/StatCard";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BadgeStatus } from "@/components/ui/badge-status";
import { Wallet, TrendingUp, TrendingDown, PiggyBank, Plus, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface Transaction {
  id: string;
  description: string;
  category: string;
  type: "income" | "expense";
  amount: string;
  date: string;
  recurring: boolean;
}

const mockTransactions: Transaction[] = [
  { id: "1", description: "Pagamento Cliente - Restaurante Sabor", category: "Receita de Entregas", type: "income", amount: "R$ 2.500,00", date: "19/01/2025", recurring: false },
  { id: "2", description: "Salário Motoboys - Semana 03", category: "Salários", type: "expense", amount: "R$ 8.500,00", date: "19/01/2025", recurring: false },
  { id: "3", description: "Manutenção Motos", category: "Manutenção", type: "expense", amount: "R$ 450,00", date: "18/01/2025", recurring: false },
  { id: "4", description: "Aluguel Escritório", category: "Aluguel", type: "expense", amount: "R$ 2.800,00", date: "15/01/2025", recurring: true },
  { id: "5", description: "Pagamento Cliente - Farmácia Central", category: "Receita de Entregas", type: "income", amount: "R$ 1.850,00", date: "15/01/2025", recurring: false },
  { id: "6", description: "Combustível", category: "Combustível", type: "expense", amount: "R$ 1.200,00", date: "14/01/2025", recurring: false },
  { id: "7", description: "Pagamento Cliente - Loja Tech", category: "Receita de Entregas", type: "income", amount: "R$ 3.200,00", date: "12/01/2025", recurring: false },
  { id: "8", description: "Conta de Telefone", category: "Telecomunicações", type: "expense", amount: "R$ 380,00", date: "10/01/2025", recurring: true },
];

const CashFlow = () => {
  const [periodFilter, setPeriodFilter] = useState<string>("month");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const filteredTransactions = mockTransactions.filter((t) => {
    const matchesType = typeFilter === "all" || t.type === typeFilter;
    return matchesType;
  });

  const incomeTotal = mockTransactions
    .filter(t => t.type === "income")
    .reduce((acc, t) => acc + parseFloat(t.amount.replace(/[^\d,]/g, '').replace(',', '.')), 0);
  
  const expenseTotal = mockTransactions
    .filter(t => t.type === "expense")
    .reduce((acc, t) => acc + parseFloat(t.amount.replace(/[^\d,]/g, '').replace(',', '.')), 0);

  const balance = incomeTotal - expenseTotal;

  return (
    <MainLayout title="Fluxo de Caixa" subtitle="Controle financeiro completo">
      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Saldo Atual"
          value={`R$ ${balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={<Wallet className="h-6 w-6 text-primary-foreground" />}
          variant="primary"
        />
        <StatCard
          title="Total de Entradas"
          value={`R$ ${incomeTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={<TrendingUp className="h-6 w-6 text-success-foreground" />}
          variant="success"
        />
        <StatCard
          title="Total de Saídas"
          value={`R$ ${expenseTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={<TrendingDown className="h-6 w-6 text-destructive-foreground" />}
          variant="destructive"
        />
        <StatCard
          title="Balanço Mensal"
          value={`R$ ${balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={<PiggyBank className="h-6 w-6 text-primary" />}
          trend={{ value: "12%", positive: balance > 0 }}
        />
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <Select value={periodFilter} onValueChange={setPeriodFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">Este mês</SelectItem>
            <SelectItem value="quarter">Trimestre</SelectItem>
            <SelectItem value="semester">Semestre</SelectItem>
            <SelectItem value="year">Este ano</SelectItem>
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="income">Entradas</SelectItem>
            <SelectItem value="expense">Saídas</SelectItem>
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas categorias</SelectItem>
            <SelectItem value="entregas">Receita de Entregas</SelectItem>
            <SelectItem value="salarios">Salários</SelectItem>
            <SelectItem value="combustivel">Combustível</SelectItem>
            <SelectItem value="manutencao">Manutenção</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex-1" />

        <Button variant="outline">
          <TrendingDown className="mr-2 h-4 w-4" />
          Nova Saída
        </Button>
        <Button>
          <TrendingUp className="mr-2 h-4 w-4" />
          Nova Entrada
        </Button>
      </div>

      {/* Table */}
      <div className="data-table">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead>Descrição</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Recorrente</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.map((transaction) => (
              <TableRow key={transaction.id} className="border-border">
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                      transaction.type === "income" ? "bg-success/10" : "bg-destructive/10"
                    }`}>
                      {transaction.type === "income" ? (
                        <ArrowUpRight className="h-5 w-5 text-success" />
                      ) : (
                        <ArrowDownRight className="h-5 w-5 text-destructive" />
                      )}
                    </div>
                    {transaction.description}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{transaction.category}</TableCell>
                <TableCell className="text-muted-foreground">{transaction.date}</TableCell>
                <TableCell className={`text-right font-semibold ${
                  transaction.type === "income" ? "text-success" : "text-destructive"
                }`}>
                  {transaction.type === "income" ? "+" : "-"} {transaction.amount}
                </TableCell>
                <TableCell>
                  {transaction.recurring ? (
                    <BadgeStatus status="active">Sim</BadgeStatus>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Summary */}
      <div className="mt-4 text-sm text-muted-foreground">
        Mostrando {filteredTransactions.length} transações
      </div>
    </MainLayout>
  );
};

export default CashFlow;
