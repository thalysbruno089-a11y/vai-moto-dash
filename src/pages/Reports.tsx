import { useState, useMemo } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Download, TrendingUp, Bike, Calendar, Loader2, CreditCard, CalendarDays } from "lucide-react";
import { useCashFlow } from "@/hooks/useCashFlow";
import { useMotoboys } from "@/hooks/useMotoboys";
import { usePayments } from "@/hooks/usePayments";
import { format, parseISO, isWithinInterval, startOfMonth, endOfMonth, getDay, addDays, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { getPaymentWeeksForMonths, PaymentWeek } from "@/lib/weekUtils";

const Reports = () => {
  const today = new Date();
  const [startDate, setStartDate] = useState(format(startOfMonth(today), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(today), 'yyyy-MM-dd'));
  const [motoboyFilter, setMotoboyFilter] = useState("all");
  const [selectedWeek, setSelectedWeek] = useState("all");

  const { data: cashFlow, isLoading: loadingCashFlow } = useCashFlow();
  const { data: motoboys, isLoading: loadingMotoboys } = useMotoboys();
  const { data: payments, isLoading: loadingPayments } = usePayments();

  const isLoading = loadingCashFlow || loadingMotoboys || loadingPayments;

  // Gerar semanas disponíveis
  const monthsWithWeeks = useMemo(() => getPaymentWeeksForMonths(3), []);
  const allWeeks = useMemo(() => {
    const weeks: PaymentWeek[] = [];
    monthsWithWeeks.forEach(m => weeks.push(...m.weeks));
    return weeks;
  }, [monthsWithWeeks]);

  // Filter data by date range
  const filteredCashFlow = useMemo(() => {
    if (!cashFlow) return [];
    return cashFlow.filter(entry => {
      const entryDate = parseISO(entry.flow_date);
      return isWithinInterval(entryDate, {
        start: parseISO(startDate),
        end: parseISO(endDate)
      });
    });
  }, [cashFlow, startDate, endDate]);

  const filteredPayments = useMemo(() => {
    if (!payments) return [];
    return payments.filter(payment => {
      const paymentDate = parseISO(payment.period_start);
      const inDateRange = isWithinInterval(paymentDate, {
        start: parseISO(startDate),
        end: parseISO(endDate)
      });
      const matchesMotoboy = motoboyFilter === "all" || payment.motoboy_id === motoboyFilter;
      return inDateRange && matchesMotoboy;
    });
  }, [payments, startDate, endDate, motoboyFilter]);

  // Filter payments by selected week
  const weeklyPayments = useMemo(() => {
    if (!payments) return [];
    if (selectedWeek === "all") return payments;
    
    const week = allWeeks.find(w => w.id === selectedWeek);
    if (!week) return [];
    
    return payments.filter(payment => {
      const paymentStart = parseISO(payment.period_start);
      const paymentEnd = parseISO(payment.period_end);
      // Check if payment period overlaps with selected week
      return paymentStart <= week.endDate && paymentEnd >= week.startDate;
    });
  }, [payments, selectedWeek, allWeeks]);

  // Calculate stats
  const incomeTotal = filteredCashFlow
    .filter(t => t.type === "revenue")
    .reduce((acc, t) => acc + Number(t.value), 0);

  const expenseTotal = filteredCashFlow
    .filter(t => t.type === "expense")
    .reduce((acc, t) => acc + Number(t.value), 0);

  const totalPayments = filteredPayments.reduce((acc, p) => acc + Number(p.value), 0);
  const weeklyPaymentsTotal = weeklyPayments.reduce((acc, p) => acc + Number(p.value), 0);

  const activeMotoboys = (motoboys || []).filter(m => m.status === 'active').length;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDateDisplay = (dateStr: string) => {
    return format(parseISO(dateStr), "dd/MM/yyyy", { locale: ptBR });
  };

  // Generate CSV content
  const generateCSV = (type: string) => {
    let csvContent = "";
    let filename = "";

    if (type === "financial") {
      csvContent = "Data,Tipo,Descrição,Categoria,Valor\n";
      filteredCashFlow.forEach(entry => {
        const tipo = entry.type === "revenue" ? "Entrada" : "Saída";
        const valor = entry.type === "revenue" ? Number(entry.value) : -Number(entry.value);
        const categoria = entry.categories?.name || 'Sem categoria';
        csvContent += `${formatDateDisplay(entry.flow_date)},${tipo},"${entry.description || 'Sem descrição'}","${categoria}",${valor}\n`;
      });
      filename = `relatorio-financeiro-${startDate}-${endDate}.csv`;
    } else if (type === "motorcyclists") {
      csvContent = "Nome,CPF,Telefone,Turno,Status,Endereço\n";
      (motoboys || []).forEach(m => {
        const turno = m.shift === 'day' ? 'Diurno' : m.shift === 'night' ? 'Noturno' : 'Integral';
        const status = m.status === 'active' ? 'Ativo' : 'Inativo';
        csvContent += `"${m.name}","${m.cpf || ''}","${m.phone || ''}",${turno},${status},"${m.address || ''}"\n`;
      });
      filename = `relatorio-motoboys-${format(today, 'yyyy-MM-dd')}.csv`;
    } else if (type === "payments") {
      csvContent = "Motoboy,Período Início,Período Fim,Valor,Status,Pago Em\n";
      filteredPayments.forEach(p => {
        const status = p.status === 'paid' ? 'Pago' : 'Pendente';
        const paidAt = p.paid_at ? formatDateDisplay(p.paid_at) : '';
        csvContent += `"${p.motoboys?.name || 'N/A'}",${formatDateDisplay(p.period_start)},${formatDateDisplay(p.period_end)},${Number(p.value)},${status},${paidAt}\n`;
      });
      filename = `relatorio-pagamentos-${startDate}-${endDate}.csv`;
    } else if (type === "weekly") {
      const week = allWeeks.find(w => w.id === selectedWeek);
      const weekLabel = week ? `${format(week.startDate, 'dd-MM')}_${format(week.endDate, 'dd-MM-yyyy')}` : 'todas';
      csvContent = "Motoboy,Período Início,Período Fim,Valor,Status,Pago Em\n";
      weeklyPayments.forEach(p => {
        const status = p.status === 'paid' ? 'Pago' : 'Pendente';
        const paidAt = p.paid_at ? formatDateDisplay(p.paid_at) : '';
        csvContent += `"${p.motoboys?.name || 'N/A'}",${formatDateDisplay(p.period_start)},${formatDateDisplay(p.period_end)},${Number(p.value)},${status},${paidAt}\n`;
      });
      filename = `relatorio-semanal-${weekLabel}.csv`;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    toast.success('CSV exportado com sucesso!');
  };

  // Generate PDF (simple version - opens print dialog)
  const generatePDF = (type: string) => {
    let content = "";
    const periodText = `Período: ${formatDateDisplay(startDate)} - ${formatDateDisplay(endDate)}`;

    if (type === "financial") {
      content = `
        <html>
        <head>
          <title>Relatório Financeiro</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f4f4f4; }
            .total { font-weight: bold; margin-top: 20px; }
            .revenue { color: #16a34a; }
            .expense { color: #dc2626; }
          </style>
        </head>
        <body>
          <h1>Relatório Financeiro</h1>
          <p>${periodText}</p>
          <table>
            <thead>
              <tr><th>Data</th><th>Tipo</th><th>Categoria</th><th>Descrição</th><th>Valor</th></tr>
            </thead>
            <tbody>
              ${filteredCashFlow.map(entry => `
                <tr>
                  <td>${formatDateDisplay(entry.flow_date)}</td>
                  <td>${entry.type === "revenue" ? "Entrada" : "Saída"}</td>
                  <td>${entry.categories?.name || 'Sem categoria'}</td>
                  <td>${entry.description || 'Sem descrição'}</td>
                  <td class="${entry.type === 'revenue' ? 'revenue' : 'expense'}">${formatCurrency(Number(entry.value))}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <p class="total revenue">Total de Entradas: ${formatCurrency(incomeTotal)}</p>
          <p class="total expense">Total de Saídas: ${formatCurrency(expenseTotal)}</p>
          <p class="total">Balanço: ${formatCurrency(incomeTotal - expenseTotal)}</p>
        </body>
        </html>
      `;
    } else if (type === "motorcyclists") {
      content = `
        <html>
        <head>
          <title>Relatório de Motoboys</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f4f4f4; }
            .active { color: #16a34a; }
            .inactive { color: #dc2626; }
          </style>
        </head>
        <body>
          <h1>Relatório de Motoboys</h1>
          <p>Gerado em: ${format(today, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
          <table>
            <thead>
              <tr><th>Nome</th><th>CPF</th><th>Telefone</th><th>Turno</th><th>Status</th></tr>
            </thead>
            <tbody>
              ${(motoboys || []).map(m => `
                <tr>
                  <td>${m.name}</td>
                  <td>${m.cpf || '-'}</td>
                  <td>${m.phone || '-'}</td>
                  <td>${m.shift === 'day' ? 'Diurno' : m.shift === 'night' ? 'Noturno' : 'Integral'}</td>
                  <td class="${m.status === 'active' ? 'active' : 'inactive'}">${m.status === 'active' ? 'Ativo' : 'Inativo'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <p class="total">Total de Motoboys: ${motoboys?.length || 0}</p>
          <p class="total">Motoboys Ativos: ${activeMotoboys}</p>
        </body>
        </html>
      `;
    } else if (type === "payments") {
      content = `
        <html>
        <head>
          <title>Relatório de Pagamentos</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f4f4f4; }
            .paid { color: #16a34a; }
            .pending { color: #f59e0b; }
          </style>
        </head>
        <body>
          <h1>Relatório de Pagamentos</h1>
          <p>${periodText}</p>
          <table>
            <thead>
              <tr><th>Motoboy</th><th>Período</th><th>Valor</th><th>Status</th><th>Pago Em</th></tr>
            </thead>
            <tbody>
              ${filteredPayments.map(p => `
                <tr>
                  <td>${p.motoboys?.name || 'N/A'}</td>
                  <td>${formatDateDisplay(p.period_start)} - ${formatDateDisplay(p.period_end)}</td>
                  <td>${formatCurrency(Number(p.value))}</td>
                  <td class="${p.status === 'paid' ? 'paid' : 'pending'}">${p.status === 'paid' ? 'Pago' : 'Pendente'}</td>
                  <td>${p.paid_at ? formatDateDisplay(p.paid_at) : '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <p class="total">Total de Pagamentos: ${formatCurrency(totalPayments)}</p>
        </body>
        </html>
      `;
    } else if (type === "weekly") {
      const week = allWeeks.find(w => w.id === selectedWeek);
      const weekPeriod = week 
        ? `${format(week.startDate, "dd/MM/yyyy")} - ${format(week.endDate, "dd/MM/yyyy")}`
        : "Todas as semanas";
      
      content = `
        <html>
        <head>
          <title>Relatório Semanal de Pagamentos</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f4f4f4; }
            .paid { color: #16a34a; }
            .pending { color: #f59e0b; }
          </style>
        </head>
        <body>
          <h1>Relatório Semanal de Pagamentos</h1>
          <p>Semana: ${weekPeriod}</p>
          <table>
            <thead>
              <tr><th>Motoboy</th><th>Período</th><th>Valor</th><th>Status</th><th>Pago Em</th></tr>
            </thead>
            <tbody>
              ${weeklyPayments.map(p => `
                <tr>
                  <td>${p.motoboys?.name || 'N/A'}</td>
                  <td>${formatDateDisplay(p.period_start)} - ${formatDateDisplay(p.period_end)}</td>
                  <td>${formatCurrency(Number(p.value))}</td>
                  <td class="${p.status === 'paid' ? 'paid' : 'pending'}">${p.status === 'paid' ? 'Pago' : 'Pendente'}</td>
                  <td>${p.paid_at ? formatDateDisplay(p.paid_at) : '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <p class="total">Total da Semana: ${formatCurrency(weeklyPaymentsTotal)}</p>
          <p class="total">Pagamentos Pagos: ${weeklyPayments.filter(p => p.status === 'paid').length}</p>
          <p class="total">Pagamentos Pendentes: ${weeklyPayments.filter(p => p.status === 'pending').length}</p>
        </body>
        </html>
      `;
    }

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(content);
      printWindow.document.close();
      printWindow.print();
    }
    toast.success('PDF gerado - use Ctrl+P para salvar!');
  };

  const reports = [
    {
      id: "financial",
      title: "Relatório Financeiro",
      description: "Resumo financeiro com entradas, saídas e balanço",
      icon: TrendingUp,
    },
    {
      id: "motorcyclists",
      title: "Relatório de Motoboys",
      description: "Lista completa de motoboys cadastrados",
      icon: Bike,
    },
    {
      id: "payments",
      title: "Relatório de Pagamentos",
      description: "Pagamentos registrados por motoboy e período",
      icon: CreditCard,
    },
  ];

  return (
    <MainLayout title="Relatórios" subtitle="Gere relatórios detalhados">
      {/* Filters */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Período do Relatório
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label>Data Inicial</Label>
              <Input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Data Final</Label>
              <Input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Motoboy</Label>
              <Select value={motoboyFilter} onValueChange={setMotoboyFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {(motoboys || []).map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Types */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-6 sm:mb-8">
        {reports.map((report) => (
          <Card key={report.id} className="hover:shadow-elevated transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <report.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{report.title}</CardTitle>
                    <CardDescription>{report.description}</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Button 
                  className="flex-1"
                  onClick={() => generatePDF(report.id)}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FileText className="mr-2 h-4 w-4" />
                  )}
                  Gerar PDF
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => generateCSV(report.id)}
                  disabled={isLoading}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Exportar CSV
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Weekly Report */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <CalendarDays className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Relatório Semanal de Pagamentos</CardTitle>
                <CardDescription>Pagamentos por semana (quinta a quarta)</CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Selecione a Semana</Label>
              <Select value={selectedWeek} onValueChange={setSelectedWeek}>
                <SelectTrigger className="w-full md:w-[300px]">
                  <SelectValue placeholder="Selecione uma semana" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as semanas</SelectItem>
                  {monthsWithWeeks.map((month) => (
                    <div key={month.month}>
                      <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground bg-muted/50 capitalize">
                        {month.month}
                      </div>
                      {month.weeks.map((week) => (
                        <SelectItem key={week.id} value={week.id}>
                          {week.label}
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="p-4 rounded-lg bg-muted/50">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-primary">{formatCurrency(weeklyPaymentsTotal)}</p>
                  <p className="text-sm text-muted-foreground">Total da Semana</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-success">{weeklyPayments.filter(p => p.status === 'paid').length}</p>
                  <p className="text-sm text-muted-foreground">Pagos</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-warning">{weeklyPayments.filter(p => p.status === 'pending').length}</p>
                  <p className="text-sm text-muted-foreground">Pendentes</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                className="flex-1"
                onClick={() => generatePDF("weekly")}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="mr-2 h-4 w-4" />
                )}
                Gerar PDF Semanal
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => generateCSV("weekly")}
                disabled={isLoading}
              >
                <Download className="mr-2 h-4 w-4" />
                Exportar CSV Semanal
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Prévia do Período</CardTitle>
          <CardDescription>
            {formatDateDisplay(startDate)} - {formatDateDisplay(endDate)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-4">
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-3xl font-bold text-success">{formatCurrency(incomeTotal)}</p>
                <p className="text-sm text-muted-foreground">Total de Entradas</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-3xl font-bold text-destructive">{formatCurrency(expenseTotal)}</p>
                <p className="text-sm text-muted-foreground">Total de Saídas</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-3xl font-bold text-primary">{formatCurrency(totalPayments)}</p>
                <p className="text-sm text-muted-foreground">Total em Pagamentos</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-3xl font-bold text-foreground">{activeMotoboys}</p>
                <p className="text-sm text-muted-foreground">Motoboys Ativos</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </MainLayout>
  );
};

export default Reports;
