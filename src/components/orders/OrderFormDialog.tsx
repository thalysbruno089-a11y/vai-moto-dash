import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { Order, useCreateOrder, useUpdateOrder } from '@/hooks/useOrders';
import { useClients } from '@/hooks/useClients';
import { useMotoboys } from '@/hooks/useMotoboys';
import { Database } from '@/integrations/supabase/types';

type OrderStatus = Database['public']['Enums']['order_status'];

interface OrderFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order?: Order | null;
}

const statusLabels: Record<OrderStatus, string> = {
  pending: 'Aguardando',
  in_progress: 'Em trânsito',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
};

export function OrderFormDialog({ open, onOpenChange, order }: OrderFormDialogProps) {
  const [clientId, setClientId] = useState<string>('');
  const [motoboyId, setMotoboyId] = useState<string>('');
  const [value, setValue] = useState('');
  const [status, setStatus] = useState<OrderStatus>('pending');
  const [notes, setNotes] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: clients } = useClients();
  const { data: motoboys } = useMotoboys();
  const createOrder = useCreateOrder();
  const updateOrder = useUpdateOrder();
  const isLoading = createOrder.isPending || updateOrder.isPending;
  const isEditing = !!order;

  useEffect(() => {
    if (order) {
      setClientId(order.client_id || '');
      setMotoboyId(order.motoboy_id || '');
      setValue(order.value.toString());
      setStatus(order.status);
      setNotes(order.notes || '');
      setOrderDate(order.order_date);
    } else {
      setClientId('');
      setMotoboyId('');
      setValue('');
      setStatus('pending');
      setNotes('');
      setOrderDate(new Date().toISOString().split('T')[0]);
    }
  }, [order, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = { 
      client_id: clientId || null,
      motoboy_id: motoboyId || null,
      value: parseFloat(value) || 0,
      status,
      notes: notes || null,
      order_date: orderDate,
    };
    
    if (isEditing && order) {
      await updateOrder.mutateAsync({ id: order.id, ...data });
    } else {
      await createOrder.mutateAsync(data);
    }
    
    onOpenChange(false);
  };

  const activeMotoboys = motoboys?.filter(m => m.status === 'active') || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Pedido' : 'Novo Pedido'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="orderDate">Data do Pedido *</Label>
              <Input
                id="orderDate"
                type="date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="client">Cliente</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Sem cliente</SelectItem>
                {clients?.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="motoboy">Motoboy</Label>
            <Select value={motoboyId} onValueChange={setMotoboyId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o motoboy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Não atribuído</SelectItem>
                {activeMotoboys.map((motoboy) => (
                  <SelectItem key={motoboy.id} value={motoboy.id}>
                    {motoboy.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status *</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as OrderStatus)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observações sobre o pedido"
              maxLength={500}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Salvar' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
