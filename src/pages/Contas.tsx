import { useState, useMemo } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Loader2,
  Plus,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Clock,
  Fuel,
  Wallet,
  CreditCard,
  Zap,
  ShoppingCart,
  Home,
  Car,
  Heart,
  Dumbbell,
  User,
  Building2,
  Megaphone,
  Smartphone,
  Package,
  HandCoins,
  Droplets,
  Pill,
  Globe,
  Briefcase,
  CalendarIcon,
  Filter,
} from "lucide-react";
import { useCategories, useDeleteCategory, Category } from "@/hooks/useCategories";
import { useBills, useUpdateBill, useDeleteBill, useMarkBillAsPaid, Bill } from "@/hooks/useBills";
import { CategoryFormDialog } from "@/components/categories/CategoryFormDialog";
import { ContaEntryFormDialog } from "@/components/contas/ContaEntryFormDialog";
import { ValeDialog } from "@/components/contas/ValeDialog";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { format, startOfMonth, endOfMonth, addMonths, addDays, isWithinInterval, isBefore, isToday, differenceInDays, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Icon mapping for categories
const getCategoryIcon = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes("gasolina") || lower.includes("combustível")) return Fuel;
  if (lower.includes("aluguel")) return Home;
  if (lower.includes("energia")) return Zap;
  if (lower.includes("água")) return Droplets;
  if (lower.includes("mercado")) return ShoppingCart;
  if (lower.includes("cartão")) return CreditCard;
  if (lower.includes("carro")) return Car;
  if (lower.includes("farmácia") || lower.includes("farmacia")) return Pill;
  if (lower.includes("esporte")) return Dumbbell;
  if (lower.includes("rolê") || lower.includes("role")) return Heart;
  if (lower.includes("agiota")) return HandCoins;
  if (lower.includes("contabilidade")) return Briefcase;
  if (lower.includes("marketing")) return Megaphone;
  if (lower.includes("internet") || lower.includes("celular")) return Smartphone;
  if (lower.includes("itens") || lower.includes("central")) return Package;
  if (lower.includes("doaç")) return Heart;
  if (lower.includes("auxílio") || lower.includes("acidente")) return Globe;
  if (lower.includes("clic") || lower.includes("disk")) return Building2;
  if (lower.includes("tobias") || lower.includes("funcion")) return User;
  return Wallet;
};

