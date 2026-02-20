import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Pencil } from "lucide-react";
import { useUpdateRental, MotorcycleRental } from "@/hooks/useMotorcycleRentals";

interface Props {
  rental: MotorcycleRental;
}

const RentalEditDialog = ({ rental }: Props) => {
  const [open, setOpen] = useState(false);
  const [plate, setPlate] = useState(rental.plate);
  const [color, setColor] = useState(rental.color);
  const [renterName, setRenterName] = useState(rental.renter_name);
  const [renterPhone, setRenterPhone] = useState(rental.renter_phone || "");
  const [dailyRate, setDailyRate] = useState(String(rental.daily_rate));
  const [pickupDate, setPickupDate] = useState(rental.pickup_date);
  const [returnDate, setReturnDate] = useState(rental.return_date || "");
  const [notes, setNotes] = useState(rental.notes || "");
  const [status, setStatus] = useState(rental.status);

  const updateRental = useUpdateRental();

  useEffect(() => {
    if (open) {
      setPlate(rental.plate);
      setColor(rental.color);
      setRenterName(rental.renter_name);
      setRenterPhone(rental.renter_phone || "");
      setDailyRate(String(rental.daily_rate));
      setPickupDate(rental.pickup_date);
      setReturnDate(rental.return_date || "");
      setNotes(rental.notes || "");
      setStatus(rental.status);
    }
  }, [open, rental]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateRental.mutate(
      {
        id: rental.id,
        plate: plate.trim().toUpperCase(),
        color: color.trim(),
        renter_name: renterName.trim(),
        renter_phone: renterPhone.trim() || null,
        daily_rate: Number(dailyRate),
        pickup_date: pickupDate,
        return_date: returnDate || null,
        notes: notes.trim() || null,
        status: returnDate ? "returned" : "active",
      },
      { onSuccess: () => setOpen(false) }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Aluguel</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Placa</Label>
              <Input value={plate} onChange={(e) => setPlate(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Cor</Label>
              <Input value={color} onChange={(e) => setColor(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Nome do Locatário</Label>
            <Input value={renterName} onChange={(e) => setRenterName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Telefone</Label>
            <Input value={renterPhone} onChange={(e) => setRenterPhone(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valor/Dia (R$)</Label>
              <Input type="number" min="0" step="0.01" value={dailyRate} onChange={(e) => setDailyRate(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Data de Retirada</Label>
              <Input type="date" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Data de Devolução</Label>
            <Input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} />
            <p className="text-xs text-muted-foreground">Preencha quando a moto for devolvida</p>
          </div>
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={updateRental.isPending}>
            {updateRental.isPending ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RentalEditDialog;
