import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useCreateRide } from '@/hooks/useRides';
import { useMotoboys } from '@/hooks/useMotoboys';
import { useClients } from '@/hooks/useClients';
import { format } from 'date-fns';

interface RideFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedClientId?: string;
}

export function RideFormDialog({ open, onOpenChange, preselectedClientId }: RideFormDialogProps) {
  const [clientId, setClientId] = useState('');
  const [motoboyId, setMotoboyId] = useState('');
  const [rideDate, setRideDate] = useState('');
  const [value, setValue] = useState('');
  const [notes, setNotes] = useState('');

  const createRide = useCreateRide();
  const { data: motoboys } = useMotoboys();
  const { data: clients } = useClients();
  const isLoading = createRide.isPending;

  const activeMotoboys = (motoboys || []).filter(m => m.status === 'active');

  useEffect(() => {
    if (open) {
      setClientId(preselectedClientId || '');
      setMotoboyId('');
      setRideDate(format(new Date(), 'yyyy-MM-dd'));
      setValue('');
      setNotes('');
    }
  }, [open, preselectedClientId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = { 
      client_id: clientId,
      motoboy_id: motoboyId,
      ride_date: rideDate,
      value: parseFloat(value) || 0,
      notes: notes || null,
    };
    
    try {
      await createRide.mutateAsync(data);
      onOpenChange(false);
    } catch (error) {
      // Error is handled by the mutation's onError callback
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Registrar Corrida</DialogTitle>
          <DialogDescription>
            Registre uma nova corrida para um cliente.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client">Cliente *</Label>
            <Select value={clientId} onValueChange={setClientId} required disabled={!!preselectedClientId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o cliente" />
              </SelectTrigger>
              <SelectContent>
                {(clients || []).map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="motoboy">Motoboy *</Label>
            <Select value={motoboyId} onValueChange={setMotoboyId} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o motoboy" />
              </SelectTrigger>
              <SelectContent>
                {activeMotoboys.map((motoboy) => (
                  <SelectItem key={motoboy.id} value={motoboy.id}>
                    {motoboy.number ? `#${motoboy.number} - ` : ''}{motoboy.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rideDate">Data da Corrida *</Label>
            <Input
              id="rideDate"
              type="date"
              value={rideDate}
              onChange={(e) => setRideDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="value">Valor (R$) *</Label>
            <Input
              id="value"
              type="number"
              step="0.01"
              min="0"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="0,00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observações sobre a corrida"
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !clientId || !motoboyId || !rideDate}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Registrar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
