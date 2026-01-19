import { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BadgeStatus } from "@/components/ui/badge-status";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, MoreHorizontal, Pencil, Trash2, TrendingUp, TrendingDown } from "lucide-react";

interface Category {
  id: string;
  name: string;
  type: "income" | "expense";
  transactionsCount: number;
  totalAmount: string;
}

const mockCategories: Category[] = [
  { id: "1", name: "Receita de Entregas", type: "income", transactionsCount: 245, totalAmount: "R$ 45.600,00" },
  { id: "2", name: "Contratos Mensais", type: "income", transactionsCount: 12, totalAmount: "R$ 28.400,00" },
  { id: "3", name: "Serviços Extras", type: "income", transactionsCount: 34, totalAmount: "R$ 5.200,00" },
  { id: "4", name: "Salários", type: "expense", transactionsCount: 48, totalAmount: "R$ 32.000,00" },
  { id: "5", name: "Combustível", type: "expense", transactionsCount: 156, totalAmount: "R$ 12.800,00" },
  { id: "6", name: "Manutenção", type: "expense", transactionsCount: 23, totalAmount: "R$ 4.500,00" },
  { id: "7", name: "Aluguel", type: "expense", transactionsCount: 12, totalAmount: "R$ 33.600,00" },
  { id: "8", name: "Telecomunicações", type: "expense", transactionsCount: 12, totalAmount: "R$ 4.560,00" },
];

const Categories = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "income" | "expense">("all");

  const filteredCategories = mockCategories.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = activeTab === "all" || c.type === activeTab;
    return matchesSearch && matchesType;
  });

  const incomeCategories = mockCategories.filter(c => c.type === "income");
  const expenseCategories = mockCategories.filter(c => c.type === "expense");

  return (
    <MainLayout title="Categorias" subtitle="Organize suas entradas e saídas">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all">Todas ({mockCategories.length})</TabsTrigger>
            <TabsTrigger value="income" className="text-success data-[state=active]:text-success">
              <TrendingUp className="mr-2 h-4 w-4" />
              Entradas ({incomeCategories.length})
            </TabsTrigger>
            <TabsTrigger value="expense" className="text-destructive data-[state=active]:text-destructive">
              <TrendingDown className="mr-2 h-4 w-4" />
              Saídas ({expenseCategories.length})
            </TabsTrigger>
          </TabsList>

          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nova Categoria
          </Button>
        </div>

        {/* Filters */}
        <div className="filter-bar">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <TabsContent value={activeTab} className="mt-0">
          {/* Table */}
          <div className="data-table">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead>Categoria</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Transações</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="w-[70px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.map((category) => (
                  <TableRow key={category.id} className="border-border">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                          category.type === "income" ? "bg-success/10" : "bg-destructive/10"
                        }`}>
                          {category.type === "income" ? (
                            <TrendingUp className="h-5 w-5 text-success" />
                          ) : (
                            <TrendingDown className="h-5 w-5 text-destructive" />
                          )}
                        </div>
                        {category.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <BadgeStatus status={category.type === "income" ? "success" : "error"}>
                        {category.type === "income" ? "Entrada" : "Saída"}
                      </BadgeStatus>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {category.transactionsCount}
                    </TableCell>
                    <TableCell className={`text-right font-semibold ${
                      category.type === "income" ? "text-success" : "text-destructive"
                    }`}>
                      {category.totalAmount}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Summary */}
      <div className="mt-4 text-sm text-muted-foreground">
        Mostrando {filteredCategories.length} de {mockCategories.length} categorias
      </div>
    </MainLayout>
  );
};

export default Categories;
