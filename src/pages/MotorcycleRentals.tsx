import { useMemo, useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMotorcycleRentals, useDeleteRental } from "@/hooks/useMotorcycleRentals";
import RentalFormDialog from "@/components/rentals/RentalFormDialog";
import RentalEditDialog from "@/components/rentals/RentalEditDialog";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { Bike, DollarSign, Calendar, TrendingUp, Trash2 } from "lucide-react";

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const formatDate = (d: string) => {
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
};

const daysBetween = (start: string, end: string) => {
  const s = new Date(start + "T12:00:00");
  const e = new Date(end + "T12:00:00");
  return Math.max(1, Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)));
};

const MotorcycleRentals = () => {
  const { data: rentals = [], isLoading } = useMotorcycleRentals();
  const deleteRental = useDeleteRental();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deletePlate, setDeletePlate] = useState("");
  const [startFilter, setStartFilter] = useState("");
  const [endFilter, setEndFilter] = useState("");
  const [searchFilter, setSearchFilter] = useState("");

  const today = new Date().toISOString().split("T")[0];

  const filtered = useMemo(() => {
    return rentals.filter((r) => {
      if (searchFilter && !r.renter_name.toLowerCase().includes(searchFilter.toLowerCase()) && !r.plate.toLowerCase().includes(searchFilter.toLowerCase())) return false;
      if (startFilter && r.pickup_date < startFilter) return false;
      if (endFilter && r.pickup_date > endFilter) return false;
      return true;
    });
  }, [rentals, startFilter, endFilter, searchFilter]);

  const activeRentals = filtered.filter((r) => r.status === "active");
  const returnedRentals = filtered.filter((r) => r.status === "returned");

  const totalActiveRevenue = activeRentals.reduce((sum, r) => {
    const days = daysBetween(r.pickup_date, today);
    return sum + days * Number(r.daily_rate);
  }, 0);

  const totalReturnedRevenue = returnedRentals.reduce((sum, r) => {
    const days = r.return_date ? daysBetween(r.pickup_date, r.return_date) : 0;
    return sum + days * Number(r.daily_rate);
  }, 0);

  const totalRevenue = totalActiveRevenue + totalReturnedRevenue;

  return (
    <MainLayout title="Aluguel de Motos" subtitle="Controle de motos alugadas">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-4">
          <RentalFormDialog />
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Bike className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Motos Alugadas</p>
                  <p className="text-2xl font-bold">{activeRentals.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Receita Ativa</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(totalActiveRevenue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Devolvidas</p>
                  <p className="text-2xl font-bold">{returnedRentals.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100">
                  <TrendingUp className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Receita Total</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                placeholder="Buscar por nome ou placa..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
              />
              <Input
                type="date"
                value={startFilter}
                onChange={(e) => setStartFilter(e.target.value)}
                placeholder="Data início"
              />
              <Input
                type="date"
                value={endFilter}
                onChange={(e) => setEndFilter(e.target.value)}
                placeholder="Data fim"
              />
            </div>
          </CardContent>
        </Card>

        {/* Rentals List */}
        {isLoading ? (
          <p className="text-center text-muted-foreground py-8">Carregando...</p>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Bike className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum aluguel encontrado</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((rental) => {
              const endDate = rental.return_date || today;
              const days = daysBetween(rental.pickup_date, endDate);
              const totalValue = days * Number(rental.daily_rate);

              return (
                <Card key={rental.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Bike className="h-5 w-5" />
                        {rental.plate}
                      </CardTitle>
                      <Badge variant={rental.status === "active" ? "default" : "secondary"}>
                        {rental.status === "active" ? "Alugada" : "Devolvida"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cor:</span>
                      <span className="font-medium">{rental.color}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Locatário:</span>
                      <span className="font-medium">{rental.renter_name}</span>
                    </div>
                    {rental.renter_phone && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Telefone:</span>
                        <span className="font-medium">{rental.renter_phone}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Valor/Dia:</span>
                      <span className="font-medium">{formatCurrency(Number(rental.daily_rate))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Retirada:</span>
                      <span className="font-medium">{formatDate(rental.pickup_date)}</span>
                    </div>
                    {rental.return_date && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Devolução:</span>
                        <span className="font-medium">{formatDate(rental.return_date)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Dias:</span>
                      <span className="font-medium">{days}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 mt-2">
                      <span className="text-muted-foreground font-medium">Total:</span>
                      <span className="font-bold text-primary">{formatCurrency(totalValue)}</span>
                    </div>
                    {rental.notes && (
                      <p className="text-xs text-muted-foreground italic mt-2">{rental.notes}</p>
                    )}
                    <div className="flex gap-2 mt-3 pt-2 border-t">
                      <RentalEditDialog rental={rental} />
                      <Button
                        variant="outline"
                        size="icon"
                        className="text-destructive"
                        onClick={() => { setDeleteId(rental.id); setDeletePlate(rental.plate); }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <DeleteConfirmDialog
          open={!!deleteId}
          onOpenChange={(open) => { if (!open) setDeleteId(null); }}
          onConfirm={() => { if (deleteId) deleteRental.mutate(deleteId, { onSuccess: () => setDeleteId(null) }); }}
          title="Excluir Aluguel"
          description={`Deseja excluir o aluguel da moto ${deletePlate}?`}
        />
      </div>
    </MainLayout>
  );
};

export default MotorcycleRentals;
