import { useState, useMemo } from "react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Loader2,
  Plus,
  Tags,
  TrendingDown,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useCategories, useCreateCategory, useDeleteCategory, Category } from "@/hooks/useCategories";
import { useBills, useCreateBill, useUpdateBill, useDeleteBill, useMarkBillAsPaid, Bill } from "@/hooks/useBills";
import { CategoryFormDialog } from "@/components/categories/CategoryFormDialog";
import { ContaEntryFormDialog } from "@/components/contas/ContaEntryFormDialog";
import { ValeDialog } from "@/components/contas/ValeDialog";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import StatCard from "@/components/dashboard/StatCard";
import { format, startOfMonth, endOfMonth, addMonths, addDays, subMonths, isWithinInterval, isBefore, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

const Contas = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [period, setPeriod] = useState<"month" | "week">("month");
  const [offset, setOffset] = useState(0);
  const [activeGroup, setActiveGroup] = useState<"carlos" | "central">("carlos");

  // Category dialogs
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [deleteCategoryDialogOpen, setDeleteCategoryDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  // Entry dialogs
  const [entryFormOpen, setEntryFormOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<Bill | null>(null);
  const [entryCategoryId, setEntryCategoryId] = useState<string | null>(null);
  const [deleteEntryDialogOpen, setDeleteEntryDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);

  // Dismiss bill from upcoming (with confirmation)
  const [dismissBillDialogOpen, setDismissBillDialogOpen] = useState(false);
  const [billToDismiss, setBillToDismiss] = useState<string | null>(null);

  // Vale dialog
  const [valeDialogOpen, setValeDialogOpen] = useState(false);
  const [valeEntry, setValeEntry] = useState<Bill | null>(null);

  const { data: categories, isLoading: loadingCategories } = useCategories();
  const { data: bills, isLoading: loadingBills } = useBills();
  const deleteCategory = useDeleteCategory();
  const deleteBill = useDeleteBill();
  const markAsPaid = useMarkBillAsPaid();
  const updateBill = useUpdateBill();

  const isLoading = loadingCategories || loadingBills;

  // Period calculations (Thursday-based week)
  const getWeekRange = (refDate: Date) => {
    const d = new Date(refDate);
    const day = d.getDay();
    const diffToThursday = day >= 4 ? day - 4 : day + 3;
    const start = new Date(d);
    start.setDate(d.getDate() - diffToThursday);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  };

  const currentRange = useMemo(() => {
    const now = new Date();
    if (period === "week") {
      const base = new Date(now);
      base.setDate(now.getDate() + offset * 7);
      return getWeekRange(base);
    } else {
      const base = addMonths(now, offset);
      return { start: startOfMonth(base), end: endOfMonth(base) };
    }
  }, [period, offset]);

  const periodLabel = useMemo(() => {
    if (period === "week") {
      return `${format(currentRange.start, "dd/MM")} - ${format(currentRange.end, "dd/MM/yyyy")}`;
    }
    return format(currentRange.start, "MMMM yyyy", { locale: ptBR });
  }, [period, currentRange]);

  // Filter categories (expense only) by active group
  const expenseCategories = useMemo(() =>
    (categories || []).filter(c => c.type === "expense"),
    [categories]
  );

  const groupCategories = useMemo(() =>
    expenseCategories.filter(c => (c as any).group_name === activeGroup),
    [expenseCategories, activeGroup]
  );

  const filteredCategories = useMemo(() =>
    groupCategories.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())),
    [groupCategories, searchTerm]
  );

  // Get entries for a category within current period
  const getEntriesForCategory = (categoryId: string) => {
    return (bills || []).filter(b => {
      if (b.category_id !== categoryId) return false;
      if (b.is_fixed) return true;
      const dueDate = new Date(b.due_date + "T12:00:00");
      return isWithinInterval(dueDate, { start: currentRange.start, end: currentRange.end });
    });
  };

  const getCategoryPaidTotal = (categoryId: string) => {
    const entries = getEntriesForCategory(categoryId);
    return entries
      .filter(e => e.status === "paid")
      .reduce((acc, e) => acc + Number(e.value) - Number(e.vale_amount || 0), 0);
  };

  const getCategoryPendingTotal = (categoryId: string) => {
    const entries = getEntriesForCategory(categoryId);
    return entries
      .filter(e => e.status !== "paid")
      .reduce((acc, e) => acc + Number(e.value), 0);
  };

  const totalPaid = useMemo(() =>
    groupCategories.reduce((acc, cat) => acc + getCategoryPaidTotal(cat.id), 0),
    [groupCategories, bills, currentRange]
  );

  const totalPending = useMemo(() =>
    groupCategories.reduce((acc, cat) => acc + getCategoryPendingTotal(cat.id), 0),
    [groupCategories, bills, currentRange]
  );

  // Handlers
  const handleCreateCategory = () => {
    setSelectedCategory(null);
    setCategoryFormOpen(true);
  };

  const handleEditCategory = (cat: Category) => {
    setSelectedCategory(cat);
    setCategoryFormOpen(true);
  };

  const handleDeleteCategoryClick = (id: string) => {
    setCategoryToDelete(id);
    setDeleteCategoryDialogOpen(true);
  };

  const handleDeleteCategoryConfirm = async () => {
    if (categoryToDelete) {
      await deleteCategory.mutateAsync(categoryToDelete);
      setDeleteCategoryDialogOpen(false);
      setCategoryToDelete(null);
    }
  };

  const handleCreateEntry = (categoryId: string) => {
    setSelectedEntry(null);
    setEntryCategoryId(categoryId);
    setEntryFormOpen(true);
  };

  const handleEditEntry = (entry: Bill) => {
    setSelectedEntry(entry);
    setEntryCategoryId(entry.category_id);
    setEntryFormOpen(true);
  };

  const handleDeleteEntryClick = (id: string) => {
    setEntryToDelete(id);
    setDeleteEntryDialogOpen(true);
  };

  const handleDeleteEntryConfirm = async () => {
    if (entryToDelete) {
      await deleteBill.mutateAsync(entryToDelete);
      setDeleteEntryDialogOpen(false);
      setEntryToDelete(null);
    }
  };

  // X button on upcoming: open confirmation then actually delete
  const handleDismissFromUpcoming = (billId: string) => {
    setBillToDismiss(billId);
    setDismissBillDialogOpen(true);
  };

  const handleDismissBillConfirm = async () => {
    if (billToDismiss) {
      await deleteBill.mutateAsync(billToDismiss);
      setDismissBillDialogOpen(false);
      setBillToDismiss(null);
    }
  };

  const handleMarkPaid = async (entry: Bill) => {
    if (entry.vale_amount && entry.vale_amount > 0) {
      toast.warning(
        `⚠️ ${entry.name} possui vale de ${formatCurrency(entry.vale_amount)} este mês! O valor líquido será ${formatCurrency(entry.value - entry.vale_amount)}.`,
        { duration: 6000 }
      );
    }
    await markAsPaid.mutateAsync(entry);
  };

  const handleMarkUnpaid = async (entry: Bill) => {
    await updateBill.mutateAsync({ id: entry.id, status: "pending", paid_at: null });
  };

  const handleOpenVale = (entry: Bill) => {
    setValeEntry(entry);
    setValeDialogOpen(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  const isFuncionariosCategory = (cat: Category) => {
    return cat.name.toLowerCase().includes("funcion");
  };

  const savedCategoryIds = useMemo(
    () => new Set(expenseCategories.map(category => category.id)),
    [expenseCategories]
  );

  const openBillsFromSavedCategories = useMemo(() => {
    if (!bills) return [];
    return bills.filter((bill) => {
      if (bill.status === "paid") return false;
      if (!bill.category_id) return false;
      return savedCategoryIds.has(bill.category_id);
    });
  }, [bills, savedCategoryIds]);

  // Overdue bills (past due, any month) - shown highlighted at top
  const overdueBills = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return openBillsFromSavedCategories
      .filter((bill) => {
        const dueDate = new Date(`${bill.due_date}T12:00:00`);
        return isBefore(dueDate, today) && !isToday(dueDate);
      })
      .sort((a, b) => a.due_date.localeCompare(b.due_date));
  }, [openBillsFromSavedCategories]);

  // Upcoming bills: current month + next 14 days, exclude overdue
  const upcomingBills = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const twoWeeksLater = addDays(today, 14);

    return openBillsFromSavedCategories
      .filter((bill) => {
        const dueDate = new Date(`${bill.due_date}T12:00:00`);
        return dueDate >= today && dueDate <= twoWeeksLater;
      })
      .sort((a, b) => a.due_date.localeCompare(b.due_date))
      .slice(0, 16);
  }, [openBillsFromSavedCategories]);

  return (
    <MainLayout title="Contas" subtitle="Gerencie todas as suas despesas por categoria">
      {/* Overdue Bills - Always on top, highlighted */}
      {overdueBills.length > 0 && (
        <div className="mb-6 rounded-lg border border-destructive/40 bg-destructive/5 p-4">
          <h3 className="text-sm font-semibold text-destructive mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            ⚠️ Contas Atrasadas ({overdueBills.length})
          </h3>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {overdueBills.map(bill => {
              const dueDate = new Date(`${bill.due_date}T12:00:00`);
              return (
                <div key={bill.id} className="flex items-center justify-between rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{bill.name}</p>
                    <p className="text-xs text-destructive font-semibold">
                      Venceu {format(dueDate, "dd/MM/yyyy")}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <p className="font-semibold text-sm text-destructive">{formatCurrency(bill.value)}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      title="Apagar conta"
                      onClick={() => handleDismissFromUpcoming(bill.id)}
                    >
                      <XCircle className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upcoming Bills */}
      {upcomingBills.length > 0 && (
        <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
          <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-400 mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Próximas Contas (14 dias)
          </h3>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {upcomingBills.map(bill => {
              const dueDate = new Date(`${bill.due_date}T12:00:00`);
              const isUrgent = isToday(dueDate) || isBefore(dueDate, addDays(new Date(), 3));
              return (
                <div key={bill.id} className={`flex items-center justify-between rounded-md border p-3 text-sm ${isUrgent ? 'border-destructive/40 bg-destructive/5' : 'border-border bg-card'}`}>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{bill.name}</p>
                    <p className={`text-xs ${isUrgent ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
                      {format(dueDate, "dd/MM/yyyy")}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <p className="font-semibold text-sm">{formatCurrency(bill.value)}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      title="Apagar conta"
                      onClick={() => handleDismissFromUpcoming(bill.id)}
                    >
                      <XCircle className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CARLOS / CENTRAL Tabs */}
      <Tabs value={activeGroup} onValueChange={(v) => setActiveGroup(v as "carlos" | "central")} className="mb-4">
        <TabsList className="w-full">
          <TabsTrigger value="carlos" className="flex-1 text-base font-bold">👤 CARLOS</TabsTrigger>
          <TabsTrigger value="central" className="flex-1 text-base font-bold">🏢 CENTRAL</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Stats */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-3 mb-6">
        <StatCard
          title="Total de Categorias"
          value={String(groupCategories.length)}
          icon={<Tags className="h-6 w-6 text-primary" />}
        />
        <StatCard
          title="Total Pago"
          value={formatCurrency(totalPaid)}
          icon={<CheckCircle2 className="h-6 w-6 text-emerald-500" />}
        />
        <StatCard
          title="Total Pendente"
          value={formatCurrency(totalPending)}
          icon={<XCircle className="h-6 w-6 text-destructive" />}
          variant="destructive"
        />
      </div>

      {/* Period Filter - MÊS first, then SEMANA */}
      <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Tabs value={period} onValueChange={(v) => { setPeriod(v as "month" | "week"); setOffset(0); }}>
            <TabsList>
              <TabsTrigger value="month">Mês</TabsTrigger>
              <TabsTrigger value="week">Semana</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setOffset(o => o - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[160px] text-center capitalize">{periodLabel}</span>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setOffset(o => o + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button onClick={handleCreateCategory}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Categoria
          </Button>
        </div>
      </div>

      {/* Categories Accordion */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {groupCategories.length === 0
            ? `Nenhuma categoria em ${activeGroup === 'carlos' ? 'CARLOS' : 'CENTRAL'}. Crie sua primeira categoria!`
            : "Nenhuma categoria encontrada."}
        </div>
      ) : (
        <Accordion type="multiple" className="space-y-3">
          {filteredCategories.map((cat) => {
            const entries = getEntriesForCategory(cat.id);
            const paidTotal = getCategoryPaidTotal(cat.id);
            const pendingTotal = getCategoryPendingTotal(cat.id);
            const isFuncionarios = isFuncionariosCategory(cat);

            return (
              <AccordionItem key={cat.id} value={cat.id} className="border rounded-lg bg-card px-4">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center justify-between w-full mr-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-destructive/10">
                        <TrendingDown className="h-4 w-4 text-destructive" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold">{cat.name}</p>
                        <p className="text-xs text-muted-foreground">{entries.length} itens</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Pago</p>
                        <p className="text-sm font-semibold text-emerald-600">{formatCurrency(paidTotal)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Pendente</p>
                        <p className="text-sm font-semibold text-destructive">{formatCurrency(pendingTotal)}</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditCategory(cat)}>
                            <Edit className="mr-2 h-4 w-4" /> Editar Categoria
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteCategoryClick(cat.id)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Excluir Categoria
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pb-4">
                    <div className="flex justify-end mb-3">
                      <Button size="sm" onClick={() => handleCreateEntry(cat.id)}>
                        <Plus className="mr-1 h-3 w-3" />
                        Adicionar
                      </Button>
                    </div>
                    {entries.length === 0 ? (
                      <p className="text-center text-sm text-muted-foreground py-4">Nenhum item nesta categoria.</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow className="border-border hover:bg-transparent">
                            <TableHead>Nome</TableHead>
                            <TableHead className="text-center">Vencimento</TableHead>
                            <TableHead className="text-right">Valor</TableHead>
                            {isFuncionarios && <TableHead className="text-right">Vale</TableHead>}
                            <TableHead className="text-center">Status</TableHead>
                            <TableHead className="text-center">Tipo</TableHead>
                            <TableHead className="w-[70px]">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {entries.map((entry) => {
                            const dueDate = new Date(entry.due_date + "T12:00:00");
                            const isOverdue = entry.status !== "paid" && isBefore(dueDate, new Date()) && !isToday(dueDate);
                            return (
                            <TableRow key={entry.id} className="border-border">
                              <TableCell className="font-medium">{entry.name}</TableCell>
                              <TableCell className={`text-center text-sm ${isOverdue ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
                                {format(dueDate, "dd/MM/yyyy")}
                              </TableCell>
                              <TableCell className="text-right font-semibold">
                                {formatCurrency(entry.value)}
                              </TableCell>
                              {isFuncionarios && (
                                <TableCell className="text-right">
                                  {entry.vale_amount && entry.vale_amount > 0 ? (
                                    <span className="text-amber-600 font-semibold flex items-center justify-end gap-1">
                                      <AlertTriangle className="h-3 w-3" />
                                      {formatCurrency(entry.vale_amount)}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </TableCell>
                              )}
                              <TableCell className="text-center">
                                {entry.status === "paid" ? (
                                  <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Pago</Badge>
                                ) : (
                                  <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">Não Pago</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                {entry.is_fixed ? (
                                  <Badge variant="outline">Fixo</Badge>
                                ) : (
                                  <Badge variant="secondary">Avulso</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    {entry.status !== "paid" ? (
                                      <DropdownMenuItem onClick={() => handleMarkPaid(entry)}>
                                        <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" /> Marcar Pago
                                      </DropdownMenuItem>
                                    ) : (
                                      <DropdownMenuItem onClick={() => handleMarkUnpaid(entry)}>
                                        <XCircle className="mr-2 h-4 w-4 text-destructive" /> Marcar Não Pago
                                      </DropdownMenuItem>
                                    )}
                                    {isFuncionarios && (
                                      <DropdownMenuItem onClick={() => handleOpenVale(entry)}>
                                        <AlertTriangle className="mr-2 h-4 w-4 text-amber-500" /> Registrar Vale
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem onClick={() => handleEditEntry(entry)}>
                                      <Edit className="mr-2 h-4 w-4" /> Editar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteEntryClick(entry.id)}>
                                      <Trash2 className="mr-2 h-4 w-4" /> Excluir
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}

      {/* Dialogs */}
      <CategoryFormDialog
        open={categoryFormOpen}
        onOpenChange={setCategoryFormOpen}
        category={selectedCategory}
      />

      <ContaEntryFormDialog
        open={entryFormOpen}
        onOpenChange={setEntryFormOpen}
        entry={selectedEntry}
        categoryId={entryCategoryId}
      />

      <ValeDialog
        open={valeDialogOpen}
        onOpenChange={setValeDialogOpen}
        entry={valeEntry}
      />

      <DeleteConfirmDialog
        open={deleteCategoryDialogOpen}
        onOpenChange={setDeleteCategoryDialogOpen}
        onConfirm={handleDeleteCategoryConfirm}
        title="Excluir Categoria"
        description="Tem certeza? Os itens dentro desta categoria não serão excluídos."
        isLoading={deleteCategory.isPending}
      />

      <DeleteConfirmDialog
        open={deleteEntryDialogOpen}
        onOpenChange={setDeleteEntryDialogOpen}
        onConfirm={handleDeleteEntryConfirm}
        title="Excluir Item"
        description="Tem certeza que deseja excluir este item?"
        isLoading={deleteBill.isPending}
      />

      <DeleteConfirmDialog
        open={dismissBillDialogOpen}
        onOpenChange={setDismissBillDialogOpen}
        onConfirm={handleDismissBillConfirm}
        title="Apagar Conta"
        description="Tem certeza que deseja apagar esta conta? Essa ação não pode ser desfeita."
        isLoading={deleteBill.isPending}
      />
    </MainLayout>
  );
};

export default Contas;
