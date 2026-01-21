import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { Motoboy, useCreateMotoboy, useUpdateMotoboy } from '@/hooks/useMotoboys';
import { Database } from '@/integrations/supabase/types';

type ShiftType = Database['public']['Enums']['shift_type'];
type StatusType = Database['public']['Enums']['status_type'];

interface MotoboyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  motoboy?: Motoboy | null;
}

const shiftLabels: Record<ShiftType, string> = {
  day: 'Diurno',
  night: 'Noturno',
  weekend: 'Final de Semana',
  star: 'Estrela',
  free: 'Livre',
};

export function MotoboyFormDialog({ open, onOpenChange, motoboy }: MotoboyFormDialogProps) {
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [shift, setShift] = useState<ShiftType>('day');
  const [status, setStatus] = useState<StatusType>('active');

  const createMotoboy = useCreateMotoboy();
  const updateMotoboy = useUpdateMotoboy();
  const isLoading = createMotoboy.isPending || updateMotoboy.isPending;
  const isEditing = !!motoboy;

  useEffect(() => {
    if (motoboy) {
      setName(motoboy.name);
      setCpf(motoboy.cpf || '');
      setPhone(motoboy.phone || '');
      setShift(motoboy.shift);
      setStatus(motoboy.status);
    } else {
      setName('');
      setCpf('');
      setPhone('');
      setShift('day');
      setStatus('active');
    }
  }, [motoboy, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = { name, cpf: cpf || null, phone: phone || null, shift, status };
    
    if (isEditing && motoboy) {
      await updateMotoboy.mutateAsync({ id: motoboy.id, ...data });
    } else {
      await createMotoboy.mutateAsync(data);
    }
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Motoboy' : 'Novo Motoboy'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome completo"
              required
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cpf">CPF</Label>
            <Input
              id="cpf"
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              placeholder="000.000.000-00"
              maxLength={14}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(00) 00000-0000"
              maxLength={15}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="shift">Turno *</Label>
            <Select value={shift} onValueChange={(v) => setShift(v as ShiftType)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o turno" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(shiftLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status *</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as StatusType)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
              </SelectContent>
            </Select>
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
