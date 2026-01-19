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
import { FileText, Download, Package, TrendingUp, Users, Bike, Calendar } from "lucide-react";

const reports = [
  {
    id: "deliveries",
    title: "Relatório de Entregas",
    description: "Entregas realizadas por período, motoboy e cliente",
    icon: Package,
  },
  {
    id: "financial",
    title: "Relatório Financeiro",
    description: "Resumo financeiro com entradas, saídas e balanço",
    icon: TrendingUp,
  },
  {
    id: "clients",
    title: "Relatório de Clientes",
    description: "Análise de clientes por volume de pedidos",
    icon: Users,
  },
  {
    id: "motorcyclists",
    title: "Relatório de Motoboys",
    description: "Performance e entregas por motoboy",
    icon: Bike,
  },
];

const Reports = () => {
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
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Data Inicial</Label>
              <Input type="date" defaultValue="2025-01-01" />
            </div>
            <div className="space-y-2">
              <Label>Data Final</Label>
              <Input type="date" defaultValue="2025-01-19" />
            </div>
            <div className="space-y-2">
              <Label>Motoboy</Label>
              <Select defaultValue="all">
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="1">João Silva</SelectItem>
                  <SelectItem value="2">Carlos Santos</SelectItem>
                  <SelectItem value="3">Pedro Lima</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Select defaultValue="all">
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="1">Restaurante Sabor</SelectItem>
                  <SelectItem value="2">Farmácia Central</SelectItem>
                  <SelectItem value="3">Loja Tech</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Types */}
      <div className="grid gap-6 md:grid-cols-2">
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
                <Button className="flex-1">
                  <FileText className="mr-2 h-4 w-4" />
                  Gerar PDF
                </Button>
                <Button variant="outline" className="flex-1">
                  <Download className="mr-2 h-4 w-4" />
                  Exportar CSV
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Stats Preview */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Prévia do Período</CardTitle>
          <CardDescription>01/01/2025 - 19/01/2025</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-4">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-3xl font-bold text-primary">847</p>
              <p className="text-sm text-muted-foreground">Total de Entregas</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-3xl font-bold text-success">R$ 79.200</p>
              <p className="text-sm text-muted-foreground">Total de Entradas</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-3xl font-bold text-destructive">R$ 52.800</p>
              <p className="text-sm text-muted-foreground">Total de Saídas</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-3xl font-bold text-foreground">18</p>
              <p className="text-sm text-muted-foreground">Motoboys Ativos</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </MainLayout>
  );
};

export default Reports;
