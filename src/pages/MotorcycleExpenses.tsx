import MainLayout from "@/components/layout/MainLayout";
import { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Loader2, Wrench, Bike } from "lucide-react";
import { useAllMotorcycleExpenses, useDeleteMotorcycleExpense, ExpenseCategory, categoryLabels } from "@/hooks/useMotorcycleExpenses";
import { ExpenseFormDialog } from "@/components/expenses/ExpenseFormDialog";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";

const categories: ExpenseCategory[] = ['pneu', 'relacao', 'oleo', 'outros'];

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const formatDate = (d: string) => {
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
};

function PlateExpenseTable({ plate, expenses }: { plate: string; expenses: any[] }) {
  const deleteExpense = useDeleteMotorcycleExpense();
  const [formOpen, setFormOpen] = useState(false);
  const [formCategory, setFormCategory] = useState<ExpenseCategory>('pneu');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const byCategory = useMemo(() => {
    const grouped: Record<ExpenseCategory, typeof expenses> = { pneu: [], relacao: [], oleo: [], outros: [] };
    expenses.forEach(e => {
      if (grouped[e.category as ExpenseCategory]) {
        grouped[e.category as ExpenseCategory].push(e);
      }
    });
    return grouped;
  }, [expenses]);

  const total = expenses.reduce((sum, e) => sum + Number(e.value), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Card className="flex-1 mr-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Gasto - {plate}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">{formatCurrency(total)}</p>
            <p className="text-xs text-muted-foreground">{expenses.length} registro(s)</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pneu" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          {categories.map((cat) => (
            <TabsTrigger key={cat} value={cat}>
              {categoryLabels[cat]} ({byCategory[cat].length})
            </TabsTrigger>
          ))}
        </TabsList>
        {categories.map((cat) => (
          <TabsContent key={cat} value={cat}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  Total: <span className="font-semibold text-destructive">
                    {formatCurrency(byCategory[cat].reduce((s, e) => s + Number(e.value), 0))}
                  </span>
                </p>
              </div>
              <Button onClick={() => { setFormCategory(cat); setFormOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" /> Adicionar
              </Button>
            </div>

            {byCategory[cat].length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Wrench className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p>Nenhuma despesa de {categoryLabels[cat].toLowerCase()}</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Km</TableHead>
                      <TableHead className="hidden sm:table-cell">Descrição</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {byCategory[cat].map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell>{formatDate(expense.service_date)}</TableCell>
                        <TableCell className="font-medium text-destructive">
                          {formatCurrency(Number(expense.value))}
                        </TableCell>
                        <TableCell>{expense.mileage ? `${expense.mileage} km` : "-"}</TableCell>
                        <TableCell className="hidden sm:table-cell max-w-[200px] truncate">
                          {expense.description || "-"}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => setDeleteId(expense.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <ExpenseFormDialog open={formOpen} onOpenChange={setFormOpen} category={formCategory} plate={plate} />
      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) {
            deleteExpense.mutate(deleteId);
            setDeleteId(null);
          }
        }}
        title="Excluir Despesa"
        description="Tem certeza que deseja excluir esta despesa? Esta ação não pode ser desfeita."
      />
    </div>
  );
}

const MotorcycleExpenses = () => {
  const { data: allExpenses = [], isLoading } = useAllMotorcycleExpenses();
  const [formOpen, setFormOpen] = useState(false);

  // Group by plate
  const plates = useMemo(() => {
    const map = new Map<string, typeof allExpenses>();
    allExpenses.forEach(e => {
      const plate = e.plate || 'Sem Placa';
      if (!map.has(plate)) map.set(plate, []);
      map.get(plate)!.push(e);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [allExpenses]);

  if (isLoading) {
    return (
      <MainLayout title="Despesa Moto" subtitle="Controle de despesas com manutenção das motos">
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Despesa Moto" subtitle="Controle de despesas com manutenção das motos">
      <div className="space-y-6">
        {plates.length === 0 ? (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setFormOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Nova Despesa
              </Button>
            </div>
            <div className="text-center py-12 text-muted-foreground">
              <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma despesa registrada</p>
            </div>
            <ExpenseFormDialog open={formOpen} onOpenChange={setFormOpen} category="pneu" />
          </div>
        ) : (
          <>
            <Tabs defaultValue={plates[0]?.[0]} className="w-full">
              <TabsList className={`grid w-full grid-cols-${Math.min(plates.length, 6)}`}>
                {plates.map(([plate]) => (
                  <TabsTrigger key={plate} value={plate} className="flex items-center gap-1">
                    <Bike className="h-4 w-4" />
                    {plate}
                  </TabsTrigger>
                ))}
              </TabsList>
              {plates.map(([plate, expenses]) => (
                <TabsContent key={plate} value={plate}>
                  <PlateExpenseTable plate={plate} expenses={expenses} />
                </TabsContent>
              ))}
            </Tabs>
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default MotorcycleExpenses;
