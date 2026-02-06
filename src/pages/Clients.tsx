import { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import StatCard from "@/components/dashboard/StatCard";
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
import { Users, Bike, DollarSign, Search, MoreHorizontal, Eye, Edit, Trash2, Loader2, Plus, CalendarDays } from "lucide-react";
import { useClientsWithStats, useDeleteClient, ClientWithStats } from "@/hooks/useClients";
import { ClientFormDialog } from "@/components/clients/ClientFormDialog";
import { ClientDetailsDialog } from "@/components/clients/ClientDetailsDialog";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const Clients = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientWithStats | null>(null);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState("");

  const { data: clients, isLoading } = useClientsWithStats();
  const deleteClient = useDeleteClient();

  const filteredClients = (clients || []).filter((c) => {
    return c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           c.phone?.includes(searchTerm) ||
           c.address?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getClientValue = (c: ClientWithStats) => {
    if (dateFilter) {
      const dayStats = c.rides_by_date.find(d => d.date === dateFilter);
      return { rides: dayStats?.total_rides || 0, value: dayStats?.total_value || 0 };
    }
    return { rides: c.total_rides, value: c.total_value };
  };

  const totalClients = clients?.length || 0;
  const totalRides = filteredClients.reduce((acc, c) => acc + getClientValue(c).rides, 0);
  const totalValue = filteredClients.reduce((acc, c) => acc + getClientValue(c).value, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };
  const formatDateLabel = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return format(new Date(year, month - 1, day), "dd/MM/yyyy", { locale: ptBR });
  };

  const handleViewDetails = (client: ClientWithStats) => {
    setSelectedClient(client);
    setDetailsOpen(true);
  };

  const handleEditClick = (client: ClientWithStats) => {
    setSelectedClient(client);
    setFormOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setClientToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (clientToDelete) {
      await deleteClient.mutateAsync(clientToDelete);
      setDeleteDialogOpen(false);
      setClientToDelete(null);
    }
  };

  const handleFormClose = (open: boolean) => {
    setFormOpen(open);
    if (!open) {
      setSelectedClient(null);
    }
  };

  return (
    <MainLayout title="Clientes" subtitle="Gerencie clientes e suas corridas">
      {/* Stats */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-3 mb-6 sm:mb-8">
        <StatCard
          title="Total de Clientes"
          value={totalClients.toString()}
          icon={<Users className="h-6 w-6 text-primary" />}
        />
        <StatCard
          title={dateFilter ? `Corridas em ${formatDateLabel(dateFilter)}` : "Total de Corridas"}
          value={totalRides.toString()}
          icon={<Bike className="h-6 w-6 text-primary" />}
        />
        <StatCard
          title={dateFilter ? `Valor em ${formatDateLabel(dateFilter)}` : "Valor Total"}
          value={formatCurrency(totalValue)}
          icon={<DollarSign className="h-6 w-6 text-success" />}
          variant="success"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-center sm:flex-wrap">
        <div className="relative flex-1 min-w-0 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="relative sm:w-[180px]">
          <CalendarDays className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="pl-9"
            placeholder="Filtrar por dia"
          />
        </div>

        {dateFilter && (
          <Button variant="ghost" size="sm" onClick={() => setDateFilter("")} className="text-muted-foreground">
            Limpar filtro
          </Button>
        )}

        <div className="hidden sm:flex sm:flex-1" />

        <Button onClick={() => { setSelectedClient(null); setFormOpen(true); }} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Novo Cliente
        </Button>
      </div>

      {/* Table */}
      <div className="data-table">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {clients?.length === 0 
              ? "Nenhum cliente cadastrado."
              : "Nenhum cliente encontrado com os filtros aplicados."}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>Cliente</TableHead>
                <TableHead>Telefone</TableHead>
                 <TableHead className="text-center">Corridas</TableHead>
                 <TableHead className="text-right">{dateFilter ? "Valor do Dia" : "Valor Total"}</TableHead>
                <TableHead className="w-[70px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => (
                <TableRow 
                  key={client.id} 
                  className="border-border cursor-pointer hover:bg-muted/50"
                  onClick={() => handleViewDetails(client)}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                        <span className="text-sm font-medium text-primary">
                          {client.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p>{client.name}</p>
                        {client.address && (
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {client.address}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {client.phone || '-'}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center justify-center rounded-full bg-info/10 px-2.5 py-0.5 text-sm font-medium text-info">
                      {getClientValue(client).rides}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(getClientValue(client).value)}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewDetails(client)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditClick(client)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handleDeleteClick(client.id)}
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
        Mostrando {filteredClients.length} de {clients?.length || 0} clientes
      </div>

      {/* Client Form Dialog */}
      <ClientFormDialog 
        open={formOpen} 
        onOpenChange={handleFormClose}
        client={selectedClient}
      />

      {/* Client Details Dialog */}
      <ClientDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        client={selectedClient}
      />

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="Excluir Cliente"
        description="Tem certeza que deseja excluir este cliente? Todas as corridas associadas também serão excluídas. Esta ação não pode ser desfeita."
        isLoading={deleteClient.isPending}
      />
    </MainLayout>
  );
};

export default Clients;