const Contas = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [period, setPeriod] = useState<"month" | "week" | "custom">("month");
  const [offset, setOffset] = useState(0);
  const [activeGroup, setActiveGroup] = useState<"carlos" | "central">("carlos");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Custom date range
  const [customStart, setCustomStart] = useState<Date | undefined>(undefined);
  const [customEnd, setCustomEnd] = useState<Date | undefined>(undefined);
  const [showCustomFilter, setShowCustomFilter] = useState(false);

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

  // Dismiss bill
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

  // Period calculations
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
    if (period === "custom" && customStart && customEnd) {
      const s = new Date(customStart);
      s.setHours(0, 0, 0, 0);
      const e = new Date(customEnd);
      e.setHours(23, 59, 59, 999);
      return { start: s, end: e };
    }
    const now = new Date();
    if (period === "week") {
      const base = new Date(now);
      base.setDate(now.getDate() + offset * 7);
      return getWeekRange(base);
    } else {
      const base = addMonths(now, offset);
      return { start: startOfMonth(base), end: endOfMonth(base) };
    }
  }, [period, offset, customStart, customEnd]);

  const periodLabel = useMemo(() => {
    if (period === "custom" && customStart && customEnd) {
      return `${format(customStart, "dd/MM")} - ${format(customEnd, "dd/MM")}`;
    }
    if (period === "week") {
      return `${format(currentRange.start, "dd")} - ${format(currentRange.end, "dd MMM", { locale: ptBR })}`;
    }
    return format(currentRange.start, "MMMM yyyy", { locale: ptBR });
  }, [period, currentRange, customStart, customEnd]);

  // Filter categories
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

  // Helper: check if a fixed bill was paid in a previous month and should reset to pending
  const isFixedBillPendingThisMonth = (bill: Bill): boolean => {
    if (!bill.is_fixed || bill.status !== "paid" || !bill.paid_at) return false;
    const paidDate = new Date(bill.paid_at);
    const now = new Date();
    // If paid in a previous month, treat as pending
    return paidDate.getMonth() !== now.getMonth() || paidDate.getFullYear() !== now.getFullYear();
  };

  // Get effective status: fixed bills paid in previous months show as "pending"
  const getEffectiveStatus = (bill: Bill): string => {
    if (isFixedBillPendingThisMonth(bill)) return "pending";
    return bill.status;
  };

  // Entries for category - fixed bills always show in current period
  const getEntriesForCategory = (categoryId: string) => {
    return (bills || []).filter(b => {
      if (b.category_id !== categoryId) return false;
      // Fixed bills always appear in the current view
      if (b.is_fixed) return true;
      const dueDate = new Date(b.due_date + "T12:00:00");
      return isWithinInterval(dueDate, { start: currentRange.start, end: currentRange.end });
    });
  };

  const getCategoryPaidTotal = (categoryId: string) => {
    return getEntriesForCategory(categoryId)
      .filter(e => getEffectiveStatus(e) === "paid")
      .reduce((acc, e) => acc + Number(e.value) - Number(e.vale_amount || 0), 0);
  };

  const getCategoryPendingTotal = (categoryId: string) => {
    return getEntriesForCategory(categoryId)
      .filter(e => getEffectiveStatus(e) !== "paid")
      .reduce((acc, e) => acc + Number(e.value), 0);
  };

  const getCategoryTotal = (categoryId: string) => {
    return getEntriesForCategory(categoryId)
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

  const savedCategoryIds = useMemo(
    () => new Set(expenseCategories.map(c => c.id)),
    [expenseCategories]
  );

  const openBillsFromSavedCategories = useMemo(() => {
    if (!bills) return [];
    return bills.filter(b => getEffectiveStatus(b) !== "paid" && b.category_id && savedCategoryIds.has(b.category_id));
  }, [bills, savedCategoryIds]);

  // Overdue bills - last 30 days, filtered by active group (includes fixed bills with stale paid status)
  const overdueBills = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysAgo = subDays(today, 30);
    const groupCatIds = new Set(groupCategories.map(c => c.id));
    return (bills || [])
      .filter(b => {
        const effectiveStatus = getEffectiveStatus(b);
        if (effectiveStatus === "paid") return false;
        if (!b.category_id || !groupCatIds.has(b.category_id)) return false;
        const dueDate = new Date(`${b.due_date}T12:00:00`);
        return isBefore(dueDate, today) && !isToday(dueDate) && dueDate >= thirtyDaysAgo;
      })
      .sort((a, b) => a.due_date.localeCompare(b.due_date));
  }, [bills, groupCategories]);

  // Get urgency level for progressive styling
  const getUrgencyLevel = (daysLate: number): { bg: string; text: string; border: string } => {
    if (daysLate >= 15) return { bg: "bg-destructive/15", text: "text-destructive", border: "border-destructive/40" };
    if (daysLate >= 7) return { bg: "bg-destructive/10", text: "text-destructive", border: "border-destructive/25" };
    return { bg: "bg-amber-500/10", text: "text-amber-600", border: "border-amber-500/20" };
  };

  // Removed "Próximas Contas" - only overdue bills shown now

  // Toggle category expansion
  const toggleCategory = (id: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Handlers
  const handleCreateCategory = () => { setSelectedCategory(null); setCategoryFormOpen(true); };
  const handleEditCategory = (cat: Category) => { setSelectedCategory(cat); setCategoryFormOpen(true); };
  const handleDeleteCategoryClick = (id: string) => { setCategoryToDelete(id); setDeleteCategoryDialogOpen(true); };
  const handleDeleteCategoryConfirm = async () => {
    if (categoryToDelete) { await deleteCategory.mutateAsync(categoryToDelete); setDeleteCategoryDialogOpen(false); setCategoryToDelete(null); }
  };
  const handleCreateEntry = (categoryId: string) => { setSelectedEntry(null); setEntryCategoryId(categoryId); setEntryFormOpen(true); };
  const handleEditEntry = (entry: Bill) => { setSelectedEntry(entry); setEntryCategoryId(entry.category_id); setEntryFormOpen(true); };
  const handleDeleteEntryClick = (id: string) => { setEntryToDelete(id); setDeleteEntryDialogOpen(true); };
  const handleDeleteEntryConfirm = async () => {
    if (entryToDelete) { await deleteBill.mutateAsync(entryToDelete); setDeleteEntryDialogOpen(false); setEntryToDelete(null); }
  };
  const handleDismissFromUpcoming = (billId: string) => { setBillToDismiss(billId); setDismissBillDialogOpen(true); };
  const handleDismissBillConfirm = async () => {
    if (billToDismiss) { await deleteBill.mutateAsync(billToDismiss); setDismissBillDialogOpen(false); setBillToDismiss(null); }
  };
  const handleMarkPaid = async (entry: Bill) => {
    if (entry.vale_amount && entry.vale_amount > 0) {
      toast.warning(`⚠️ ${entry.name} possui vale de ${formatCurrency(entry.vale_amount)}. Valor líquido: ${formatCurrency(entry.value - entry.vale_amount)}.`, { duration: 6000 });
    }
    await markAsPaid.mutateAsync(entry);
  };
  const handleMarkUnpaid = async (entry: Bill) => { await updateBill.mutateAsync({ id: entry.id, status: "pending", paid_at: null }); };
  const handleOpenVale = (entry: Bill) => { setValeEntry(entry); setValeDialogOpen(true); };

  const handleApplyCustomRange = () => {
    if (customStart && customEnd) {
      setPeriod("custom");
      setShowCustomFilter(false);
    }
  };

  const handleClearCustomRange = () => {
    setPeriod("month");
    setCustomStart(undefined);
    setCustomEnd(undefined);
    setOffset(0);
    setShowCustomFilter(false);
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const isFuncionariosCategory = (cat: Category) => cat.name.toLowerCase().includes("funcion");

  return (
    <MainLayout title="Contas" subtitle="">
      <div className="max-w-2xl mx-auto pb-24 space-y-5">

        {/* Financial Summary Header */}
        <div className="rounded-xl bg-card border border-border p-5">
          <div className="text-center mb-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Saldo do período</p>
            <p className={cn("text-3xl font-bold tracking-tight", totalPending > 0 ? "text-destructive" : "text-foreground")}>
              {formatCurrency(totalPaid + totalPending)}
            </p>
          </div>
          <div className="flex justify-center gap-8">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-0.5">Pago</p>
              <p className="text-lg font-semibold text-emerald-500">{formatCurrency(totalPaid)}</p>
            </div>
            <div className="w-px bg-border" />
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-0.5">Pendente</p>
              <p className="text-lg font-semibold text-destructive">{formatCurrency(totalPending)}</p>
            </div>
          </div>
        </div>

        {/* Group Tabs */}
        <Tabs value={activeGroup} onValueChange={(v) => setActiveGroup(v as "carlos" | "central")}>
          <TabsList className="w-full h-10">
            <TabsTrigger value="carlos" className="flex-1 font-semibold text-sm data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground">Carlos</TabsTrigger>
            <TabsTrigger value="central" className="flex-1 font-semibold text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Central</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Period Filter */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Tabs value={period === "custom" ? "custom" : period} onValueChange={(v) => {
                if (v === "custom") {
                  setShowCustomFilter(true);
                } else {
                  setPeriod(v as "month" | "week");
                  setOffset(0);
                  setCustomStart(undefined);
                  setCustomEnd(undefined);
                }
              }}>
                <TabsList className="h-8">
                  <TabsTrigger value="month" className="text-xs px-3 h-7">Mês</TabsTrigger>
                  <TabsTrigger value="week" className="text-xs px-3 h-7">Semana</TabsTrigger>
                  <TabsTrigger value="custom" className="text-xs px-3 h-7">
                    <Filter className="h-3 w-3 mr-1" />
                    Período
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            {period !== "custom" && (
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOffset(o => o - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium min-w-[120px] text-center capitalize">{periodLabel}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOffset(o => o + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
            {period === "custom" && (
              <span className="text-sm font-medium text-primary">{periodLabel}</span>
            )}
          </div>

          {/* Custom Date Range Picker */}
          {(showCustomFilter || period === "custom") && (
            <div className="rounded-lg border border-border bg-card p-3 space-y-3">
              <div className="flex gap-2">
                <div className="flex-1 space-y-1">
                  <p className="text-[11px] text-muted-foreground font-medium">Data início</p>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full justify-start text-left h-8 text-xs">
                        <CalendarIcon className="h-3 w-3 mr-1.5" />
                        {customStart ? format(customStart, "dd/MM/yyyy") : "Selecionar"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={customStart}
                        onSelect={setCustomStart}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-[11px] text-muted-foreground font-medium">Data fim</p>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full justify-start text-left h-8 text-xs">
                        <CalendarIcon className="h-3 w-3 mr-1.5" />
                        {customEnd ? format(customEnd, "dd/MM/yyyy") : "Selecionar"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={customEnd}
                        onSelect={setCustomEnd}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="flex-1 h-8 text-xs" onClick={handleApplyCustomRange} disabled={!customStart || !customEnd}>
                  Aplicar Filtro
                </Button>
                {period === "custom" && (
                  <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleClearCustomRange}>
                    Limpar
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar categoria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 bg-card"
          />
        </div>

        {/* Overdue Bills - last 30 days only */}
        {overdueBills.length > 0 && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <h3 className="text-sm font-semibold text-destructive">Contas Vencidas</h3>
              <Badge variant="destructive" className="text-[10px] h-5 px-1.5">{overdueBills.length}</Badge>
            </div>
            <div className="space-y-2">
              {overdueBills.map(bill => {
                const dueDate = new Date(`${bill.due_date}T12:00:00`);
                const daysLate = differenceInDays(new Date(), dueDate);
                const urgency = getUrgencyLevel(daysLate);
                return (
                  <div key={bill.id} className={cn(
                    "flex items-center justify-between rounded-lg p-3 border",
                    urgency.bg, urgency.border
                  )}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{bill.name}</p>
                      <p className={cn("text-xs font-medium", urgency.text)}>
                        {daysLate} {daysLate === 1 ? 'dia' : 'dias'} atrasado
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <p className={cn("text-sm font-bold", urgency.text)}>{formatCurrency(bill.value)}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                        onClick={() => handleMarkPaid(bill)}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                        Pagar
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
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

        {/* Upcoming Bills section removed */}

        {/* Category List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">
            {groupCategories.length === 0
              ? `Nenhuma categoria em ${activeGroup === 'carlos' ? 'Carlos' : 'Central'}.`
              : "Nenhuma categoria encontrada."}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredCategories.map((cat) => {
              const entries = getEntriesForCategory(cat.id);
              const paidTotal = getCategoryPaidTotal(cat.id);
              const pendingTotal = getCategoryPendingTotal(cat.id);
              const total = getCategoryTotal(cat.id);
              const paidPercent = total > 0 ? Math.round((paidTotal / total) * 100) : 0;
              const isOpen = expandedCategories.has(cat.id);
              const isFuncionarios = isFuncionariosCategory(cat);
              const IconComponent = getCategoryIcon(cat.name);

              return (
                <Collapsible key={cat.id} open={isOpen} onOpenChange={() => toggleCategory(cat.id)}>
                  <div className="rounded-xl border border-border bg-card overflow-hidden transition-shadow hover:shadow-sm">
                    <CollapsibleTrigger className="w-full p-4 flex items-center gap-3 text-left">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                        <IconComponent className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-sm font-semibold truncate">{cat.name}</p>
                          <div className="flex items-center gap-2 ml-2">
                            {pendingTotal > 0 && (
                              <span className="text-sm font-bold text-destructive">{formatCurrency(pendingTotal)}</span>
                            )}
                            <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", isOpen && "rotate-180")} />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={paidPercent} className="h-1.5 flex-1" />
                          <span className="text-[10px] text-muted-foreground font-medium w-8 text-right">{paidPercent}%</span>
                        </div>
                      </div>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <div className="px-4 pb-4 pt-1 border-t border-border">
                        <div className="flex items-center justify-between mb-3 pt-3">
                          <div className="flex gap-4 text-xs">
                            <span className="text-emerald-500 font-medium">Pago: {formatCurrency(paidTotal)}</span>
                            <span className="text-destructive font-medium">Pendente: {formatCurrency(pendingTotal)}</span>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleCreateEntry(cat.id)}>
                                <Plus className="mr-2 h-4 w-4" /> Adicionar Item
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditCategory(cat)}>
                                <Edit className="mr-2 h-4 w-4" /> Editar Categoria
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteCategoryClick(cat.id)}>
                                <Trash2 className="mr-2 h-4 w-4" /> Excluir Categoria
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {entries.length === 0 ? (
                          <p className="text-center text-xs text-muted-foreground py-4">Nenhum item nesta categoria.</p>
                        ) : (
                          <div className="space-y-1">
                            {entries.map((entry) => {
                              const dueDate = new Date(entry.due_date + "T12:00:00");
                              const effectiveStatus = getEffectiveStatus(entry);
                              const isOverdue = effectiveStatus !== "paid" && isBefore(dueDate, new Date()) && !isToday(dueDate);
                              const isPaid = effectiveStatus === "paid";
                              return (
                                <div key={entry.id} className={cn(
                                  "flex items-center justify-between rounded-lg p-3 transition-colors",
                                  isPaid ? "bg-emerald-500/5" : isOverdue ? "bg-destructive/5" : "bg-muted/30"
                                )}>
                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className={cn(
                                      "h-2 w-2 rounded-full shrink-0",
                                      isPaid ? "bg-emerald-500" : isOverdue ? "bg-destructive" : "bg-amber-400"
                                    )} />
                                    <div className="flex-1 min-w-0">
                                      <p className={cn("text-sm font-medium truncate", isPaid && "text-muted-foreground line-through")}>{entry.name}</p>
                                      <p className={cn("text-[11px]", isOverdue ? "text-destructive" : "text-muted-foreground")}>
                                        {entry.is_fixed ? `Dia ${dueDate.getDate()}` : format(dueDate, "dd/MM/yyyy")}
                                        {entry.is_fixed && <span className="ml-1 text-muted-foreground">· Fixo</span>}
                                        {isFuncionarios && entry.vale_amount && entry.vale_amount > 0 && (
                                          <span className="ml-1 text-amber-500">· Vale {formatCurrency(entry.vale_amount)}</span>
                                        )}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 ml-2">
                                    <p className={cn("text-sm font-semibold", isPaid ? "text-emerald-500" : "text-foreground")}>
                                      {formatCurrency(entry.value)}
                                    </p>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-7 w-7">
                                          <MoreHorizontal className="h-3.5 w-3.5" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        {!isPaid ? (
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
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            })}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={handleCreateCategory}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all active:scale-95"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Dialogs */}
      <CategoryFormDialog open={categoryFormOpen} onOpenChange={setCategoryFormOpen} category={selectedCategory} />
      <ContaEntryFormDialog open={entryFormOpen} onOpenChange={setEntryFormOpen} entry={selectedEntry} categoryId={entryCategoryId} />
      <ValeDialog open={valeDialogOpen} onOpenChange={setValeDialogOpen} entry={valeEntry} />
      <DeleteConfirmDialog open={deleteCategoryDialogOpen} onOpenChange={setDeleteCategoryDialogOpen} onConfirm={handleDeleteCategoryConfirm} title="Excluir Categoria" description="Tem certeza? Os itens dentro desta categoria não serão excluídos." isLoading={deleteCategory.isPending} />
      <DeleteConfirmDialog open={deleteEntryDialogOpen} onOpenChange={setDeleteEntryDialogOpen} onConfirm={handleDeleteEntryConfirm} title="Excluir Item" description="Tem certeza que deseja excluir este item?" isLoading={deleteBill.isPending} />
      <DeleteConfirmDialog open={dismissBillDialogOpen} onOpenChange={setDismissBillDialogOpen} onConfirm={handleDismissBillConfirm} title="Apagar Conta" description="Tem certeza que deseja apagar esta conta? Essa ação não pode ser desfeita." isLoading={deleteBill.isPending} />
    </MainLayout>
  );
};

export default Contas;
