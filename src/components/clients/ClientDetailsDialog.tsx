import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Trash2, Search, Calendar, Bike, DollarSign, Pencil, CheckCircle2, Clock } from 'lucide-react';
import { Client } from '@/hooks/useClients';
import { useRidesByClient, useDeleteRide, useToggleRidePayment, RideWithRelations } from '@/hooks/useRides';
import { useMotoboys } from '@/hooks/useMotoboys';
import { RideFormDialog } from './RideFormDialog';
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ClientDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
}

export function ClientDetailsDialog({ open, onOpenChange, client }: ClientDetailsDialogProps) {
  const [rideFormOpen, setRideFormOpen] = useState(false);
  const [editingRide, setEditingRide] = useState<RideWithRelations | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rideToDelete, setRideToDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [motoboyFilter, setMotoboyFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState('');

  const { data: rides, isLoading } = useRidesByClient(client?.id || '');
  const { data: motoboys } = useMotoboys();
  const deleteRide = useDeleteRide();
  const togglePayment = useToggleRidePayment();

  const filteredRides = (rides || []).filter(ride => {
    const matchesMotoboy = motoboyFilter === 'all' || ride.motoboy_id === motoboyFilter;
    const matchesDate = !dateFilter || ride.ride_date === dateFilter;
    const matchesSearch = !searchTerm || 
      ride.motoboys?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ride.motoboys?.number?.includes(searchTerm);
    return matchesMotoboy && matchesDate && matchesSearch;
  });

  // Calculate stats
  const totalRides = filteredRides.length;
  const totalValue = filteredRides.reduce((acc, r) => acc + Number(r.value), 0);
  const paidValue = filteredRides.filter(r => (r as any).payment_status === 'paid').reduce((acc, r) => acc + Number(r.value), 0);
  const unpaidValue = totalValue - paidValue;
  // Group by motoboy
  const motoboyStats = new Map<string, { name: string; number: string | null; rides: number; value: number }>();
  filteredRides.forEach(ride => {
    const key = ride.motoboy_id;
    const current = motoboyStats.get(key) || { 
      name: ride.motoboys?.name || 'Desconhecido', 
      number: ride.motoboys?.number || null,
      rides: 0, 
      value: 0 
    };
    motoboyStats.set(key, {
      ...current,
      rides: current.rides + 1,
      value: current.value + Number(ride.value),
    });
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return format(new Date(year, month - 1, day), "dd/MM/yyyy", { locale: ptBR });
  };

  const handleEditClick = (ride: RideWithRelations) => {
    setEditingRide(ride);
    setRideFormOpen(true);
  };

  const handleNewRide = () => {
    setEditingRide(null);
    setRideFormOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setRideToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (rideToDelete) {
      await deleteRide.mutateAsync(rideToDelete);
      setDeleteDialogOpen(false);
      setRideToDelete(null);
    }
  };

  const activeMotoboys = (motoboys || []).filter(m => m.status === 'active');

  if (!client) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <span className="text-sm font-medium text-primary">
                  {client.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                </span>
              </div>
              {client.name}
            </DialogTitle>
            <DialogDescription>
              Detalhes das corridas e histórico do cliente
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-b">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Bike className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Corridas</p>
                <p className="text-lg font-semibold">{totalRides}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Valor Total</p>
                <p className="text-lg font-semibold">{formatCurrency(totalValue)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-success/10">
              <CheckCircle2 className="h-5 w-5 text-success" />
              <div>
                <p className="text-sm text-muted-foreground">Pago</p>
                <p className="text-lg font-semibold text-success">{formatCurrency(paidValue)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-warning/10">
              <Clock className="h-5 w-5 text-warning" />
              <div>
                <p className="text-sm text-muted-foreground">A Pagar</p>
                <p className="text-lg font-semibold text-warning">{formatCurrency(unpaidValue)}</p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
            <div className="relative flex-1 min-w-0 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar motoboy..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={motoboyFilter} onValueChange={setMotoboyFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Motoboy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os motoboys</SelectItem>
                {activeMotoboys.map((motoboy) => (
                  <SelectItem key={motoboy.id} value={motoboy.id}>
                    {motoboy.number ? `#${motoboy.number} - ` : ''}{motoboy.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full sm:w-[160px]"
              placeholder="Data"
            />

            <div className="hidden sm:flex sm:flex-1" />

            <Button onClick={handleNewRide} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Nova Corrida
            </Button>
          </div>

          {/* Rides Table */}
          <div className="flex-1 overflow-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredRides.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {rides?.length === 0 
                  ? "Nenhuma corrida registrada para este cliente."
                  : "Nenhuma corrida encontrada com os filtros aplicados."}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Motoboy</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead>Observações</TableHead>
                    <TableHead className="w-[70px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRides.map((ride) => (
                    <TableRow key={ride.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {formatDate(ride.ride_date)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
                            <span className="text-xs font-medium text-primary">
                              {ride.motoboys?.number || ride.motoboys?.name?.slice(0, 2).toUpperCase() || '?'}
                            </span>
                          </div>
                          {ride.motoboys?.name || 'Desconhecido'}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(Number(ride.value))}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`gap-1.5 text-xs font-medium ${
                            (ride as any).payment_status === 'paid'
                              ? 'text-success hover:text-success'
                              : 'text-warning hover:text-warning'
                          }`}
                          onClick={() => togglePayment.mutate({
                            id: ride.id,
                            payment_status: (ride as any).payment_status === 'paid' ? 'pending' : 'paid'
                          })}
                          disabled={togglePayment.isPending}
                        >
                          {(ride as any).payment_status === 'paid' ? (
                            <><CheckCircle2 className="h-4 w-4" /> Pago</>
                          ) : (
                            <><Clock className="h-4 w-4" /> Não Pago</>
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-[200px] truncate">
                        {ride.notes || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEditClick(ride)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteClick(ride.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Summary */}
          <div className="mt-4 text-sm text-muted-foreground border-t pt-4">
            Mostrando {filteredRides.length} de {rides?.length || 0} corridas
          </div>
        </DialogContent>
      </Dialog>

      {/* Ride Form Dialog */}
      <RideFormDialog 
        open={rideFormOpen} 
        onOpenChange={setRideFormOpen}
        preselectedClientId={client?.id}
        editingRide={editingRide}
      />

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="Excluir Corrida"
        description="Tem certeza que deseja excluir esta corrida? Esta ação não pode ser desfeita."
        isLoading={deleteRide.isPending}
      />
    </>
  );
}
