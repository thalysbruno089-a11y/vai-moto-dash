import { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tags, Search, MoreHorizontal, Edit, Trash2, Loader2, Plus, TrendingDown, Filter } from "lucide-react";
import { useCategories, useDeleteCategory, Category } from "@/hooks/useCategories";
import { useCashFlow } from "@/hooks/useCashFlow";
import { CategoryFormDialog } from "@/components/categories/CategoryFormDialog";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import StatCard from "@/components/dashboard/StatCard";

const Categories = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  const { data: categories, isLoading } = useCategories();
  const { data: cashFlow } = useCashFlow();
  const deleteCategory = useDeleteCategory();

  // Filter only expense categories
  const expenseCategories = (categories || []).filter(c => c.type === 'expense');

  const filteredCategories = expenseCategories.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || c.id === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Calcular totais por categoria
  const getCategoryTotal = (categoryId: string) => {
    return (cashFlow || [])
      .filter(entry => entry.category_id === categoryId)
      .reduce((acc, entry) => acc + Number(entry.value), 0);
  };

  const totalExpensesByCategory = expenseCategories.reduce((acc, cat) => acc + getCategoryTotal(cat.id), 0);

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setFormOpen(true);
  };

  const handleCreate = () => {
    setSelectedCategory(null);
    setFormOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setCategoryToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (categoryToDelete) {
      await deleteCategory.mutateAsync(categoryToDelete);
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <MainLayout title="Categorias" subtitle="Gerencie categorias de despesas">
      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <StatCard
          title="Total de Categorias"
          value={String(expenseCategories.length)}
          icon={<Tags className="h-6 w-6 text-primary" />}
        />
        <StatCard
          title="Total em Despesas"
          value={formatCurrency(totalExpensesByCategory)}
          icon={<TrendingDown className="h-6 w-6 text-destructive" />}
          variant="destructive"
        />
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

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[200px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filtrar categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {expenseCategories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex-1" />

        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Categoria
        </Button>
      </div>

      {/* Table */}
      <div className="data-table">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {categories?.length === 0 
              ? "Nenhuma categoria cadastrada. Crie sua primeira categoria!"
              : "Nenhuma categoria encontrada com os filtros aplicados."}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>Nome</TableHead>
                <TableHead className="text-right">Total Acumulado</TableHead>
                <TableHead className="w-[70px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCategories.map((category) => (
                <TableRow key={category.id} className="border-border">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-destructive/10">
                        <TrendingDown className="h-4 w-4 text-destructive" />
                      </div>
                      {category.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    <span className="text-destructive">
                      {formatCurrency(getCategoryTotal(category.id))}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(category)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handleDeleteClick(category.id)}
                        >
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
        )}
      </div>

      {/* Summary */}
      <div className="mt-4 text-sm text-muted-foreground">
        Mostrando {filteredCategories.length} de {expenseCategories.length} categorias
      </div>

      {/* Category Form Dialog */}
      <CategoryFormDialog 
        open={formOpen} 
        onOpenChange={setFormOpen}
        category={selectedCategory}
      />

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="Excluir Categoria"
        description="Tem certeza que deseja excluir esta categoria? Os lançamentos associados não serão excluídos, apenas ficarão sem categoria."
        isLoading={deleteCategory.isPending}
      />
    </MainLayout>
  );
};

export default Categories;
