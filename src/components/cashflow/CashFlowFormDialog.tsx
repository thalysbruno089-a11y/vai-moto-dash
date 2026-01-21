import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { CashFlowEntry, useCreateCashFlow, useUpdateCashFlow } from '@/hooks/useCashFlow';
import { useCategories } from '@/hooks/useCategories';
import { Database } from '@/integrations/supabase/types';

type FlowType = Database['public']['Enums']['flow_type'];

interface CashFlowFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry?: CashFlowEntry | null;
  defaultType?: FlowType;
}

export function CashFlowFormDialog({ open, onOpenChange, entry, defaultType = 'revenue' }: CashFlowFormDialogProps) {
  const [description, setDescription] = useState('');
  const [value, setValue] = useState('');
  const [type, setType] = useState<FlowType>(defaultType);
  const [categoryId, setCategoryId] = useState<string>('');
  const [flowDate, setFlowDate] = useState(new Date().toISOString().split('T')[0]);
  const [isRecurring, setIsRecurring] = useState(false);

  const { data: categories } = useCategories();
  const createCashFlow = useCreateCashFlow();
  const updateCashFlow = useUpdateCashFlow();
  const isLoading = createCashFlow.isPending || updateCashFlow.isPending;
  const isEditing = !!entry;

  // Filter categories by type
  const filteredCategories = categories?.filter(c => c.type === type) || [];

  useEffect(() => {
    if (entry) {
      setDescription(entry.description || '');
      setValue(entry.value.toString());
      setType(entry.type);
      setCategoryId(entry.category_id || '');
      setFlowDate(entry.flow_date);
      setIsRecurring(entry.is_recurring);
    } else {
      setDescription('');
      setValue('');
      setType(defaultType);
      setCategoryId('');
      setFlowDate(new Date().toISOString().split('T')[0]);
      setIsRecurring(false);
    }
  }, [entry, open, defaultType]);

  // Reset category when type changes
  useEffect(() => {
    if (!isEditing) {
      setCategoryId('');
    }
  }, [type, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = { 
      description: description || null,
      value: parseFloat(value) || 0,
      type,
      category_id: categoryId || null,
      flow_date: flowDate,
      is_recurring: isRecurring,
    };
    
    if (isEditing && entry) {
      await updateCashFlow.mutateAsync({ id: entry.id, ...data });
    } else {
      await createCashFlow.mutateAsync(data);
    }
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Lançamento' : type === 'revenue' ? 'Nova Entrada' : 'Nova Saída'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="flowDate">Data *</Label>
              <Input
                id="flowDate"
                type="date"
                value={flowDate}
                onChange={(e) => setFlowDate(e.target.value)}
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
            <Label htmlFor="type">Tipo *</Label>
            <Select value={type} onValueChange={(v) => setType(v as FlowType)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="revenue">Entrada</SelectItem>
                <SelectItem value="expense">Saída</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Sem categoria</SelectItem>
                {filteredCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição do lançamento"
              maxLength={200}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="recurring"
              checked={isRecurring}
              onCheckedChange={setIsRecurring}
            />
            <Label htmlFor="recurring">Lançamento recorrente</Label>
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
