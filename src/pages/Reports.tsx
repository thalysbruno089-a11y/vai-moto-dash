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
import { FileText, Download, TrendingUp, Bike, Calendar, Loader2, Users } from "lucide-react";
import { useCashFlow } from "@/hooks/useCashFlow";
import { useMotoboys } from "@/hooks/useMotoboys";
import { useRides } from "@/hooks/useRides";
import { useClients } from "@/hooks/useClients";
import { format, parseISO, isWithinInterval, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

const Reports = () => {
  const today = new Date();
  const [startDate, setStartDate] = useState(format(startOfMonth(today), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(today), 'yyyy-MM-dd'));
  const [motoboyFilter, setMotoboyFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");

  const { data: cashFlow, isLoading: loadingCashFlow } = useCashFlow();
  const { data: motoboys, isLoading: loadingMotoboys } = useMotoboys();
  const { data: rides, isLoading: loadingRides } = useRides();
  const { data: clients, isLoading: loadingClients } = useClients();

  const isLoading = loadingCashFlow || loadingMotoboys || loadingRides || loadingClients;

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

  const filteredRides = useMemo(() => {
    if (!rides) return [];
    return rides.filter(ride => {
      const rideDate = parseISO(ride.ride_date);
      const inDateRange = isWithinInterval(rideDate, {
        start: parseISO(startDate),
        end: parseISO(endDate)
      });
      const matchesMotoboy = motoboyFilter === "all" || ride.motoboy_id === motoboyFilter;
      const matchesClient = clientFilter === "all" || ride.client_id === clientFilter;
      return inDateRange && matchesMotoboy && matchesClient;
    });
  }, [rides, startDate, endDate, motoboyFilter, clientFilter]);

  // Calculate stats
  const incomeTotal = filteredCashFlow
    .filter(t => t.type === "revenue")
    .reduce((acc, t) => acc + Number(t.value), 0);

  const expenseTotal = filteredCashFlow
    .filter(t => t.type === "expense")
    .reduce((acc, t) => acc + Number(t.value), 0);

  const totalRidesValue = filteredRides.reduce((acc, r) => acc + Number(r.value), 0);
  const totalRidesCount = filteredRides.length;

  const activeMotoboys = (motoboys || []).filter(m => m.status === 'active').length;
  const totalClients = clients?.length || 0;

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
      csvContent = "Número,Nome,Telefone,Turno,Status,Valor Semanal,Endereço\n";
      (motoboys || []).forEach(m => {
        const turno = m.shift === 'day' ? 'Diurno' : m.shift === 'night' ? 'Noturno' : m.shift === 'weekend' ? 'Final de Semana' : m.shift === 'star' ? 'Estrela' : 'Livre';
        const status = m.status === 'active' ? 'Ativo' : 'Inativo';
        csvContent += `"${m.number || ''}","${m.name}","${m.phone || ''}",${turno},${status},${m.weekly_payment || 0},"${m.address || ''}"\n`;
      });
      filename = `relatorio-motoboys-${format(today, 'yyyy-MM-dd')}.csv`;
    } else if (type === "rides") {
      csvContent = "Data,Cliente,Motoboy,Valor,Observações\n";
      filteredRides.forEach(r => {
        csvContent += `${formatDateDisplay(r.ride_date)},"${r.clients?.name || 'N/A'}","${r.motoboys?.name || 'N/A'}",${Number(r.value)},"${r.notes || ''}"\n`;
      });
      filename = `relatorio-corridas-${startDate}-${endDate}.csv`;
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
              <tr><th>Número</th><th>Nome</th><th>Telefone</th><th>Turno</th><th>Valor Semanal</th><th>Status</th></tr>
            </thead>
            <tbody>
              ${(motoboys || []).map(m => `
                <tr>
                  <td>${m.number || '-'}</td>
                  <td>${m.name}</td>
                  <td>${m.phone || '-'}</td>
                  <td>${m.shift === 'day' ? 'Diurno' : m.shift === 'night' ? 'Noturno' : m.shift === 'weekend' ? 'Fim de Semana' : m.shift === 'star' ? 'Estrela' : 'Livre'}</td>
                  <td>${formatCurrency(m.weekly_payment || 0)}</td>
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
    } else if (type === "rides") {
      content = `
        <html>
        <head>
          <title>Relatório de Corridas</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f4f4f4; }
          </style>
        </head>
        <body>
          <h1>Relatório de Corridas</h1>
          <p>${periodText}</p>
          <table>
            <thead>
              <tr><th>Data</th><th>Cliente</th><th>Motoboy</th><th>Valor</th><th>Observações</th></tr>
            </thead>
            <tbody>
              ${filteredRides.map(r => `
                <tr>
                  <td>${formatDateDisplay(r.ride_date)}</td>
                  <td>${r.clients?.name || 'N/A'}</td>
                  <td>${r.motoboys?.number ? '#' + r.motoboys.number + ' - ' : ''}${r.motoboys?.name || 'N/A'}</td>
                  <td>${formatCurrency(Number(r.value))}</td>
                  <td>${r.notes || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <p class="total">Total de Corridas: ${totalRidesCount}</p>
          <p class="total">Valor Total: ${formatCurrency(totalRidesValue)}</p>
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
      id: "rides",
      title: "Relatório de Corridas",
      description: "Corridas registradas por cliente e motoboy",
      icon: Users,
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                  {(motoboys || []).filter(m => m.status === 'active').map(m => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.number ? `#${m.number} - ` : ''}{m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Select value={clientFilter} onValueChange={setClientFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {(clients || []).map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
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
            <div className="grid gap-6 md:grid-cols-5">
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-3xl font-bold text-success">{formatCurrency(incomeTotal)}</p>
                <p className="text-sm text-muted-foreground">Total de Entradas</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-3xl font-bold text-destructive">{formatCurrency(expenseTotal)}</p>
                <p className="text-sm text-muted-foreground">Total de Saídas</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-3xl font-bold text-primary">{totalRidesCount}</p>
                <p className="text-sm text-muted-foreground">Total de Corridas</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-3xl font-bold text-foreground">{formatCurrency(totalRidesValue)}</p>
                <p className="text-sm text-muted-foreground">Valor em Corridas</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-3xl font-bold text-foreground">{totalClients}</p>
                <p className="text-sm text-muted-foreground">Clientes</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </MainLayout>
  );
};

export default Reports;
