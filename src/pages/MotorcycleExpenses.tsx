import MainLayout from "@/components/layout/MainLayout";
import { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Plus, Trash2, Loader2, Wrench, Bike } from "lucide-react";
import { useMotorcycles, useCreateMotorcycle, useDeleteMotorcycle } from "@/hooks/useMotorcycles";
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

function MotorcycleExpensePanel({ plate, expenses }: { plate: string; expenses: any[] }) {
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
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Gasto</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-destructive">{formatCurrency(total)}</p>
          <p className="text-xs text-muted-foreground">{expenses.length} registro(s)</p>
        </CardContent>
      </Card>

      <Tabs defaultValue="pneu" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          {categories.map(cat => (
            <TabsTrigger key={cat} value={cat}>
              {categoryLabels[cat]} ({byCategory[cat].length})
            </TabsTrigger>
          ))}
        </TabsList>
        {categories.map(cat => (
          <TabsContent key={cat} value={cat}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                Total: <span className="font-semibold text-destructive">
                  {formatCurrency(byCategory[cat].reduce((s, e) => s + Number(e.value), 0))}
                </span>
              </p>
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
                    {byCategory[cat].map(expense => (
                      <TableRow key={expense.id}>
                        <TableCell>{formatDate(expense.service_date)}</TableCell>
                        <TableCell className="font-medium text-destructive">{formatCurrency(Number(expense.value))}</TableCell>
                        <TableCell>{expense.mileage ? `${expense.mileage} km` : "-"}</TableCell>
                        <TableCell className="hidden sm:table-cell max-w-[200px] truncate">{expense.description || "-"}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(expense.id)}>
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
        onConfirm={() => { if (deleteId) { deleteExpense.mutate(deleteId); setDeleteId(null); } }}
        title="Excluir Despesa"
        description="Tem certeza que deseja excluir esta despesa?"
      />
    </div>
  );
}

function AddMotorcycleDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const createMotorcycle = useCreateMotorcycle();
  const [plate, setPlate] = useState("");
  const [name, setName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plate.trim()) return;
    await createMotorcycle.mutateAsync({ plate: plate.trim(), name: name.trim() || undefined });
    setPlate("");
    setName("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Moto</DialogTitle>
          <DialogDescription>Cadastre uma moto para registrar despesas</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="moto-plate">Placa *</Label>
            <Input id="moto-plate" placeholder="ABC-1234" value={plate} onChange={e => setPlate(e.target.value)} required maxLength={10} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="moto-name">Apelido / Modelo</Label>
            <Input id="moto-name" placeholder="Ex: CG 160" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={createMotorcycle.isPending}>
              {createMotorcycle.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Cadastrar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const MotorcycleExpenses = () => {
  const { data: motorcycles = [], isLoading: loadingMotos } = useMotorcycles();
  const { data: allExpenses = [], isLoading: loadingExpenses } = useAllMotorcycleExpenses();
  const deleteMotorcycle = useDeleteMotorcycle();
  const [addMotoOpen, setAddMotoOpen] = useState(false);
  const [deleteMotorcycleId, setDeleteMotorcycleId] = useState<string | null>(null);

  const isLoading = loadingMotos || loadingExpenses;

  const expensesByPlate = useMemo(() => {
    const map = new Map<string, typeof allExpenses>();
    allExpenses.forEach(e => {
      const plate = e.plate || '';
      if (!map.has(plate)) map.set(plate, []);
      map.get(plate)!.push(e);
    });
    return map;
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
        <div className="flex justify-end">
          <Button onClick={() => setAddMotoOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Nova Moto
          </Button>
        </div>

        {motorcycles.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Bike className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma moto cadastrada. Cadastre sua primeira moto!</p>
          </div>
        ) : (
          <Tabs defaultValue={motorcycles[0]?.id} className="w-full">
            <TabsList className="flex flex-wrap h-auto gap-1">
              {motorcycles.map(moto => (
                <TabsTrigger key={moto.id} value={moto.id} className="flex items-center gap-1">
                  <Bike className="h-4 w-4" />
                  {moto.plate}
                  {moto.name && <span className="text-xs text-muted-foreground ml-1">({moto.name})</span>}
                </TabsTrigger>
              ))}
            </TabsList>
            {motorcycles.map(moto => {
              const motoExpenses = expensesByPlate.get(moto.plate) || [];
              return (
                <TabsContent key={moto.id} value={moto.id}>
                  <div className="flex justify-end mb-2">
                    <Button variant="outline" size="sm" className="text-destructive" onClick={() => setDeleteMotorcycleId(moto.id)}>
                      <Trash2 className="h-4 w-4 mr-1" /> Remover Moto
                    </Button>
                  </div>
                  <MotorcycleExpensePanel plate={moto.plate} expenses={motoExpenses} />
                </TabsContent>
              );
            })}
          </Tabs>
        )}
      </div>

      <AddMotorcycleDialog open={addMotoOpen} onOpenChange={setAddMotoOpen} />
      <DeleteConfirmDialog
        open={!!deleteMotorcycleId}
        onOpenChange={() => setDeleteMotorcycleId(null)}
        onConfirm={() => {
          if (deleteMotorcycleId) {
            deleteMotorcycle.mutate(deleteMotorcycleId);
            setDeleteMotorcycleId(null);
          }
        }}
        title="Remover Moto"
        description="Tem certeza? As despesas registradas para esta placa não serão excluídas."
      />
    </MainLayout>
  );
};

export default MotorcycleExpenses;
