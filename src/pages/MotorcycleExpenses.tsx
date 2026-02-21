import MainLayout from "@/components/layout/MainLayout";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Loader2, Wrench } from "lucide-react";
import { useMotorcycleExpenses, useDeleteMotorcycleExpense, ExpenseCategory, categoryLabels } from "@/hooks/useMotorcycleExpenses";
import { ExpenseFormDialog } from "@/components/expenses/ExpenseFormDialog";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";

const categories: ExpenseCategory[] = ['pneu', 'relacao', 'oleo', 'outros'];

function ExpenseTable({ category }: { category: ExpenseCategory }) {
  const { data: expenses, isLoading } = useMotorcycleExpenses(category);
  const deleteExpense = useDeleteMotorcycleExpense();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const total = expenses?.reduce((sum, e) => sum + Number(e.value), 0) || 0;

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const formatDate = (d: string) => {
    const [y, m, day] = d.split("-");
    return `${day}/${m}/${y}`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <Card className="flex-1 mr-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total {categoryLabels[category]}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">{formatCurrency(total)}</p>
            <p className="text-xs text-muted-foreground">{expenses?.length || 0} registro(s)</p>
          </CardContent>
        </Card>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Adicionar
        </Button>
      </div>

      {!expenses?.length ? (
        <div className="text-center py-12 text-muted-foreground">
          <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Nenhuma despesa de {categoryLabels[category].toLowerCase()} registrada</p>
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
              {expenses.map((expense) => (
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

      <ExpenseFormDialog open={formOpen} onOpenChange={setFormOpen} category={category} />
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
    </>
  );
}

const MotorcycleExpenses = () => {
  return (
    <MainLayout title="Despesa Moto" subtitle="Controle de despesas com manutenção das motos">
      <div className="space-y-6">
        <Tabs defaultValue="pneu" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            {categories.map((cat) => (
              <TabsTrigger key={cat} value={cat}>
                {categoryLabels[cat]}
              </TabsTrigger>
            ))}
          </TabsList>
          {categories.map((cat) => (
            <TabsContent key={cat} value={cat}>
              <ExpenseTable category={cat} />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default MotorcycleExpenses;
