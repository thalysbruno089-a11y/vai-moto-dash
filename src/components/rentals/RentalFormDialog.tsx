import { useState } from "react";
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
import { Plus } from "lucide-react";
import { useCreateRental } from "@/hooks/useMotorcycleRentals";

const RentalFormDialog = () => {
  const [open, setOpen] = useState(false);
  const [plate, setPlate] = useState("");
  const [color, setColor] = useState("");
  const [renterName, setRenterName] = useState("");
  const [renterPhone, setRenterPhone] = useState("");
  const [dailyRate, setDailyRate] = useState("");
  const [pickupDate, setPickupDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState("");

  const createRental = useCreateRental();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plate.trim() || !renterName.trim() || !dailyRate) return;

    createRental.mutate(
      {
        plate: plate.trim().toUpperCase(),
        color: color.trim(),
        renter_name: renterName.trim(),
        renter_phone: renterPhone.trim() || null,
        daily_rate: Number(dailyRate),
        pickup_date: pickupDate,
        return_date: null,
        notes: notes.trim() || null,
      },
      {
        onSuccess: () => {
          setOpen(false);
          setPlate("");
          setColor("");
          setRenterName("");
          setRenterPhone("");
          setDailyRate("");
          setPickupDate(new Date().toISOString().split("T")[0]);
          setNotes("");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" /> Novo Aluguel
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Aluguel de Moto</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Placa *</Label>
              <Input
                value={plate}
                onChange={(e) => setPlate(e.target.value)}
                placeholder="ABC-1234"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Cor *</Label>
              <Input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="Vermelha"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Nome do Locatário *</Label>
            <Input
              value={renterName}
              onChange={(e) => setRenterName(e.target.value)}
              placeholder="Nome completo"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Telefone do Locatário</Label>
            <Input
              value={renterPhone}
              onChange={(e) => setRenterPhone(e.target.value)}
              placeholder="(11) 99999-9999"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valor por Dia (R$) *</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={dailyRate}
                onChange={(e) => setDailyRate(e.target.value)}
                placeholder="50.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Data de Retirada *</Label>
              <Input
                type="date"
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Informações adicionais..."
            />
          </div>
          <Button type="submit" className="w-full" disabled={createRental.isPending}>
            {createRental.isPending ? "Salvando..." : "Registrar Aluguel"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RentalFormDialog;
